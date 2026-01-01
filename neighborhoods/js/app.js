/**
 * @file app.js
 * @description Main application entry point and orchestration.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
console.log('app.js loading');
import { CONFIG } from './config.js';
import { STATE } from './state.js';
import { getUrlParams, toSlug } from './utils.js?v=202501';
import { initializeMap, computeOffsetPx, offsetLatLng, fitBoundsToNeighborhoods, smoothFlyTo } from './map.js?v=202501'; // computeOffsetPx needed for single mode
import { loadNeighborhoods } from './data.js';
import { setupUI, navigateNeighborhood } from './ui.js';
import { showInfoWindow, createMarkerIcon } from './markers.js';
import { setupFilters, applyFilters } from './filters.js'; // Import setupFilters here
import { initKeyboardNavigation } from './keyboard.js'; // WCAG keyboard navigation

// Expose global functions needed by HTML
window.navigateNeighborhood = navigateNeighborhood;

// Keyboard navigation for info window (left/right arrow keys)
document.addEventListener('keydown', (e) => {
    // Only handle arrow keys when info window is open
    if (!STATE.infoWindow || !STATE.infoWindow.getMap()) return;

    // Don't intercept if user is typing in an input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateNeighborhood(-1);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNeighborhood(1);
    }
});

// Click-to-close for info window (document-level delegation for reliability)
document.addEventListener('click', (e) => {
    // Only act when info window is open
    if (!STATE.infoWindow || !STATE.infoWindow.getMap()) return;

    // Check if click is inside .info-window
    const infoWindow = e.target.closest('.info-window');
    if (!infoWindow) return;

    // Don't close if clicking links, buttons, or nav arrows
    if (e.target.tagName === 'A' || e.target.closest('a') ||
        e.target.closest('button') || e.target.closest('.nav-arrow')) {
        return;
    }

    // Close the info window
    STATE.infoWindow.close();
    if (STATE.activeMarker) {
        STATE.activeMarker.setIcon(createMarkerIcon(STATE.activeMarker.markerColor, false));
    }
    STATE.activeMarker = null;
});

async function initMap() {
    try {
        // Set CSS variable from config for panel animations
        document.documentElement.style.setProperty('--panel-duration', CONFIG.animations.panelSlideDuration + 'ms');

        // Ensure Google Maps is loaded
        if (typeof google === 'undefined' || !google.maps) {
            console.error('Google Maps API not loaded');
            document.getElementById('loading-screen').innerHTML = '<div class="text-center"><p class="text-red-600 font-medium">Error loading map. Please refresh the page.</p></div>';
            return;
        }
        
        STATE.neighborhoods = await loadNeighborhoods();
        const urlParams = getUrlParams();
        
        // Handle single neighborhood mode
        const targetSlug = urlParams.neighborhood || urlParams.marker;
        if (targetSlug) {
            // If propertyType is not specified in URL, prefer "Homes" entry (find all matches first)
            const matchingNeighborhoods = STATE.neighborhoods.filter(n => toSlug(n.name) === targetSlug);
            let targetNeighborhood;
            

            
            if (matchingNeighborhoods.length > 0) {
                if (urlParams.propertyType) {
                    // Explicit propertyType specified - find exact match
                    const searchTerm = urlParams.propertyType.toLowerCase();
                    targetNeighborhood = matchingNeighborhoods.find(n => {
                        if (!n.propertyType) return false;
                        const propType = n.propertyType.toLowerCase();
                        // Check for exact match or specific keywords
                        if (searchTerm === 'homes' || searchTerm === 'home') {
                            return propType === 'homes' || propType === 'home';
                        } else if (searchTerm === 'townhomes' || searchTerm === 'townhome') {
                            return propType.includes('townhome');
                        } else if (searchTerm === 'condos' || searchTerm === 'condo') {
                            return propType.includes('condo');
                        } else if (searchTerm === 'lots' || searchTerm === 'lot') {
                            return propType.includes('lot') || propType.includes('land') || propType.includes('vacant');
                        }
                        return propType.includes(searchTerm);
                    }) || matchingNeighborhoods[0]; // Fallback to first if no match
                } else {
                    // No propertyType specified - prefer "Homes" entry
                    targetNeighborhood = matchingNeighborhoods.find(n => 
                        n.propertyType && (n.propertyType.toLowerCase() === 'homes' || n.propertyType.toLowerCase() === 'home')
                    ) || matchingNeighborhoods[0]; // Fallback to first if no Homes entry exists

                }
                
                // Filter to show only this neighborhood
                STATE.neighborhoods = [targetNeighborhood];
            }
        }
        
        // Check if we're in an iframe
        const isInIframe = window.self !== window.top;

        // Hide footer in single mode (sidebar hiding handled by CSS in <head>)
        if (urlParams.mode === 'single') {
            const footer = document.querySelector('.bg-neutral-800');
            if (footer) footer.style.display = 'none';
        }

        // Hide disclaimer and expand map when in iframe (regardless of single/full mode)
        if (isInIframe) {
            const disclaimer = document.getElementById('map-disclaimer');
            if (disclaimer) disclaimer.style.display = 'none';
            // Expand map to full height (remove 40px reserved for disclaimer)
            const mapLayout = document.getElementById('map-layout');
            if (mapLayout) mapLayout.style.height = '100dvh';
        }
        
        // Determine center and zoom
        let center, zoom;
        
        if (urlParams.lat && urlParams.lng) {
            // Use explicit coordinates
            center = { lat: urlParams.lat, lng: urlParams.lng };
            zoom = urlParams.zoom || 14;
        } else if (urlParams.neighborhood && STATE.neighborhoods.length === 1) {
            // Center on specific neighborhood
            center = STATE.neighborhoods[0].position;
            // Default zoom single-neighborhood vs full app
            zoom = urlParams.zoom || (urlParams.mode === 'single' ? CONFIG.map.singleNeighborhoodZoom : 14);
        } else {
            // Default: center on Watersound Origins area
            center = CONFIG.map.defaultCenter;
            zoom = urlParams.zoom || CONFIG.map.defaultZoom;
        }

        initializeMap(center, zoom);

        // Auto-fit map to all neighborhoods (unless in single mode or explicit coords provided)
        if (!urlParams.mode && !urlParams.lat && !urlParams.lng && STATE.neighborhoods.length > 1) {
            google.maps.event.addListenerOnce(STATE.map, 'idle', () => {
                fitBoundsToNeighborhoods(STATE.neighborhoods, 80);
            });
        }

        // Single/iframe mode: no animation (no pan/zoom/ripple). Wait for map to settle, then open card.
        if (urlParams.mode === 'single' && STATE.neighborhoods.length === 1) {
            // Use 'idle' event for centering (fires reliably on both fresh and cached loads)
            google.maps.event.addListenerOnce(STATE.map, 'idle', () => {
                // Use the computed zoom value directly (more reliable than getZoom after setZoom)
                const targetZoom = zoom;
                // Use geometric calculation for precise centering (same as full mode)
                const offsetPixels = computeOffsetPx(targetZoom);
                const offsetTarget = offsetLatLng(center, offsetPixels, targetZoom);
                STATE.map.setCenter(offsetTarget); // instant center change (no animation)
            });

            // Poll for markers to be ready, then open info window after map settles
            const openSingleModeMarker = () => {
                if (STATE.markers.length > 0) {
                    const first = STATE.markers[0];
                    const marker = first.marker;
                    const neighborhood = first.neighborhood;

                    // Activate ripple
                    marker.setIcon(createMarkerIcon(marker.markerColor, true));
                    STATE.activeMarker = marker;

                    // Show info window
                    showInfoWindow(marker, neighborhood);
                    console.log('Single mode: opened info window for', neighborhood.name);
                    return true;
                }
                return false;
            };

            // Wait for map to settle (300ms) then poll for markers
            setTimeout(() => {
                let singleAttempts = 0;
                const pollSingleMode = () => {
                    singleAttempts++;
                    if (openSingleModeMarker()) return;
                    if (singleAttempts < 30) {
                        setTimeout(pollSingleMode, 100);
                    } else {
                        console.log('Single mode: marker not found after 3 seconds');
                    }
                };
                pollSingleMode();
            }, 300);
        }
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Auto-open info window if requested via URL parameter
        if (urlParams.autoOpen && STATE.neighborhoods.length === 1 && urlParams.mode !== 'single') {
            // Poll for markers to be ready
            let autoOpenAttempts = 0;
            const pollAutoOpen = () => {
                autoOpenAttempts++;
                if (STATE.markers.length > 0) {
                    google.maps.event.trigger(STATE.markers[0].marker, 'click');
                    console.log('autoOpen: triggered marker click');
                } else if (autoOpenAttempts < 30) {
                    setTimeout(pollAutoOpen, 100);
                }
            };
            setTimeout(pollAutoOpen, 200);
        }

        // Auto-open specific marker if specified (shows all neighborhoods but opens one)
        if (urlParams.marker) {
            console.log('Marker parameter detected:', urlParams.marker);

            const openMarker = () => {
                const markerSlug = urlParams.marker.toLowerCase();
                const propertyType = urlParams.propertyType;

                console.log('Auto-opening marker:', markerSlug, 'propertyType:', propertyType);
                console.log('Total markers available:', STATE.markers.length);

                // Find matching marker
                const targetMarker = STATE.markers.find(m => {
                    const nameMatch = toSlug(m.neighborhood.name) === markerSlug;
                    if (!propertyType) return nameMatch;
                    // If propertyType specified, match both name and type (case-insensitive)
                    return nameMatch && m.neighborhood.propertyType?.toLowerCase() === propertyType.toLowerCase();
                });

                if (targetMarker) {
                    console.log('Found target marker, triggering click:', targetMarker.neighborhood.name);

                    // Auto-select the zip code filter for this neighborhood (visual only, no filtering)
                    const zipCode = targetMarker.neighborhood.zipCode;
                    if (zipCode) {
                        const zipTag = document.querySelector(`#areaFilters .amenity-tag[data-zipcode="${zipCode}"]`);
                        if (zipTag && !zipTag.classList.contains('selected')) {
                            zipTag.classList.add('selected');
                        }
                    }

                    // Use smoothFlyTo to center the marker with zoom 13
                    const markerPos = targetMarker.neighborhood.position;
                    smoothFlyTo(markerPos, 13);

                    // Trigger click after flight animation completes (flyToDuration + buffer)
                    setTimeout(() => {
                        google.maps.event.trigger(targetMarker.marker, 'click');
                    }, CONFIG.map.flyToDuration + 500);
                    return true; // Success
                } else {
                    console.log('Target marker not found yet, will retry...');
                    return false; // Retry needed
                }
            };

            // Poll until markers are ready (check every 200ms, up to 5 seconds)
            let attempts = 0;
            const maxAttempts = 25;
            const pollForMarkers = () => {
                attempts++;
                console.log(`Marker poll attempt ${attempts}/${maxAttempts}, markers: ${STATE.markers.length}`);

                if (STATE.markers.length > 0) {
                    const success = openMarker();
                    if (success) return;
                }

                if (attempts < maxAttempts) {
                    setTimeout(pollForMarkers, 200);
                } else {
                    console.log('Max attempts reached, marker not found');
                }
            };

            // Start polling after a short delay to let map initialize
            setTimeout(pollForMarkers, 500);
        }

        // Setup UI interactions
        setupUI();

        // Setup WCAG keyboard navigation (focus trapping, Escape handling)
        initKeyboardNavigation();

        // Setup filter event listeners and generate amenity tags
        setupFilters();

        // Apply initial filters to show communities count
        applyFilters();

        // Setup Property Type Buttons
        const activeClasses = ['bg-brand-500', 'text-white', 'border-brand-500', 'hover:bg-brand-600', 'active:bg-brand-700', 'dark:bg-brand-dark', 'dark:text-white', 'dark:border-brand-dark', 'dark:hover:bg-brand-dark-hover'];
        const inactiveClasses = ['bg-white', 'text-neutral-700', 'border-neutral-300', 'hover:bg-brand-100', 'hover:text-brand-700', 'active:bg-brand-200', 'dark:bg-dark-bg-elevated-2', 'dark:text-dark-text-primary', 'dark:border-dark-border', 'dark:hover:bg-brand-dark/20', 'dark:hover:text-brand-dark', 'dark:active:bg-brand-dark/30'];

        const updateButtonState = (btn, isActive) => {
            if (isActive) {
                btn.classList.remove(...inactiveClasses);
                btn.classList.add(...activeClasses);
            } else {
                btn.classList.remove(...activeClasses);
                btn.classList.add(...inactiveClasses);
            }
        };

        // Property type buttons are toggleable (multi-select). Clicking each will toggle its
        // active state independently so users can select Homes, Condos, both, or neither.
        document.querySelectorAll('.property-type-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const nextActive = !this.classList.contains('active');

                // Toggle active class & update visual state
                this.classList.toggle('active', nextActive);
                updateButtonState(this, nextActive);

                // Apply filters after toggling (supports both/none/one active)
                applyFilters();
            });
        });

    } catch (error) {
        console.error('Error initializing map:', error);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = '<div class="text-center"><p class="text-red-600 font-medium">Error loading map. Please refresh the page.</p></div>';
        } else {
            // Fallback if loading screen is gone (e.g. map initialized)
            const mapDiv = document.getElementById('map');
            if (mapDiv) {
                mapDiv.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-red-600 font-medium">Error loading map. Please refresh the page.</p></div>';
            }
        }
    }
}

// Expose initMap to global scope for Google Maps Callback
window.initMap = initMap;

// Check if Google Maps loaded before this module
// Expose initMap globally for Google Maps callback
window.appInitMap = initMap;

// Check if Google Maps is already ready (in case app.js loaded after Maps API)
if (window.googleMapsReady) {
    initMap();
}

// Fallback: If Google Maps doesn't load within 10 seconds, show error
setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        // Check if map is actually empty (initMap might have failed silently)
        if (!STATE.map) {
            console.warn('Map load timeout triggered.');
            
            // Attempt recovery if Google Maps API is loaded but callback failed
            if (typeof google !== 'undefined' && google.maps) {
                initMap().catch(e => console.error('Manual initMap failed:', e));
                return;
            }

            console.error('Map load timeout - initMap was not called or failed to complete');
            loadingScreen.innerHTML = `
                <div class="text-center px-4">
                    <p class="text-red-600 font-medium mb-2">Map failed to load.</p>
                    <p class="text-sm text-neutral-500">This may be due to a network issue or configuration error.</p>
                    <p class="text-xs text-neutral-400 mt-2">Status: ${typeof google !== 'undefined' ? 'API Loaded' : 'API Missing'}</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm">Refresh Page</button>
                </div>
            `;
        }
    }
}, 5000);

if (!window.location.search.includes('debug=true')) {
    document.addEventListener('keydown', function(e) {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'U') ||
            (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
            (e.ctrlKey && (e.key === 'p' || e.key === 'P'))
        ) {
            e.preventDefault();
        }
    });

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
}

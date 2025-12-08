/**
 * @file app.js
 * @description Main application entry point and orchestration.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { CONFIG } from './config.js';
import { STATE } from './state.js';
import { getUrlParams, toSlug } from './utils.js?v=202501';
import { initializeMap, computeOffsetPx, offsetLatLng, fitBoundsToNeighborhoods, smoothFlyTo } from './map.js?v=202501'; // computeOffsetPx needed for single mode
import { loadNeighborhoods } from './data.js';
import { setupUI, navigateNeighborhood } from './ui.js';
import { showInfoWindow, createMarkerIcon } from './markers.js';
import { setupFilters, applyFilters } from './filters.js'; // Import setupFilters here

// Expose global functions needed by HTML
window.navigateNeighborhood = navigateNeighborhood;

async function initMap() {
    try {

        
        // Ensure Google Maps is loaded
        if (typeof google === 'undefined' || !google.maps) {
            console.error('Google Maps API not loaded');
            document.getElementById('loading-screen').innerHTML = '<div class="text-center"><p class="text-red-600 font-medium">Error loading map. Please refresh the page.</p></div>';
            return;
        }
        
        STATE.neighborhoods = await loadNeighborhoods();
        const urlParams = getUrlParams();
        
        // Handle single neighborhood mode
        if (urlParams.neighborhood) {
            // If propertyType is not specified in URL, prefer "Homes" entry (find all matches first)
            const matchingNeighborhoods = STATE.neighborhoods.filter(n => toSlug(n.name) === urlParams.neighborhood);
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

        // Hide drawer, footer in single mode
        if (urlParams.mode === 'single') {
            const drawer = document.getElementById('sidebar');
            const drawerToggle = document.getElementById('drawer-toggle');
            const footer = document.querySelector('.bg-neutral-800');
            if (drawer) drawer.style.setProperty('display', 'none', 'important');
            if (drawerToggle) drawerToggle.style.display = 'none';
            if (footer) footer.style.display = 'none';
            document.querySelector('label[for="drawer-toggle"]')?.remove(); // Remove tab
        }

        // Hide disclaimer only if in iframe (regardless of single/full mode)
        if (isInIframe) {
            const disclaimer = document.getElementById('map-disclaimer');
            if (disclaimer) disclaimer.style.display = 'none';
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

        // Single/iframe mode: no animation (no pan/zoom/ripple). Set static offset center then open card.
        if (urlParams.mode === 'single' && STATE.neighborhoods.length === 1) {
            google.maps.event.addListenerOnce(STATE.map, 'projection_changed', () => {
                // Force zoom to 13 if not explicitly provided, to ensure it takes effect
                if (!urlParams.zoom) {
                    STATE.map.setZoom(13);
                }
                
                const currentZoom = STATE.map.getZoom();
                // Use geometric calculation for precise centering (same as full mode)
                const offsetPixels = computeOffsetPx(currentZoom);
                const offsetTarget = offsetLatLng(center, offsetPixels, currentZoom);
                STATE.map.setCenter(offsetTarget); // instant center change (no animation)
                // Open info window with active ripple in single mode
                if (STATE.markers.length > 0) {
                    const first = STATE.markers[0];
                    const marker = first.marker;
                    const neighborhood = first.neighborhood;

                    // Activate ripple
                    marker.setIcon(createMarkerIcon(marker.markerColor, true));
                    STATE.activeMarker = marker;

                    // Show info window
                    showInfoWindow(marker, neighborhood);
                }
            });
        }
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Auto-open info window if requested via URL parameter
        if (urlParams.autoOpen && STATE.neighborhoods.length === 1 && urlParams.mode !== 'single') {
            // Wait for markers to be created
            setTimeout(() => {
                if (STATE.markers.length > 0) {
                    google.maps.event.trigger(STATE.markers[0].marker, 'click');
                }
            }, 500);
        }

        // Auto-open specific marker if specified (shows all neighborhoods but opens one)

        if (urlParams.marker) {
            console.log('Marker parameter detected:', urlParams.marker);
            
            const openMarker = () => {
                const markerSlug = urlParams.marker.toLowerCase();
                const propertyType = urlParams.propertyType;
                
                console.log('Auto-opening marker:', markerSlug, 'propertyType:', propertyType);
                console.log('Total markers available:', STATE.markers.length);
                console.log('Available markers:', STATE.markers.map(m => ({ name: toSlug(m.neighborhood.name), type: m.neighborhood.propertyType })));
                
                // Find matching marker
                const targetMarker = STATE.markers.find(m => {
                    const nameMatch = toSlug(m.neighborhood.name) === markerSlug;
                    if (!propertyType) return nameMatch;
                    // If propertyType specified, match both name and type
                    return nameMatch && m.neighborhood.propertyType === propertyType;
                });
                
                if (targetMarker) {
                    console.log('Found target marker, triggering click:', targetMarker.neighborhood.name);
                    
                    // Auto-select the zip code filter for this neighborhood (visual only, no filtering)
                    const zipCode = targetMarker.neighborhood.zipCode;
                    if (zipCode) {
                        console.log('Auto-selecting zip code filter:', zipCode);
                        const zipTag = document.querySelector(`#areaFilters .amenity-tag[data-zipcode="${zipCode}"]`);
                        if (zipTag && !zipTag.classList.contains('selected')) {
                            zipTag.classList.add('selected');
                            // Don't call applyFilters() - we want to stay at zoom 13, not auto-zoom to fit bounds
                        }
                    }
                    
                    // Use smoothFlyTo to center the marker with zoom 13 (not 15)
                    const markerPos = targetMarker.neighborhood.position;
                    smoothFlyTo(markerPos, 13);
                    
                    // Trigger click after flight animation starts
                    setTimeout(() => {
                        google.maps.event.trigger(targetMarker.marker, 'click');
                    }, 500);
                } else {
                    console.log('Target marker not found');
                }
            };
            
            // Wait for map to finish fitting bounds and markers to be ready
            google.maps.event.addListenerOnce(STATE.map, 'idle', () => {
                setTimeout(openMarker, 300);
            });
            
            // Fallback: If idle doesn't fire within 3 seconds, try anyway
            setTimeout(() => {
                if (STATE.markers.length > 0 && !STATE.infoWindow.getMap()) {
                    console.log('Fallback: Opening marker after timeout');
                    openMarker();
                }
            }, 3000);
        }

        // Setup UI interactions
        setupUI();

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

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
import { showInfoWindow } from './markers.js';
import { setupFilters, applyFilters } from './filters.js'; // Import setupFilters here

// Expose global functions needed by HTML
window.navigateNeighborhood = navigateNeighborhood;

async function initMap() {
    try {
        console.log('initMap started, URL params:', window.location.search);
        
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
            
            console.log('Matching neighborhoods:', matchingNeighborhoods.map(n => ({ name: n.name, propertyType: n.propertyType, stats: n.stats?.listingCount })));
            
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
                    console.log('Selected neighborhood:', { name: targetNeighborhood.name, propertyType: targetNeighborhood.propertyType, stats: targetNeighborhood.stats?.listingCount });
                }
                
                // Filter to show only this neighborhood
                STATE.neighborhoods = [targetNeighborhood];
            }
        }
        
        // Hide drawer, footer, and disclaimer in single mode
        if (urlParams.mode === 'single') {
            const drawer = document.getElementById('sidebar');
            const drawerToggle = document.getElementById('drawer-toggle');
            const footer = document.querySelector('.bg-neutral-800');
            const disclaimer = document.getElementById('map-disclaimer');
            if (drawer) drawer.style.setProperty('display', 'none', 'important');
            if (drawerToggle) drawerToggle.style.display = 'none';
            if (footer) footer.style.display = 'none';
            if (disclaimer) disclaimer.style.display = 'none';
            document.querySelector('label[for="drawer-toggle"]')?.remove(); // Remove tab
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
                // Initial load: pan 50px North (add to offset) to ensure card visibility
                const offsetPixels = computeOffsetPx(currentZoom) + 50;
                const offsetTarget = offsetLatLng(center, offsetPixels, currentZoom);
                STATE.map.setCenter(offsetTarget); // instant center change (no animation)
                // Open info window directly without ripple animation.
                if (STATE.markers.length > 0) {
                    const first = STATE.markers[0];
                    showInfoWindow(first.marker, first.neighborhood);
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
        console.log('About to check urlParams.marker. Value:', urlParams.marker, 'Full urlParams:', urlParams);
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
                    
                    // Auto-select the zip code filter for this neighborhood
                    const zipCode = targetMarker.neighborhood.zipCode;
                    if (zipCode) {
                        console.log('Auto-selecting zip code filter:', zipCode);
                        const zipTag = document.querySelector(`#areaFilters .amenity-tag[data-zipcode="${zipCode}"]`);
                        if (zipTag && !zipTag.classList.contains('selected')) {
                            zipTag.classList.add('selected');
                            applyFilters(); // This will zoom to the filtered area
                        }
                    }
                    
                    // Use smoothFlyTo to center the marker with proper offset for the card
                    const markerPos = targetMarker.neighborhood.position;
                    smoothFlyTo(markerPos, 15);
                    
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

        // Setup Property Type Buttons (moved from ui.js to here/filters.js logic)
        // Actually, let's add the listener here to call applyFilters
        document.querySelectorAll('.property-type-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active state from all buttons
                document.querySelectorAll('.property-type-btn').forEach(b => {
                    b.classList.remove('active');
                });
                
                // Add active state to clicked button
                this.classList.add('active');
                
                // Apply filters
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

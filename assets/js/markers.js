/**
 * @file markers.js
 * @description Logic for creating markers and handling InfoWindows.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { STATE } from './state.js';
import { CONFIG } from './config.js';
import { formatPrice } from './utils.js';
import { smoothFlyTo } from './map.js';

export function addMarkers() {
    STATE.markers.forEach(m => m.marker.setMap(null));
    STATE.markers = [];

    STATE.neighborhoods.forEach((neighborhood, index) => {
        // Create the marker content structure directly
        const markerContainer = document.createElement('div');
        markerContainer.className = 'ripple-marker';
        markerContainer.innerHTML = `
            <div class="ripple"></div>
            <div class="ripple-icon"></div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: neighborhood.position,
            map: STATE.map,
            title: neighborhood.name,
            content: markerContainer
        });

        marker.addListener('click', () => {
            toggleMarker(marker, neighborhood);
        });

        // Open on hover (mouseenter) - Secondary Window
        markerContainer.addEventListener('mouseenter', () => {
            // Open secondary info window without affecting active state
            showInfoWindow(marker, neighborhood, STATE.hoverInfoWindow);
        });

        // Close on hover out (mouseleave)
        markerContainer.addEventListener('mouseleave', () => {
            if (STATE.hoverInfoWindow) {
                STATE.hoverInfoWindow.close();
            }
        });

        STATE.markers.push({ marker, neighborhood });
    });
}

export function createMarkers(neighborhoodsToMap) {
    neighborhoodsToMap.forEach(neighborhood => {
        // Create the marker content structure directly
        const markerContainer = document.createElement('div');
        markerContainer.className = 'ripple-marker';
        markerContainer.innerHTML = `
            <div class="ripple"></div>
            <div class="ripple-icon"></div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: neighborhood.position,
            map: STATE.map,
            title: neighborhood.name,
            content: markerContainer
        });

        marker.addListener('click', () => {
            toggleMarker(marker, neighborhood);
        });

        // Open on hover (mouseenter) - Secondary Window
        markerContainer.addEventListener('mouseenter', () => {
            // Open secondary info window without affecting active state
            showInfoWindow(marker, neighborhood, STATE.hoverInfoWindow);
        });

        // Close on hover out (mouseleave)
        markerContainer.addEventListener('mouseleave', () => {
            if (STATE.hoverInfoWindow) {
                STATE.hoverInfoWindow.close();
            }
        });

        STATE.markers.push({ marker, neighborhood });
    });
}

export function toggleMarker(marker, neighborhood) {
    // Helper to get ripple element from marker content
    const getRipple = (m) => m.content.querySelector('.ripple');

    // If clicking the same marker, toggle info window and ripple
    if (STATE.activeMarker === marker) {
        if (STATE.infoWindow && STATE.infoWindow.getMap()) {
            STATE.infoWindow.close();
            const ripple = getRipple(marker);
            if (ripple) ripple.classList.remove('active');
            STATE.activeMarker = null;
        } else {
            showInfoWindow(marker, neighborhood);
            const ripple = getRipple(marker);
            if (ripple) ripple.classList.add('active');
        }
    } else {
        // Clicking different marker - deactivate old, activate new
        if (STATE.activeMarker) {
            const oldRipple = getRipple(STATE.activeMarker);
            if (oldRipple) oldRipple.classList.remove('active');
        }
        
        showInfoWindow(marker, neighborhood);
        
        const newRipple = getRipple(marker);
        if (newRipple) newRipple.classList.add('active');
        
        STATE.activeMarker = marker;
    }
}

export function showInfoWindow(marker, neighborhood, targetInfoWindow = STATE.infoWindow) {
    // Store current neighborhood for navigation ONLY if this is the primary window
    if (targetInfoWindow === STATE.infoWindow) {
        window.currentNeighborhood = neighborhood;
    }

    // Safety check for stats object
    if (!neighborhood.stats) {
        console.error('No stats data for neighborhood:', neighborhood.name);
        return;
    }

    // Use avgPricePerSqFt from data or calculate if not available
    const pricePerSqFt = neighborhood.stats.avgPricePerSqFt || 
        (neighborhood.stats.avgSqft > 0 ? Math.round(neighborhood.stats.avgPrice / neighborhood.stats.avgSqft) : 0);
    const medianPrice = neighborhood.stats.medianPrice || neighborhood.stats.avgPrice;
    const medianPriceDisplay = formatPrice(medianPrice);
    
    // Dynamically construct listings URLs from searchId based on property type
    let listingsUrlMap = neighborhood.listingsUrlMap || neighborhood.listingsUrl || neighborhood.marketReportUrl; // Map View (backwards compatible)
    let listingsUrlList = neighborhood.listingsUrlList; // List View URL
    let searchId = null;
    
    if (!listingsUrlMap) {
        // Determine which searchId to use based on property type
        const propertyType = (neighborhood.propertyType || 'homes').toLowerCase();
        
        if (propertyType.includes('townhome')) {
            // Townhomes
            searchId = neighborhood.searchIdTownhomes !== undefined && neighborhood.searchIdTownhomes !== '' 
                ? neighborhood.searchIdTownhomes 
                : (neighborhood.searchId || null);
        } else if (propertyType.includes('condo')) {
            // Condos only
            searchId = neighborhood.searchIdCondos !== undefined && neighborhood.searchIdCondos !== '' 
                ? neighborhood.searchIdCondos 
                : (neighborhood.searchId || null);
        } else if (propertyType.includes('lot') || propertyType.includes('land') || propertyType.includes('vacant')) {
            searchId = neighborhood.searchIdLots !== undefined && neighborhood.searchIdLots !== '' 
                ? neighborhood.searchIdLots 
                : (neighborhood.searchId || null);
        } else {
            // Default to homes
            searchId = neighborhood.searchIdHomes !== undefined && neighborhood.searchIdHomes !== '' 
                ? neighborhood.searchIdHomes 
                : (neighborhood.searchId || null);
        }
        
        // Construct URLs if we have a valid searchId (not null, not empty string)
        if (searchId) {
            // Get current filter values (safe check for STATE.filters)
            const bedsMin = (STATE.filters && STATE.filters.bedsMin) || 1;
            const bathsMin = (STATE.filters && STATE.filters.bathsMin) || 1;
            const priceMin = (STATE.filters && STATE.filters.priceMin) || 250000;
            const priceMax = (STATE.filters && STATE.filters.priceMax) || 35000000;
            
            // Build URL slugs
            const bedsSlug = bedsMin > 1 ? `beds_${bedsMin}/` : '';
            const bathsSlug = bathsMin > 1 ? `baths_${bathsMin}/` : '';
            const priceMinSlug = `lprice_${priceMin}/`; // Always send minimum price to prevent showing listings under $250K
            const priceMaxSlug = priceMax < 35000000 ? `uprice_${priceMax}/` : '';
            
            // Combine all slugs and add # prefix
            const allSlugs = bedsSlug + bathsSlug + priceMinSlug + priceMaxSlug;
            const slugPart = `#${allSlugs}`;
            
            // Map View (searchtype=3)
            listingsUrlMap = `https://www.truesouthcoastalhomes.com/property-search/results/?searchtype=3&searchid=${searchId}${slugPart}`;
            // List View (searchtype=2) - only create if we don't have a custom listingsUrlList
            if (!listingsUrlList) {
                listingsUrlList = `https://www.truesouthcoastalhomes.com/property-search/results/?searchtype=2&searchid=${searchId}${slugPart}`;
            }
        }
    }
    
    const content = `
        <div class="info-window p-3 max-w-sm" style="cursor: pointer;">
            <h3 class="text-lg font-semibold ${CONFIG.colors.text.primary} mb-2">
                ${neighborhood.name}
            </h3>
            
            <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="bg-white px-3 py-2 rounded-lg border border-neutral-300">
                    <div class="text-xs ${CONFIG.colors.text.secondary} mb-0.5">All Active</div>
                    <div class="text-sm font-semibold ${CONFIG.colors.text.primary}">${neighborhood.stats.listingCount}</div>
                </div>
                <div class="bg-white px-3 py-2 rounded-lg border border-neutral-300">
                    <div class="text-xs ${CONFIG.colors.text.secondary} mb-0.5">Med List Price</div>
                    <div class="text-sm font-semibold ${CONFIG.colors.text.primary}">${medianPriceDisplay}</div>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="bg-white px-3 py-2 rounded-lg border border-neutral-300">
                    <div class="text-xs ${CONFIG.colors.text.secondary} mb-0.5">Avg $/Sq Ft</div>
                    <div class="text-sm font-semibold ${CONFIG.colors.text.primary}">$${pricePerSqFt.toLocaleString()}</div>
                </div>
                <div class="bg-white px-3 py-2 rounded-lg border border-neutral-300">
                    <div class="text-xs ${CONFIG.colors.text.secondary} mb-0.5">Avg DOM</div>
                    <div class="text-sm font-semibold ${CONFIG.colors.text.primary}">${neighborhood.stats.avgDom}</div>
                </div>
            </div>
            
            ${neighborhood.amenities && neighborhood.amenities.length > 0 ? `
            <div class="mb-3">
                <div class="bg-white p-3 rounded-lg border border-neutral-200">
                    <div class="text-sm font-semibold ${CONFIG.colors.text.primary} mb-1">Amenities</div>
                    <div class="text-xs ${CONFIG.colors.text.secondary} leading-relaxed">${neighborhood.amenities.join(', ')}</div>
                </div>
            </div>
            ` : ''}
            
            <div class="pt-3 border-t border-neutral-200 flex items-center gap-2">
                ${STATE.allFilteredNeighborhoods.length > 1 ? `
                <button onclick="window.navigateNeighborhood(-1)" class="p-2 rounded-full hover:bg-neutral-100 ${CONFIG.colors.text.secondary} transition-colors flex-shrink-0" title="Previous Community">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                ` : ''}

                ${listingsUrlMap ? `
                <a href="${listingsUrlMap}" 
                   target="_blank" 
                   class="view-listings-btn flex-1 text-center justify-center"
                   onclick="event.stopPropagation();">
                    Matching Listings
                </a>
                ` : `
                <button class="view-listings-btn flex-1 opacity-50 cursor-not-allowed justify-center" disabled>
                    Coming Soon!
                </button>
                `}

                ${STATE.allFilteredNeighborhoods.length > 1 ? `
                <button onclick="window.navigateNeighborhood(1)" class="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors flex-shrink-0" title="Next Community">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                ` : ''}
            </div>
        </div>
    `;

    targetInfoWindow.setContent(content);
    targetInfoWindow.open(STATE.map, marker);
    
    // Add click listener to close info window when clicking the card
    // Only for the primary window, as hover window closes on mouseleave
    if (targetInfoWindow === STATE.infoWindow) {
        google.maps.event.addListenerOnce(targetInfoWindow, 'domready', () => {
            const infoWindowDiv = document.querySelector('.gm-style-iw-d');
            if (infoWindowDiv) {
                infoWindowDiv.addEventListener('click', (e) => {
                    // Don't close if clicking the link or buttons
                    if (e.target.tagName !== 'A' && !e.target.closest('a') && !e.target.closest('button')) {
                        STATE.infoWindow.close();
                        if (STATE.activeMarker) {
                            const ripple = STATE.activeMarker.content.querySelector('.ripple');
                            if (ripple) ripple.classList.remove('active');
                        }
                        STATE.activeMarker = null;
                    }
                });
            }
        });
        
        // Listen for info window close to deactivate ripple
        google.maps.event.clearListeners(STATE.infoWindow, 'closeclick');
        STATE.infoWindow.addListener('closeclick', () => {
            if (STATE.activeMarker) {
                const ripple = STATE.activeMarker.content.querySelector('.ripple');
                if (ripple) ripple.classList.remove('active');
            }
            STATE.activeMarker = null;
        });
    }
}

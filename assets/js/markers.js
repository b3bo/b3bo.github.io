/**
 * @file markers.js
 * @description Logic for creating markers and handling InfoWindows.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { STATE } from './state.js';
import { CONFIG } from './config.js';
import { formatPrice, getUrlParams, toSlug } from './utils.js';
import { smoothFlyTo } from './map.js?v=202501';

// Professional SVG marker icons with ripple effects
export function createMarkerIcon(color, isActive = false) {
    const size = isActive ? 44 : 32;
    const dotSize = isActive ? 12 : 8;
    const strokeWidth = isActive ? 3 : 2;

    const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            ${isActive ? `
                <!-- Animated ripple - starts from marker edge and pulses outward -->
                <circle cx="${size/2}" cy="${size/2}" r="${dotSize}"
                    fill="none"
                    stroke="${color}"
                    stroke-width="4"
                    opacity="0.7">
                    <animate attributeName="r"
                        from="${dotSize}"
                        to="${size/2 - 2}"
                        dur="1.5s"
                        repeatCount="indefinite"/>
                    <animate attributeName="opacity"
                        from="0.7"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"/>
                </circle>
            ` : ''}
            <!-- Main marker circle with white stroke -->
            <circle cx="${size/2}" cy="${size/2}" r="${dotSize}"
                fill="${color}"
                stroke="white"
                stroke-width="${strokeWidth}"/>
        </svg>
    `;

    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size/2, size/2)
    };
}

// Marker color palette
const MARKER_COLORS = {
    urlSlug: '#4c8f96',    // Teal - has URL slug (primary)
    searchId: '#4a5462',   // Dark gray - has search ID
    noData: '#9ca3af'      // Light gray - no data
};

export function addMarkers() {
    STATE.markers.forEach(m => m.marker.setMap(null));
    STATE.markers = [];

    STATE.neighborhoods.forEach((neighborhood, index) => {
        // Determine marker color based on searchId and urlSlug
        const hasSearchId = (neighborhood.searchIdHomes && neighborhood.searchIdHomes !== '') || 
                           (neighborhood.searchIdCondos && neighborhood.searchIdCondos !== '') || 
                           (neighborhood.searchIdTownhomes && neighborhood.searchIdTownhomes !== '') || 
                           (neighborhood.searchIdLots && neighborhood.searchIdLots !== '') || 
                           (neighborhood.searchId && neighborhood.searchId !== '');
        const hasUrlSlug = neighborhood.urlSlug && neighborhood.urlSlug !== '';
        
        let markerClass = 'ripple-marker';
        if (hasUrlSlug) {
            markerClass += ' has-urlslug';   // primary-500 (takes priority)
        } else if (hasSearchId) {
            markerClass += ' has-searchid';  // neutral-700
        } else {
            markerClass += ' no-data';       // neutral-300
        }
        
        // Determine marker color based on data availability
        const markerColor = hasUrlSlug ? MARKER_COLORS.urlSlug :
                           (hasSearchId ? MARKER_COLORS.searchId : MARKER_COLORS.noData);

        // Create marker with professional SVG icon
        const marker = new google.maps.Marker({
            position: neighborhood.position,
            map: STATE.map,
            title: neighborhood.name,
            icon: createMarkerIcon(markerColor, false),
            optimized: false // Required for SVG animations
        });

        // Store marker color for later use
        marker.markerColor = markerColor;

        marker.addListener('click', () => {
            toggleMarker(marker, neighborhood);
        });

        marker.addListener('mouseover', () => {
            showInfoWindow(marker, neighborhood, STATE.hoverInfoWindow);
        });

        marker.addListener('mouseout', () => {
            if (STATE.hoverInfoWindow) {
                STATE.hoverInfoWindow.close();
            }
        });

        STATE.markers.push({ marker, neighborhood });
    });
}

export function createMarkers(neighborhoodsToMap) {
    neighborhoodsToMap.forEach(neighborhood => {
        // Determine marker color based on searchId and urlSlug
        const hasSearchId = (neighborhood.searchIdHomes && neighborhood.searchIdHomes !== '') || 
                           (neighborhood.searchIdCondos && neighborhood.searchIdCondos !== '') || 
                           (neighborhood.searchIdTownhomes && neighborhood.searchIdTownhomes !== '') || 
                           (neighborhood.searchIdLots && neighborhood.searchIdLots !== '') || 
                           (neighborhood.searchId && neighborhood.searchId !== '');
        const hasUrlSlug = neighborhood.urlSlug && neighborhood.urlSlug !== '';
        
        let markerClass = 'ripple-marker';
        if (hasUrlSlug) {
            markerClass += ' has-urlslug';   // primary-500 (takes priority)
        } else if (hasSearchId) {
            markerClass += ' has-searchid';  // neutral-700
        } else {
            markerClass += ' no-data';       // neutral-300
        }
        
        // Determine marker color based on data availability
        const markerColor = hasUrlSlug ? MARKER_COLORS.urlSlug :
                           (hasSearchId ? MARKER_COLORS.searchId : MARKER_COLORS.noData);

        // Create marker with professional SVG icon
        const marker = new google.maps.Marker({
            position: neighborhood.position,
            map: STATE.map,
            title: neighborhood.name,
            icon: createMarkerIcon(markerColor, false),
            optimized: false // Required for SVG animations
        });

        // Store marker color for later use
        marker.markerColor = markerColor;

        marker.addListener('click', () => {
            toggleMarker(marker, neighborhood);
        });

        marker.addListener('mouseover', () => {
            showInfoWindow(marker, neighborhood, STATE.hoverInfoWindow);
        });

        marker.addListener('mouseout', () => {
            if (STATE.hoverInfoWindow) {
                STATE.hoverInfoWindow.close();
            }
        });

        STATE.markers.push({ marker, neighborhood });
    });
}

export function toggleMarker(marker, neighborhood) {
    // If clicking the same marker, toggle info window
    if (STATE.activeMarker === marker) {
        if (STATE.infoWindow && STATE.infoWindow.getMap()) {
            STATE.infoWindow.close();
            // Deactivate ripple
            marker.setIcon(createMarkerIcon(marker.markerColor, false));
            STATE.activeMarker = null;
        } else {
            showInfoWindow(marker, neighborhood);
            // Activate ripple
            marker.setIcon(createMarkerIcon(marker.markerColor, true));
        }
    } else {
        // Deactivate previous marker ripple
        if (STATE.activeMarker) {
            STATE.activeMarker.setIcon(createMarkerIcon(STATE.activeMarker.markerColor, false));
        }

        // Clicking different marker - open new info window with ripple
        showInfoWindow(marker, neighborhood);
        marker.setIcon(createMarkerIcon(marker.markerColor, true));
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
            const priceMin = STATE.filters && STATE.filters.priceMin;
            const priceMax = STATE.filters && STATE.filters.priceMax;
            
            // Build URL slugs
            const bedsSlug = bedsMin > 1 ? `beds_${bedsMin}/` : '';
            const bathsSlug = bathsMin > 1 ? `baths_${bathsMin}/` : '';
            // Always include lprice (default 250000), but only include uprice if it's been set and is not at max
            const priceMinSlug = priceMin ? `lprice_${priceMin}/` : 'lprice_250000/';
            const priceMaxSlug = (priceMax && priceMax < 35000000) ? `uprice_${priceMax}/` : '';
            
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
        <div class="info-window p-3 max-w-sm" style="cursor: pointer; background-color: ${CONFIG.colors.background.card};">
            <div class="flex items-center justify-center gap-2 mb-2">
                <h3 class="text-lg font-semibold ${CONFIG.colors.text.primary}">
                    ${neighborhood.name}
                </h3>
                ${neighborhood.urlSlug ? `
                <a href="https://www.truesouthcoastalhomes.com${neighborhood.urlSlug}" 
                   target="_blank"
                   class="text-[#4c8f96] hover:text-[#3a6d73] transition-colors"
                   onclick="event.stopPropagation();"
                   title="View Neighborhood Page">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                </a>
                ` : ''}
            </div>
            
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

                ${(() => {
                    const urlParams = getUrlParams();
                    const isSingleMode = urlParams.mode === 'single';
                    
                    if (listingsUrlMap) {
                        if (isSingleMode) {
                            // Single mode: Link to Community Finder with marker parameter to auto-open this neighborhood
                            const neighborhoodSlug = toSlug(neighborhood.name);
                            const propertyTypeParam = neighborhood.propertyType ? `&propertyType=${encodeURIComponent(neighborhood.propertyType)}` : '';
                            const finderUrl = `https://neighborhoods.truesouthcoastalhomes.com?marker=${neighborhoodSlug}${propertyTypeParam}`;
                            return `
                            <a href="${finderUrl}" 
                               class="view-listings-btn"
                               style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex: 1;"
                               onclick="event.stopPropagation();">
                                Community Finder
                                <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                            `;
                        } else {
                            // Normal mode: Link to listings
                            return `
                            <a href="${listingsUrlMap}" 
                               target="_blank" 
                               class="view-listings-btn flex-1 text-center justify-center"
                               onclick="event.stopPropagation();">
                                Matching Listings
                            </a>
                            `;
                        }
                    } else {
                        return `
                        <button class="view-listings-btn flex-1 opacity-50 cursor-not-allowed justify-center" disabled>
                            Coming Soon!
                        </button>
                        `;
                    }
                })()}

                ${STATE.allFilteredNeighborhoods.length > 1 ? `
                <button onclick="window.navigateNeighborhood(1)" class="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors flex-shrink-0" title="Next Community">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                ` : ''}
            </div>
        </div>
    `;

    // Classic Marker + InfoWindow - the rock-solid, battle-tested approach
    targetInfoWindow.close();
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
                            STATE.activeMarker.setIcon(createMarkerIcon(STATE.activeMarker.markerColor, false));
                        }
                        STATE.activeMarker = null;
                    }
                });
            }
        });
        
        // Listen for info window close to deactivate ripple and clear active marker
        google.maps.event.clearListeners(STATE.infoWindow, 'closeclick');
        STATE.infoWindow.addListener('closeclick', () => {
            if (STATE.activeMarker) {
                STATE.activeMarker.setIcon(createMarkerIcon(STATE.activeMarker.markerColor, false));
            }
            STATE.activeMarker = null;
        });
    }
}

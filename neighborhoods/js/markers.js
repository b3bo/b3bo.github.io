/**
 * @file markers.js
 * @description Logic for creating markers and handling InfoWindows.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { STATE } from './state.js';
import { CONFIG } from './config.js';
import { formatPrice, getUrlParams, toSlug, escapeHtml } from './utils.js';
import { smoothFlyTo } from './map.js?v=202501';

// Professional SVG marker icons with ripple effects
export function createMarkerIcon(color, isActive = false) {
    const size = isActive ? 44 : 32;
    const dotSize = isActive ? 10 : 6;
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
                stroke-opacity="0.75"
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
    urlSlug: '#4c8f96',      // Teal - has URL slug (SEO page)
    listingsLink: '#4a5462', // Dark gray - has dynamic listings link (via subdivision)
    noData: '#9ca3af'        // Light gray - no data
};

export function addMarkers() {
    STATE.markers.forEach(m => m.marker.setMap(null));
    STATE.markers = [];

    STATE.neighborhoods.forEach((neighborhood, index) => {
        // Determine marker color based on urlSlug and dynamic listings link availability
        const hasUrlSlug = neighborhood.urlSlug && neighborhood.urlSlug !== '';
        const hasListingsLink = (neighborhood.mlsSubdivisions && neighborhood.mlsSubdivisions.length > 0) ||
                                (neighborhood.name && neighborhood.name !== '');

        let markerClass = 'ripple-marker';
        if (hasUrlSlug) {
            markerClass += ' has-urlslug';      // primary-500 (takes priority)
        } else if (hasListingsLink) {
            markerClass += ' has-listingslink'; // neutral-700
        } else {
            markerClass += ' no-data';          // neutral-300
        }

        // Determine marker color based on data availability
        const markerColor = hasUrlSlug ? MARKER_COLORS.urlSlug :
                           (hasListingsLink ? MARKER_COLORS.listingsLink : MARKER_COLORS.noData);

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
        // Determine marker color based on urlSlug and dynamic listings link availability
        const hasUrlSlug = neighborhood.urlSlug && neighborhood.urlSlug !== '';
        const hasListingsLink = (neighborhood.mlsSubdivisions && neighborhood.mlsSubdivisions.length > 0) ||
                                (neighborhood.name && neighborhood.name !== '');

        let markerClass = 'ripple-marker';
        if (hasUrlSlug) {
            markerClass += ' has-urlslug';      // primary-500 (takes priority)
        } else if (hasListingsLink) {
            markerClass += ' has-listingslink'; // neutral-700
        } else {
            markerClass += ' no-data';          // neutral-300
        }

        // Determine marker color based on data availability
        const markerColor = hasUrlSlug ? MARKER_COLORS.urlSlug :
                           (hasListingsLink ? MARKER_COLORS.listingsLink : MARKER_COLORS.noData);

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

// Show area info window with aggregate stats (used when subarea filter is selected)
function showAreaInfoWindow(marker, area, targetInfoWindow = STATE.infoWindow) {
    const stats = area.stats || {};
    const neighborhoodsList = (area.neighborhoods || [])
        .slice(0, 10)
        .map(n => n.name)
        .join(', ');

    const content = `
        <div class="info-window p-3 max-w-sm bg-white dark:bg-dark-bg-elevated">
            <h3 class="text-lg font-semibold text-neutral-800 dark:text-dark-text-primary mb-2 text-center">${escapeHtml(area.name)}</h3>
            <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">${stats.listingCount || 0}</div>
                    <div class="text-xs text-neutral-600 dark:text-dark-text-secondary">Active Listings</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">${formatPrice(stats.medianPrice || 0)}</div>
                    <div class="text-xs text-neutral-600 dark:text-dark-text-secondary">Median Price</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">$${(stats.avgPricePerSqFt || 0).toLocaleString()}</div>
                    <div class="text-xs text-neutral-600 dark:text-dark-text-secondary">Avg $/Sq Ft</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">${stats.avgDom || 0}</div>
                    <div class="text-xs text-neutral-600 dark:text-dark-text-secondary">Avg DOM</div>
                </div>
            </div>
            <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 p-3 rounded-lg border border-neutral-200 dark:border-dark-border mb-3">
                <div class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-1">Top Communities</div>
                <div class="text-xs text-neutral-600 dark:text-dark-text-secondary">${neighborhoodsList}</div>
            </div>
        </div>
    `;

    targetInfoWindow.close();
    targetInfoWindow.setContent(content);
    targetInfoWindow.open(STATE.map, marker);
}

export function showInfoWindow(marker, neighborhood, targetInfoWindow = STATE.infoWindow) {
    // Handle area markers (aggregate stats for subarea)
    if (neighborhood.isAreaMarker) {
        return showAreaInfoWindow(marker, neighborhood, targetInfoWindow);
    }

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
    
    // Dynamically construct listings URLs from searchId OR subdivision name
    let listingsUrlMap = neighborhood.listingsUrlMap || neighborhood.listingsUrl || neighborhood.marketReportUrl; // Map View (backwards compatible)
    let listingsUrlList = neighborhood.listingsUrlList; // List View URL
    const searchId = neighborhood.searchId || null;
    const propertyType = (neighborhood.propertyType || 'homes').toLowerCase();

    // Construct URLs using subdivision name (all communities get dynamic listing links)
    if (neighborhood.name) {
        // Determine property type descrip (goes at end of hash)
        let typeDescrip = '';
        if (propertyType.includes('townhome')) {
            typeDescrip = 'listtypedescrip_attached%20single%20unit/';
        } else if (propertyType.includes('condo')) {
            typeDescrip = 'listtypedescrip_condominium/';
        } else if (propertyType.includes('lot') || propertyType.includes('land') || propertyType.includes('vacant')) {
            typeDescrip = ''; // blank for now
        } else {
            // Default to homes
            typeDescrip = 'listtypedescrip_detached%20single%20family/';
        }

        // Get current filter values (safe check for STATE.filters)
        const bedsMin = (STATE.filters && STATE.filters.bedsMin) || 1;
        const bathsMin = (STATE.filters && STATE.filters.bathsMin) || 1;
        const priceMin = STATE.filters && STATE.filters.priceMin;
        const priceMax = STATE.filters && STATE.filters.priceMax;

        // Build filter slugs
        const bedsSlug = bedsMin > 1 ? `beds_${bedsMin}/` : '';
        const bathsSlug = bathsMin > 1 ? `baths_${bathsMin}/` : '';
        const priceMinSlug = priceMin ? `lprice_${priceMin}/` : 'lprice_250000/';
        const priceMaxSlug = (priceMax && priceMax < 35000000) ? `uprice_${priceMax}/` : '';

        // Determine listtype based on property type
        let listType = 'listtype_1'; // Default for homes/condos/townhomes
        if (propertyType.includes('lot') || propertyType.includes('land') || propertyType.includes('vacant')) {
            listType = 'listtype_4';
        }

        // Combine: listtype + filters + property type descrip
        const hashPart = `#${listType}/${priceMinSlug}${priceMaxSlug}${bedsSlug}${bathsSlug}${typeDescrip}`;

        // Build the search parameter using subdivision names (dynamic linking)
        // Priority: 1) mlsSubdivisions (comma-separated MLS names), 2) neighborhood.name (canonical)
        // Note: searchId is preserved in data for other uses but not used for listing URLs
        let searchParam;
        if (neighborhood.mlsSubdivisions && neighborhood.mlsSubdivisions.length > 0) {
            // Use MLS subdivision variants (comma-separated, spaces become +)
            const subdivisions = neighborhood.mlsSubdivisions
                .map(s => s.replace(/ /g, '+'))
                .join(',');
            searchParam = `subdivision=${subdivisions}`;
        } else {
            // Fallback to canonical name (spaces become +)
            const subdivisionName = neighborhood.name.replace(/ /g, '+');
            searchParam = `subdivision=${subdivisionName}`;
        }

        // Map View (searchtype=3) - only construct if not already set from legacy data
        if (!listingsUrlMap || listingsUrlMap === '') {
            listingsUrlMap = `https://www.truesouthcoastalhomes.com/property-search/results/?searchtype=3&${searchParam}${hashPart}`;
        }
        // List View (searchtype=2) - for mobile use
        if (!listingsUrlList || listingsUrlList === '') {
            listingsUrlList = `https://www.truesouthcoastalhomes.com/property-search/results/?searchtype=2&${searchParam}${hashPart}`;
        }
    }
    
    const content = `
        <div class="info-window p-3 max-w-sm bg-white dark:bg-dark-bg-elevated" style="cursor: pointer;" tabindex="-1">
            <div class="flex items-center justify-center gap-2 mb-2">
                <h3 class="text-lg font-semibold text-neutral-800 dark:text-dark-text-primary">
                    ${escapeHtml(neighborhood.name)}
                </h3>
                ${neighborhood.urlSlug ? `
                <a href="https://www.truesouthcoastalhomes.com${neighborhood.urlSlug}"
                   target="_blank"
                   class="text-brand-500 dark:text-brand-dark hover:text-brand-600 dark:hover:text-brand-dark-hover transition-colors focus-ring rounded"
                   onclick="event.stopPropagation();"
                   title="${escapeHtml(neighborhood.name)} ${neighborhood.propertyType === 'Condos' ? 'Condos' : neighborhood.propertyType === 'Townhomes' ? 'Townhomes' : 'Homes'} for Sale">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                </a>
                ` : listingsUrlMap ? `
                <a href="${listingsUrlMap}"
                   target="_blank"
                   class="text-brand-500 dark:text-brand-dark hover:text-brand-600 dark:hover:text-brand-dark-hover transition-colors focus-ring rounded"
                   onclick="event.stopPropagation();"
                   title="View ${escapeHtml(neighborhood.name)} listings">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                </a>
                ` : ''}
            </div>

            <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">${neighborhood.stats.listingCount}</div>
                    <div class="text-xs text-neutral-600 dark:text-dark-text-secondary">All Active</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">${medianPriceDisplay}</div>
                    <div class="text-xs text-neutral-600 dark:text-dark-text-secondary">Med List Price</div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">$${pricePerSqFt.toLocaleString()}</div>
                    <div class="text-xs text-neutral-600 dark:text-dark-text-secondary">Avg $/Sq Ft</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">${neighborhood.stats.avgDom}</div>
                    <div class="text-xs text-neutral-600 dark:text-dark-text-secondary">Avg DOM</div>
                </div>
            </div>

            ${neighborhood.amenities && neighborhood.amenities.length > 0 ? `
            <div class="mb-3">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 p-3 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-1">Amenities</div>
                    <div class="amenities-scroll text-xs text-neutral-600 dark:text-dark-text-secondary leading-tight">${neighborhood.amenities.join(', ') + '.'}</div>
                </div>
            </div>
            ` : ''}

            <hr class="divider mb-3">
            <div class="pt-3 flex items-center gap-2">
                ${STATE.allFilteredNeighborhoods.length > 1 ? `
                <button onclick="window.navigateNeighborhood(-1)" class="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-dark-bg-elevated-2 text-neutral-600 dark:text-dark-text-secondary transition-colors flex-shrink-0" title="Previous Community">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
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
                            // Use current origin for local testing, production URL for live
                            const baseUrl = window.location.hostname === 'localhost'
                                ? window.location.origin
                                : 'https://neighborhoods.truesouthcoastalhomes.com';
                            const finderUrl = `${baseUrl}/?marker=${neighborhoodSlug}${propertyTypeParam}`;
                            return `
                            <a href="${finderUrl}"
                               target="_blank"
                               class="flex items-center justify-center gap-2 flex-1 bg-brand-500 dark:bg-brand-dark hover:bg-brand-600 dark:hover:bg-brand-dark-hover text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                               onclick="event.stopPropagation(); if(typeof gtag !== 'undefined') gtag('event', 'open_community_finder', {neighborhood_name: '${escapeHtml(neighborhood.name)}', property_type: '${neighborhood.propertyType}'});"
                               title="Open ${escapeHtml(neighborhood.name)} in Community Finder">
                                Community Finder
                                <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                            `;
                        } else {
                            // Normal mode: Link to listings
                            // Mobile (<768px): List View (searchtype=2), Tablet/Desktop: Map View (searchtype=3)
                            const isMobile = window.innerWidth < 768;
                            const listingsUrl = isMobile ? listingsUrlList : listingsUrlMap;
                            return `
                            <a href="${listingsUrl}"
                               target="_blank"
                               class="flex-1 text-center bg-brand-500 dark:bg-brand-dark hover:bg-brand-600 dark:hover:bg-brand-dark-hover text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                               onclick="event.stopPropagation(); if(typeof gtag !== 'undefined') gtag('event', 'view_listings', {neighborhood_name: '${escapeHtml(neighborhood.name)}', listing_count: ${neighborhood.stats.listingCount}, property_type: '${neighborhood.propertyType}'});"
                               title="View all ${escapeHtml(neighborhood.name)} ${neighborhood.propertyType} for sale">
                                Matching Listings
                            </a>
                            `;
                        }
                    } else {
                        return `
                        <button class="flex-1 bg-neutral-300 dark:bg-dark-bg-elevated-2 text-neutral-500 dark:text-dark-text-secondary py-2.5 px-4 rounded-lg font-medium opacity-50 cursor-not-allowed"
                                disabled
                                title="MLS listings coming soon for ${escapeHtml(neighborhood.name)}">
                            Coming Soon!
                        </button>
                        `;
                    }
                })()}

                ${STATE.allFilteredNeighborhoods.length > 1 ? `
                <button onclick="window.navigateNeighborhood(1)" class="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-dark-bg-elevated-2 text-neutral-600 dark:text-dark-text-secondary transition-colors flex-shrink-0" title="Next Community">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                ` : ''}
            </div>
        </div>
    `;

    // Classic Marker + InfoWindow - the rock-solid, battle-tested approach
    targetInfoWindow.close();
    targetInfoWindow.setContent(content);
    targetInfoWindow.open(STATE.map, marker);

    // Detect amenities overflow and add fade class if needed (4px tolerance for rounding)
    google.maps.event.addListenerOnce(targetInfoWindow, 'domready', () => {
        const amenitiesEl = document.querySelector('.amenities-scroll');
        if (amenitiesEl && amenitiesEl.scrollHeight > amenitiesEl.clientHeight + 4) {
            amenitiesEl.classList.add('has-overflow');
        }
    });

    // Handle close events for primary window
    if (targetInfoWindow === STATE.infoWindow) {
        // Listen for X button close to deactivate ripple and clear active marker
        google.maps.event.clearListeners(STATE.infoWindow, 'closeclick');
        STATE.infoWindow.addListener('closeclick', () => {
            if (STATE.activeMarker) {
                STATE.activeMarker.setIcon(createMarkerIcon(STATE.activeMarker.markerColor, false));
            }
            STATE.activeMarker = null;
        });
    }
}

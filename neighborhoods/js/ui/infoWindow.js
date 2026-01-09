/**
 * @file ui/infoWindow.js
 * @description Info window content templates for Google Maps markers.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { eventBus, Events } from '../core/eventBus.js';
import { formatPrice, getAreaStats, getAreaNeighborhoods } from '../utils.js';

/**
 * Show info window content for area markers.
 * @param {Object} marker - Google Maps marker
 * @param {Object} area - Area data object
 * @param {Object} targetInfoWindow - Google Maps InfoWindow instance
 */
// Helper to generate title with property type suffix
function getAreaTitle(area) {
    const baseName = area.name;
    const propertyType = (area.propertyType || '').toLowerCase();

    if (propertyType === 'homes') {
        return `${baseName} Homes`;
    } else if (propertyType === 'condos') {
        return `${baseName} Condos`;
    }
    return baseName;
}

// Helper function to update stats in already-rendered info window (DOM-only, no Google Maps API calls)
function updateInfoWindowStatsOnly(area) {
    console.log('[infoWindow.js updateInfoWindowStatsOnly] Called with area:', area.name, 'propertyType:', area.propertyType);

    // Get stats based on propertyType
    const stats = getAreaStats(area, area.propertyType);
    console.log('[infoWindow.js updateInfoWindowStatsOnly] Stats to apply:', stats);

    // Find the rendered info window
    const infoWindow = document.querySelector('.info-window');
    if (!infoWindow) {
        console.log('[infoWindow.js updateInfoWindowStatsOnly] ERROR: No .info-window element found');
        return false;
    }

    console.log('[infoWindow.js updateInfoWindowStatsOnly] Found .info-window element');

    // Update title with property type suffix
    const titleEl = infoWindow.querySelector('.info-window-title');
    if (titleEl) {
        titleEl.textContent = getAreaTitle(area);
        console.log('[infoWindow.js updateInfoWindowStatsOnly] Updated title to:', titleEl.textContent);
    }

    // Use data attributes for reliable targeting
    const listingCountEl = infoWindow.querySelector('[data-stat="listingCount"]');
    const medianPriceEl = infoWindow.querySelector('[data-stat="medianPrice"]');
    const avgPricePerSqFtEl = infoWindow.querySelector('[data-stat="avgPricePerSqFt"]');
    const avgDomEl = infoWindow.querySelector('[data-stat="avgDom"]');

    console.log('[infoWindow.js updateInfoWindowStatsOnly] Found stat elements:', {
        listingCount: !!listingCountEl,
        medianPrice: !!medianPriceEl,
        avgPricePerSqFt: !!avgPricePerSqFtEl,
        avgDom: !!avgDomEl
    });

    if (listingCountEl && medianPriceEl && avgPricePerSqFtEl && avgDomEl) {
        listingCountEl.textContent = stats.listingCount || 0;
        medianPriceEl.textContent = formatPrice(stats.medianPrice || 0);
        avgPricePerSqFtEl.textContent = '$' + (stats.avgPricePerSqFt || 0);
        avgDomEl.textContent = stats.avgDom || 0;
        console.log('[infoWindow.js updateInfoWindowStatsOnly] SUCCESS: Stats updated via DOM');
        return true;
    }

    console.log('[infoWindow.js updateInfoWindowStatsOnly] ERROR: Could not find all stat elements with data attributes');
    return false;
}

export function showPresetInfoWindowContent(marker, area, targetInfoWindow, options = {}) {
    const { skipCentering = false } = options;
    console.log('[infoWindow.js showPresetInfoWindowContent] Called with skipCentering:', skipCentering);

    // Use mini info window if URL param infoWindowSize=mini
    if (window.useMiniInfoWindow) {
        return showMiniInfoWindowContent(marker, area, targetInfoWindow);
    }

    // If skipCentering, just update the stats in the DOM and return
    if (skipCentering) {
        console.log('[infoWindow.js showPresetInfoWindowContent] Attempting DOM-only update...');
        const domUpdateSuccess = updateInfoWindowStatsOnly(area);
        console.log('[infoWindow.js showPresetInfoWindowContent] DOM update result:', domUpdateSuccess);
        if (domUpdateSuccess) {
            console.log('[infoWindow.js showPresetInfoWindowContent] SUCCESS: Stats updated via DOM-only method, returning early');
            return;
        } else {
            console.log('[infoWindow.js showPresetInfoWindowContent] FALLBACK: DOM update failed, continuing with full render');
        }
    }

    // Use type-specific stats if propertyType is set, otherwise use combined stats
    const stats = getAreaStats(area, area.propertyType);
    const neighborhoodsList = (area.neighborhoods || [])
        .slice(0, 10)
        .map(n => n.name)
        .join(', ');

    const content = `
        <div class="info-window">
            <h3 class="info-window-title">${getAreaTitle(area)}</h3>
            <div class="info-window-stats">
                <div class="info-window-stat">
                    <div class="info-window-stat-value" data-stat="listingCount">${stats.listingCount || 0}</div>
                    <div class="info-window-stat-label">Active</div>
                </div>
                <div class="info-window-stat">
                    <div class="info-window-stat-value" data-stat="medianPrice">${formatPrice(stats.medianPrice || 0)}</div>
                    <div class="info-window-stat-label">Median</div>
                </div>
                <div class="info-window-stat">
                    <div class="info-window-stat-value" data-stat="avgPricePerSqFt">$${stats.avgPricePerSqFt || 0}</div>
                    <div class="info-window-stat-label">$/SF</div>
                </div>
                <div class="info-window-stat">
                    <div class="info-window-stat-value" data-stat="avgDom">${stats.avgDom || 0}</div>
                    <div class="info-window-stat-label">Avg DOM</div>
                </div>
            </div>
            <div class="info-window-section">
                <div class="info-window-section-title">Top Neighborhoods</div>
                <div class="communities-scroll info-window-section-content">${neighborhoodsList}</div>
            </div>
            <hr class="divider">
            <div class="info-window-nav">
                ${buildAreaNavButtons(area)}
            </div>
        </div>
    `;

    targetInfoWindow.setContent(content);

    // Only call .open() if not already open (prevents unwanted panning)
    if (!skipCentering) {
        targetInfoWindow.open(window.map, marker);
    }

    // After info window renders: detect overflow
    google.maps.event.addListenerOnce(targetInfoWindow, 'domready', () => {
        const communitiesEl = document.querySelector('.communities-scroll');
        if (communitiesEl && communitiesEl.scrollHeight > communitiesEl.clientHeight + 4) {
            communitiesEl.classList.add('has-overflow');
        }
    });
}

/**
 * Build navigation buttons for area info window.
 * @param {Object} area - Area data object
 * @returns {string} HTML string with nav buttons
 */
function buildAreaNavButtons(area) {
    const filtered = window.filteredNeighborhoods || [];
    const hasNav = filtered.length > 1;
    const prevBtn = hasNav
        ? '<button id="nav-prev" onclick="window.navigateNeighborhood(-1)" class="info-window-nav-btn" title="Previous Community"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>'
        : '';
    const nextBtn = hasNav
        ? '<button id="nav-next" onclick="window.navigateNeighborhood(1)" class="info-window-nav-btn" title="Next Community"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>'
        : '';

    if (window.isSingleMode) {
        // Single mode: Neighborhood Finder button with popout icon
        const baseUrl =
            window.location.hostname === 'localhost'
                ? window.location.origin
                : 'https://neighborhoods.truesouthcoastalhomes.com';
        const areaSlug = area.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const propertyTypeParam = area.propertyType
            ? '&propertyType=' + encodeURIComponent(area.propertyType)
            : '';
        const finderUrl = baseUrl + '?marker=' + areaSlug + propertyTypeParam;
        return (
            prevBtn +
            '<a href="' +
            finderUrl +
            '" target="_blank" class="info-window-action-btn" title="Open ' +
            area.name +
            ' in Neighborhood Finder">Neighborhood Finder&trade; <svg style="display:inline;width:1.1em;height:1.1em;vertical-align:middle;margin-left:2px" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>' +
            nextBtn
        );
    } else {
        // Full mode: Matching Listings button
        const areaConfig = (window.areaPresets?.presets || []).find(p => p.name === area.name);
        const areaParam = areaConfig?.listingsParam || 'area_' + encodeURIComponent(area.name) + '/';
        const listingsUrl =
            'https://www.truesouthcoastalhomes.com/property-search/results/?searchtype=3#listtype_1/' + areaParam;
        return (
            prevBtn +
            '<a href="' +
            listingsUrl +
            '" target="_blank" class="info-window-action-btn" onclick="event.stopPropagation();" title="View all ' +
            area.name +
            ' listings">Matching Listings</a>' +
            nextBtn
        );
    }
}

/**
 * Show info window content for neighborhood markers.
 * @param {Object} marker - Google Maps marker
 * @param {Object} n - Neighborhood data object
 * @param {Object} targetInfoWindow - Google Maps InfoWindow instance
 * @param {boolean} storeAsActive - Whether to store as current neighborhood (default: true)
 */
export function showNeighborhoodInfoWindowContent(marker, n, targetInfoWindow, storeAsActive = true) {
    // Handle area markers
    if (n.isAreaMarker) {
        return showPresetInfoWindowContent(marker, n, targetInfoWindow);
    }

    // Use mini info window if URL param infoWindowSize=mini
    if (window.useMiniInfoWindow) {
        return showMiniInfoWindowContent(marker, n, targetInfoWindow);
    }

    // Only store as current neighborhood for primary (click) window
    if (storeAsActive && targetInfoWindow === window.infoWindow) {
        window.currentNeighborhood = n;
    }

    const stats = n.stats || {};
    const medianPrice = stats.medianPrice || stats.avgPrice || 0;
    const medianPriceDisplay = formatPrice(medianPrice);
    const pricePerSqFt =
        stats.avgPricePerSqFt || (stats.avgSqft > 0 ? Math.round((stats.avgPrice || 0) / stats.avgSqft) : 0);
    const listingLabel = getListingLabel(n.propertyType);
    const selectedAmenities =
        window.filterState && window.filterState.amenities ? window.filterState.amenities : new Set();
    const formatAmenitiesList = (list = []) => {
        const escape = str => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return (
            list
                .map(a => {
                    const safe = escape(a);
                    return selectedAmenities.has(a) ? `<strong>${safe}</strong>` : safe;
                })
                .join(', ') + '.'
        );
    };

    // Build listings URL with filter slugs
    const listingsUrl = buildListingsUrl(n);
    const filtered = window.filteredNeighborhoods || [];
    const hasNav = filtered.length > 1;

    const content = `
        <div class="info-window" style="cursor: pointer;" tabindex="-1">
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <h3 class="info-window-title" style="margin-bottom: 0;">${n.name}</h3>
                ${
                    n.urlSlug
                        ? `
                <a href="https://www.truesouthcoastalhomes.com${n.urlSlug}"
                   target="_blank"
                   style="color: var(--color-brand-base); flex-shrink: 0;"
                   onclick="event.stopPropagation();"
                   title="${n.name} ${n.propertyType} for Sale">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                </a>
                `
                        : ''
                }
            </div>
            <div class="info-window-stats">
                <div class="info-window-stat">
                    <div class="info-window-stat-value">${stats.listingCount || 0}</div>
                    <div class="info-window-stat-label">${listingLabel}</div>
                </div>
                <div class="info-window-stat">
                    <div class="info-window-stat-value">${medianPriceDisplay}</div>
                    <div class="info-window-stat-label">Med List Price</div>
                </div>
                <div class="info-window-stat">
                    <div class="info-window-stat-value">$${pricePerSqFt.toLocaleString()}</div>
                    <div class="info-window-stat-label">Avg $/Sq Ft</div>
                </div>
                <div class="info-window-stat">
                    <div class="info-window-stat-value">${stats.avgDom || 0}</div>
                    <div class="info-window-stat-label">Avg DOM</div>
                </div>
            </div>
            ${
                (n.amenities || []).length > 0
                    ? `
            <div class="info-window-section">
                <div class="info-window-section-title">Amenities</div>
                <div class="amenities-scroll info-window-section-content">${formatAmenitiesList(n.amenities || [])}</div>
            </div>
            `
                    : ''
            }
            <hr class="divider">
            <div class="info-window-nav">
                ${
                    hasNav
                        ? `
                <button id="nav-prev" onclick="window.navigateNeighborhood(-1)" class="info-window-nav-btn" title="Previous Community">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                `
                        : ''
                }
                ${buildMainButton(n, listingsUrl)}
                ${
                    hasNav
                        ? `
                <button id="nav-next" onclick="window.navigateNeighborhood(1)" class="info-window-nav-btn" title="Next Community">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                `
                        : ''
                }
            </div>
        </div>
    `;

    targetInfoWindow.setContent(content);
    targetInfoWindow.open(window.map, marker);

    eventBus.emit(Events.INFO_WINDOW_OPENED, { neighborhood: n });
}

/**
 * Get listing label based on property type.
 * @param {string} propertyType - Property type
 * @returns {string} Label text
 */
function getListingLabel(propertyType) {
    const t = (propertyType || '').toLowerCase();
    if (t.includes('townhome')) return 'Active T/H Listings';
    if (t.includes('condo')) return 'Active Condo Listings';
    if (t.includes('home')) return 'Active Home Listings';
    return 'Active Listings';
}

/**
 * Build listings URL with dynamic filter slugs.
 * @param {Object} n - Neighborhood data object
 * @returns {string} Full listings URL
 */
function buildListingsUrl(n) {
    const propertyType = (n.propertyType || 'homes').toLowerCase();

    // Dynamic filter slugs from filterState
    const fs = window.filterState || {};
    const PRICE_STEPS = window.PRICE_STEPS || [];
    const bedsMin = fs.bedsMin || 1;
    const bathsMin = fs.bathsMin || 1;
    const priceMin = fs.priceMin > 0 ? PRICE_STEPS[fs.priceMin] : null;
    const priceMax = fs.priceMax < 41 ? PRICE_STEPS[fs.priceMax] : null;

    const bedsSlug = bedsMin > 1 ? `beds_${bedsMin}/` : '';
    const bathsSlug = bathsMin > 1 ? `baths_${bathsMin}/` : '';
    const priceMinSlug = priceMin ? `lprice_${priceMin}/` : '';
    const priceMaxSlug = priceMax && priceMax < 35000000 ? `uprice_${priceMax}/` : '';

    // Determine property type descrip
    let typeDescrip = '';
    if (propertyType.includes('townhome')) {
        typeDescrip = 'listtypedescrip_attached%20single%20unit/';
    } else if (propertyType.includes('condo')) {
        typeDescrip = 'listtypedescrip_condominium/';
    } else if (propertyType.includes('lot') || propertyType.includes('land') || propertyType.includes('vacant')) {
        typeDescrip = '';
    } else {
        typeDescrip = 'listtypedescrip_detached%20single%20family/';
    }

    // Determine listtype based on property type
    let listType = 'listtype_1';
    if (propertyType.includes('lot') || propertyType.includes('land') || propertyType.includes('vacant')) {
        listType = 'listtype_4';
    }

    const slugPart = `#${listType}/${priceMinSlug}${priceMaxSlug}${bedsSlug}${bathsSlug}${typeDescrip}`;

    // Build search parameter using subdivision names (Sierra uses + for space, %26% for &)
    // Convert to proper case for cleaner URLs
    const toProperCase = str => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    const encodeSubdiv = s => toProperCase(s).replace(/ /g, '+').replace(/&/g, '%26%');

    let searchParam;
    if (n.mlsSubdivisions && n.mlsSubdivisions.length > 0) {
        const subdivisions = n.mlsSubdivisions.map(encodeSubdiv).join(',');
        searchParam = `subdivision=${subdivisions}`;
    } else {
        searchParam = `subdivision=${encodeSubdiv(n.name)}`;
    }

    return `https://www.truesouthcoastalhomes.com/property-search/results/?searchtype=3&${searchParam}${slugPart}`;
}

/**
 * Build the main action button (Neighborhood Finder or Matching Listings).
 * @param {Object} n - Neighborhood data object
 * @param {string} listingsUrl - URL for listings
 * @returns {string} HTML button string
 */
function buildMainButton(n, listingsUrl) {
    const stats = n.stats || {};

    if (window.isSingleMode) {
        // Single mode: link to Community Finder with marker parameter
        const neighborhoodSlug = window.toSlug
            ? window.toSlug(n.name)
            : n.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const propertyTypeParam = n.propertyType ? '&propertyType=' + encodeURIComponent(n.propertyType) : '';
        const baseUrl =
            window.location.hostname === 'localhost'
                ? window.location.origin
                : 'https://neighborhoods.truesouthcoastalhomes.com';
        const finderUrl = baseUrl + '?marker=' + neighborhoodSlug + propertyTypeParam;
        return (
            '<a href="' +
            finderUrl +
            '" target="_blank" class="info-window-action-btn" title="Open ' +
            n.name +
            ' in Neighborhood Finder">Neighborhood Finder&trade; <svg style="display:inline;width:1.1em;height:1.1em;vertical-align:middle;margin-left:2px" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>'
        );
    } else if (listingsUrl) {
        return (
            '<a href="' +
            listingsUrl +
            "\" target=\"_blank\" class=\"info-window-action-btn\" onclick=\"event.stopPropagation(); if(typeof gtag!=='undefined')gtag('event','view_listings',{neighborhood_name:'" +
            n.name +
            "',listing_count:" +
            (stats.listingCount || 0) +
            ",property_type:'" +
            n.propertyType +
            '\'});" title="View all ' +
            n.name +
            ' ' +
            n.propertyType +
            ' for sale">Matching Listings</a>'
        );
    } else {
        return (
            '<button class="info-window-action-btn disabled" disabled title="MLS listings coming soon for ' +
            n.name +
            '">Coming Soon!</button>'
        );
    }
}

/**
 * Show mini info window content - compact variant for space-constrained contexts.
 * Shows only: title, active listings count, and Neighborhood Finder button.
 * @param {Object} marker - Google Maps marker
 * @param {Object} n - Neighborhood or area data object
 * @param {Object} targetInfoWindow - Google Maps InfoWindow instance
 */
export function showMiniInfoWindowContent(marker, n, targetInfoWindow) {
    // Use propertyType-specific stats for area markers
    const stats = n.isAreaMarker
        ? getAreaStats(n, n.propertyType)
        : (n.stats || {});
    const propertyType = n.propertyType || window.filterState?.propertyType || 'Homes';

    // Build Neighborhood Finder URL
    const neighborhoodSlug = window.toSlug
        ? window.toSlug(n.name)
        : n.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const propertyTypeParam = propertyType ? '&propertyType=' + encodeURIComponent(propertyType) : '';
    const baseUrl =
        window.location.hostname === 'localhost'
            ? window.location.origin
            : 'https://neighborhoods.truesouthcoastalhomes.com';
    const finderUrl = baseUrl + '?marker=' + neighborhoodSlug + propertyTypeParam;

    // Use getAreaTitle for area markers to show "Destin Homes" or "Destin Condos"
    // For regular neighborhoods, show name + propertyType like before
    const title = n.isAreaMarker ? getAreaTitle(n) : `${n.name} ${propertyType}`;

    const content = `
        <div class="info-window info-window-mini">
            <h3 class="info-window-title">${title}</h3>
            <div class="info-window-stat">
                <div class="info-window-stat-value">${stats.listingCount || 0}</div>
                <div class="info-window-stat-label">Active</div>
            </div>
            <hr class="divider">
            <div class="info-window-nav">
                <a href="${finderUrl}" target="_blank" class="info-window-action-btn" title="Open ${n.name} in Neighborhood Finder">
                    <span>Neighborhood</span>
                    <span>Finder&trade; <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></span>
                </a>
            </div>
        </div>
    `;

    targetInfoWindow.setContent(content);
    targetInfoWindow.open(window.map, marker);
}

// Expose on window for legacy code during transition
if (typeof window !== 'undefined') {
    window.showNeighborhoodInfoWindowContent = showNeighborhoodInfoWindowContent;
    window.showPresetInfoWindowContent = showPresetInfoWindowContent;
    window.showMiniInfoWindowContent = showMiniInfoWindowContent;
}

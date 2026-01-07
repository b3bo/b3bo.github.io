/**
 * @file ui/infoWindow.js
 * @description Info window content templates for Google Maps markers.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { eventBus, Events } from '../core/eventBus.js';

/**
 * Show info window content for area markers.
 * @param {Object} marker - Google Maps marker
 * @param {Object} area - Area data object
 * @param {Object} targetInfoWindow - Google Maps InfoWindow instance
 */
export function showAreaInfoWindowContent(marker, area, targetInfoWindow) {
    // Use type-specific stats if propertyType is set, otherwise use combined stats
    const propType = (area.propertyType || '').toLowerCase();
    const stats = propType === 'homes' ? (area.homeStats || area.stats || {})
                : propType === 'condos' ? (area.condoStats || area.stats || {})
                : (area.stats || {});
    const formatPrice = window.formatPrice || (p => '$' + (p / 1000000).toFixed(1) + 'M');
    const neighborhoodsList = (area.neighborhoods || [])
        .slice(0, 10)
        .map(n => n.name)
        .join(', ');

    const content = `
        <div class="info-window p-2 sm:p-3 max-w-sm bg-white dark:bg-dark-bg-elevated">
            <h3 class="text-base sm:text-lg font-semibold text-neutral-800 dark:text-dark-text-primary mb-2 text-center">${area.name}</h3>
            <div class="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">${stats.listingCount || 0}</div>
                    <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Active Listings</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">${formatPrice(stats.medianPrice || 0)}</div>
                    <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Median Price</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">$${(stats.avgPricePerSqFt || 0).toLocaleString()}</div>
                    <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Avg $/Sq Ft</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">${stats.avgDom || 0}</div>
                    <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Avg DOM</div>
                </div>
            </div>
            <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 p-2 sm:p-3 rounded-lg border border-neutral-200 dark:border-dark-border mb-2 sm:mb-3">
                <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-1">Top Communities</div>
                <div class="communities-scroll text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">${neighborhoodsList}</div>
            </div>
            <hr class="divider mb-2 sm:mb-3">
            <div class="pt-2 sm:pt-3 flex items-center gap-1.5 sm:gap-2">
                ${buildAreaNavButtons(area)}
            </div>
        </div>
    `;

    targetInfoWindow.setContent(content);
    targetInfoWindow.open(window.map, marker);

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
        ? '<button id="nav-prev" onclick="window.navigateNeighborhood(-1)" class="p-2 rounded-full border border-neutral-300 dark:border-dark-border hover:bg-brand-100 dark:hover:bg-brand-dark/20 text-neutral-600 dark:text-dark-text-secondary transition-colors flex-shrink-0 focus-ring" title="Previous Community"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>'
        : '';
    const nextBtn = hasNav
        ? '<button id="nav-next" onclick="window.navigateNeighborhood(1)" class="p-2 rounded-full border border-neutral-300 dark:border-dark-border hover:bg-brand-100 dark:hover:bg-brand-dark/20 text-neutral-600 dark:text-dark-text-secondary transition-colors flex-shrink-0 focus-ring" title="Next Community"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>'
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
            '" target="_blank" class="flex-1 text-center bg-brand-500 dark:bg-brand-dark hover:bg-brand-600 dark:hover:bg-brand-dark-hover text-white py-2.5 px-4 rounded-lg font-medium transition-colors" title="Open ' +
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
            '" target="_blank" class="flex-1 text-center bg-brand-500 dark:bg-brand-dark hover:bg-brand-600 dark:hover:bg-brand-dark-hover text-white py-2.5 px-4 rounded-lg font-medium transition-colors" onclick="event.stopPropagation();" title="View all ' +
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
export function showInfoWindowContent(marker, n, targetInfoWindow, storeAsActive = true) {
    // Handle area markers
    if (n.isAreaMarker) {
        return showAreaInfoWindowContent(marker, n, targetInfoWindow);
    }

    // Only store as current neighborhood for primary (click) window
    if (storeAsActive && targetInfoWindow === window.infoWindow) {
        window.currentNeighborhood = n;
    }

    const formatPrice = window.formatPrice || (p => '$' + (p / 1000000).toFixed(1) + 'M');
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
        <div class="info-window p-2 sm:p-3 max-w-sm bg-white dark:bg-dark-bg-elevated" style="cursor: pointer;" tabindex="-1">
            <div class="flex items-center justify-center gap-2 mb-2">
                <h3 class="text-base sm:text-lg font-semibold text-neutral-800 dark:text-dark-text-primary">${n.name}</h3>
                ${
                    n.urlSlug
                        ? `
                <a href="https://www.truesouthcoastalhomes.com${n.urlSlug}"
                   target="_blank"
                   class="text-brand-500 dark:text-brand-dark hover:text-brand-600 dark:hover:text-brand-dark-hover transition-colors focus-ring rounded"
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
            <div class="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">${stats.listingCount || 0}</div>
                    <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">${listingLabel}</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">${medianPriceDisplay}</div>
                    <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Med List Price</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">$${pricePerSqFt.toLocaleString()}</div>
                    <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Avg $/Sq Ft</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">${stats.avgDom || 0}</div>
                    <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Avg DOM</div>
                </div>
            </div>
            ${
                (n.amenities || []).length > 0
                    ? `
            <div class="mb-2 sm:mb-3">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 p-2 sm:p-3 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-1">Amenities</div>
                    <div class="amenities-scroll text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary leading-tight">${formatAmenitiesList(n.amenities || [])}</div>
                </div>
            </div>
            `
                    : ''
            }
            <hr class="divider mb-2 sm:mb-3">
            <div class="pt-2 sm:pt-3 flex items-center gap-1.5 sm:gap-2">
                ${
                    hasNav
                        ? `
                <button id="nav-prev" onclick="window.navigateNeighborhood(-1)" class="p-2 rounded-full border border-neutral-300 dark:border-dark-border hover:bg-brand-100 dark:hover:bg-brand-dark/20 text-neutral-600 dark:text-dark-text-secondary transition-colors flex-shrink-0 focus-ring" title="Previous Community">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                `
                        : ''
                }
                ${buildMainButton(n, listingsUrl)}
                ${
                    hasNav
                        ? `
                <button id="nav-next" onclick="window.navigateNeighborhood(1)" class="p-2 rounded-full border border-neutral-300 dark:border-dark-border hover:bg-brand-100 dark:hover:bg-brand-dark/20 text-neutral-600 dark:text-dark-text-secondary transition-colors flex-shrink-0 focus-ring" title="Next Community">
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
            '" target="_blank" class="flex-1 text-center bg-brand-500 dark:bg-brand-dark hover:bg-brand-600 dark:hover:bg-brand-dark-hover text-white py-2.5 px-4 rounded-lg font-medium transition-colors" title="Open ' +
            n.name +
            ' in Neighborhood Finder">Neighborhood Finder&trade; <svg style="display:inline;width:1.1em;height:1.1em;vertical-align:middle;margin-left:2px" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>'
        );
    } else if (listingsUrl) {
        return (
            '<a href="' +
            listingsUrl +
            "\" target=\"_blank\" class=\"flex-1 text-center bg-brand-500 dark:bg-brand-dark hover:bg-brand-600 dark:hover:bg-brand-dark-hover text-white py-2.5 px-4 rounded-lg font-medium transition-colors\" onclick=\"event.stopPropagation(); if(typeof gtag!=='undefined')gtag('event','view_listings',{neighborhood_name:'" +
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
            '<button class="flex-1 bg-neutral-300 dark:bg-dark-bg-elevated-2 text-neutral-500 dark:text-dark-text-secondary py-2.5 px-4 rounded-lg font-medium opacity-50 cursor-not-allowed" disabled title="MLS listings coming soon for ' +
            n.name +
            '">Coming Soon!</button>'
        );
    }
}

// Expose on window for legacy code during transition
if (typeof window !== 'undefined') {
    window.showInfoWindowContent = showInfoWindowContent;
    window.showAreaInfoWindowContent = showAreaInfoWindowContent;
}

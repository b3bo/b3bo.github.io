/**
 * @file ui/results.js
 * @description Results list rendering and sorting for neighborhood sidebar.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { eventBus, Events } from '../core/eventBus.js';

/**
 * Format amenities with selected ones highlighted in bold.
 * @param {string[]} amenitiesArr - Array of amenity names
 * @returns {string} Formatted HTML string
 */
export function formatAmenitiesWithSelection(amenitiesArr) {
    if (!amenitiesArr || amenitiesArr.length === 0) return 'No amenities listed';
    const selected = window.filterState?.amenities || new Set();
    return amenitiesArr.map(a => (selected.has(a) ? `<strong>${a}</strong>` : a)).join(', ') + '.';
}

/**
 * Get listing label based on property type.
 * @returns {string} Formatted label
 */
export function listingLabelForType() {
    // Use simple "Active" label to match area info-window style
    return 'Active';
}

/**
 * Check if any filters are active (non-default values).
 * @returns {boolean} True if filters are active
 */
export function hasActiveFilters() {
    const fs = window.filterState || {};
    const totalNeighborhoods = (window.neighborhoods || []).length;
    const filteredCount = (window.filteredNeighborhoods || []).length;

    // If filtered count differs from total, filters are active
    if (filteredCount < totalNeighborhoods) return true;

    // Also check explicit filter states
    if (window.searchQuery) return true;
    if (fs.propertyType) return true;
    if (fs.areas && fs.areas.size > 0) return true;
    if (fs.amenities && fs.amenities.size > 0) return true;
    if (fs.priceMin > 0 || fs.priceMax < 41) return true;
    if (fs.bedsMin > 1 || fs.bathsMin > 1) return true;

    return false;
}

/**
 * Render the results list in the sidebar.
 * Sorts neighborhoods and updates count with optional Clear button.
 */
export function renderResults() {
    const list = document.getElementById('neighborhoodList');
    const resultsCount = document.getElementById('resultsCount');

    if (!list) return;

    // Sort neighborhoods (read from window for current state)
    const currentFiltered = window.filteredNeighborhoods || [];
    const currentSort = window.sortOrder || 'listings-desc';
    const sorted = [...currentFiltered].sort((a, b) => {
        const aPrice = a.stats?.medianPrice || a.stats?.avgPrice || 0;
        const bPrice = b.stats?.medianPrice || b.stats?.avgPrice || 0;
        const aListings = a.stats?.listingCount || 0;
        const bListings = b.stats?.listingCount || 0;
        switch (currentSort) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'price-asc':
                return aPrice - bPrice;
            case 'price-desc':
                return bPrice - aPrice;
            case 'listings-desc':
                return bListings - aListings;
            default:
                return a.name.localeCompare(b.name);
        }
    });

    // Update count with optional Clear pill (animated number)
    if (resultsCount) {
        const count = sorted.length;
        const suffix = count === 1 ? 'Neighborhood' : 'Neighborhoods';
        const clearBtn = hasActiveFilters()
            ? ` <button id="clear-filters" class="ml-2 px-2 py-0.5 text-xs font-medium rounded-md border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg-elevated text-neutral-600 dark:text-dark-text-secondary hover:bg-brand-100 dark:hover:bg-brand-dark/20 hover:text-brand-700 dark:hover:text-brand-dark transition-colors">Clear</button>`
            : '';

        // Use span for animated number - get last count from window
        const lastCount = window.lastDisplayedCount !== null ? window.lastDisplayedCount : count;

        // Put just the number in resultsCount
        resultsCount.innerHTML = `<span class="count-number">${lastCount}</span>`;

        // Put label + clear button in resultsLabel
        const resultsLabel = document.getElementById('resultsLabel');
        if (resultsLabel) {
            resultsLabel.innerHTML = `${suffix}${clearBtn}`;
        }

        // Animate the count change
        if (window.animateCount) {
            window.animateCount(resultsCount, count);
        }

        // Add click handler for Clear button
        if (hasActiveFilters()) {
            const clearBtnEl = document.getElementById('clear-filters');
            if (clearBtnEl) {
                clearBtnEl.addEventListener('click', e => {
                    e.stopPropagation();
                    if (window.clearAllFilters) {
                        window.clearAllFilters();
                    }
                });
            }
        }
    }

    // Render list - use buttons for WCAG keyboard navigation
    const fmt = window.formatPrice || (p => '$' + (p / 1000000).toFixed(1) + 'M');
    list.innerHTML = sorted
        .map(
            n => `
        <button type="button" class="neighborhood-item w-full text-left bg-white dark:bg-dark-bg-elevated px-4 py-3 rounded-xl border border-neutral-200 dark:border-dark-border cursor-pointer overflow-hidden transition-colors hover:bg-brand-100 dark:hover:bg-brand-dark/20 active:bg-brand-200 dark:active:bg-brand-dark/30"
             data-name="${n.name}" data-type="${n.propertyType}">
            <div class="flex justify-between items-start gap-2 mb-1">
                <h3 class="text-base font-semibold text-neutral-800 dark:text-dark-text-primary break-words">${n.name}</h3>
                <span class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary whitespace-nowrap">${fmt(n.stats?.medianPrice || n.stats?.avgPrice || 0)}</span>
            </div>
            <div class="text-xs text-neutral-600 dark:text-dark-text-secondary mb-3">${n.stats?.listingCount || 0} ${listingLabelForType(n.propertyType)}</div>
            <div class="text-xs text-neutral-600 dark:text-dark-text-secondary leading-relaxed break-words">${formatAmenitiesWithSelection(n.amenities || [])}</div>
        </button>
    `
        )
        .join('');

    // Add click handlers for neighborhood items
    list.querySelectorAll('.neighborhood-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.name;
            const type = item.dataset.type;
            const n = (window.filteredNeighborhoods || []).find(x => x.name === name && x.propertyType === type);
            if (n && window.map) {
                // Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'select_neighborhood', {
                        neighborhood_name: n.name,
                        listing_count: n.stats?.listingCount || 0,
                        price: fmt(n.stats?.medianPrice || n.stats?.avgPrice || 0)
                    });
                }

                // Smooth fly animation (maintain current zoom to preserve area context)
                if (window.smoothFlyTo && window.map) {
                    window.smoothFlyTo(n.position, window.map.getZoom());
                }

                // Find and click marker after flight
                const marker = (window.markers || []).find(
                    m => m.neighborhood.name === name && m.neighborhood.propertyType === type
                );
                if (marker) {
                    // Calculate distance to determine delay
                    const startPos = window.map.getCenter();
                    const targetLatLng = new google.maps.LatLng(n.position);
                    const distance = google.maps.geometry.spherical.computeDistanceBetween(startPos, targetLatLng);
                    const delay = distance < 2000 ? 450 : 2200;

                    setTimeout(() => {
                        google.maps.event.trigger(marker.marker, 'click');
                    }, delay);
                }
            }
        });
    });

    // Emit event for other modules
    eventBus.emit(Events.RESULTS_RENDERED, { count: sorted.length });
}

// Expose on window for legacy code during transition
if (typeof window !== 'undefined') {
    window.renderResults = renderResults;
    window.formatAmenitiesWithSelection = formatAmenitiesWithSelection;
    window.listingLabelForType = listingLabelForType;
    window.hasActiveFilters = hasActiveFilters;
}

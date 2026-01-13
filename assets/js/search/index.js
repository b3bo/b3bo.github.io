/**
 * @file search/index.js
 * @description Neighborhood search with debounced input and result highlighting.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { eventBus, Events } from '../core/eventBus.js';

// Track debounce timer
let searchDebounceTimer = null;

/**
 * Highlight matching text within a label (case-insensitive, HTML-safe).
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} HTML with matching parts in bold
 */
export function highlightMatch(text, query) {
    if (!query) return text;
    const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${pattern})`, 'ig');
    return safeText.replace(regex, '<strong>$1</strong>');
}

/**
 * Get default search results (top neighborhoods by listing count).
 * @returns {Array} Top 5 neighborhoods sorted by listing count
 */
export function getDefaultSearchResults() {
    const neighborhoods = window.neighborhoods || [];
    return [...neighborhoods].sort((a, b) => (b.stats?.listingCount || 0) - (a.stats?.listingCount || 0)).slice(0, 5);
}

/**
 * Search neighborhoods by query.
 * Matches name, city, and zip code. Prioritizes name matches.
 * @param {string} query - Search query (lowercase)
 * @returns {Array} Matching neighborhoods sorted by relevance
 */
export function searchNeighborhoods(query) {
    if (!query) return getDefaultSearchResults();

    const neighborhoods = window.neighborhoods || [];
    return neighborhoods
        .filter(
            n =>
                n.name.toLowerCase().includes(query) ||
                (n.location?.city || '').toLowerCase().includes(query) ||
                (n.zipCode || '').includes(query)
        )
        .sort((a, b) => {
            // Prioritize name matches
            const aNameMatch = a.name.toLowerCase().includes(query) ? 0 : 1;
            const bNameMatch = b.name.toLowerCase().includes(query) ? 0 : 1;
            if (aNameMatch !== bNameMatch) return aNameMatch - bNameMatch;
            return a.name.localeCompare(b.name);
        });
}

/**
 * Render search results in dropdown.
 * @param {HTMLElement} resultsContainer - Container for results
 * @param {string} query - Search query (raw, not lowercased)
 */
export function renderSearchResults(resultsContainer, query) {
    if (!resultsContainer) return;

    const queryLower = (query || '').toLowerCase();

    if (!queryLower) {
        // Show default "Most Listings" results
        const topListings = getDefaultSearchResults();
        resultsContainer.innerHTML = `
            <div class="px-4 py-2 text-xs font-medium text-neutral-400 dark:text-dark-text-secondary uppercase">Most Listings</div>
            ${topListings
                .map(
                    n => `
                <button class="search-result w-full text-left px-4 py-2 text-sm hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors cursor-pointer" data-name="${n.name}" data-type="${n.propertyType}">
                    ${n.name} - ${n.propertyType}
                </button>
            `
                )
                .join('')}
        `;
    } else {
        const matches = searchNeighborhoods(queryLower);

        if (matches.length) {
            resultsContainer.innerHTML = matches
                .map(
                    n => `
                <button class="search-result w-full text-left px-4 py-2 text-sm hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors cursor-pointer" data-name="${n.name}" data-type="${n.propertyType}">
                    ${highlightMatch(n.name, query)} - ${highlightMatch(n.propertyType, query)}
                </button>
            `
                )
                .join('');
        } else {
            resultsContainer.innerHTML = '<div class="px-4 py-3 text-sm text-neutral-400">No matches found</div>';
        }
    }

    // Detect overflow and add fade class
    if (resultsContainer.scrollHeight > resultsContainer.clientHeight + 4) {
        resultsContainer.classList.add('has-overflow');
    } else {
        resultsContainer.classList.remove('has-overflow');
    }
}

/**
 * Handle search input event.
 * Updates dropdown, filters main list, and updates markers.
 * @param {Event} e - Input event
 */
export function handleSearchInput(e) {
    const queryRaw = e.target.value.trim();
    const query = queryRaw.toLowerCase();
    const resultsContainer = document.getElementById('search-results');

    // Track search input (debounced analytics)
    if (query && typeof gtag !== 'undefined') {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            gtag('event', 'search_filter', { search_term: query });
        }, 500);
    }

    // Render dropdown results
    renderSearchResults(resultsContainer, queryRaw);

    // Live filter the main results list AND markers
    window.searchQuery = query;
    if (query) {
        window.filteredNeighborhoods = (window.neighborhoods || []).filter(n => n.name.toLowerCase().includes(query));
    } else {
        window.filteredNeighborhoods = [...(window.neighborhoods || [])];
    }

    if (window.renderResults) window.renderResults();
    if (window.addMarkers) window.addMarkers();

    // Emit search event
    eventBus.emit(Events.SEARCH_PERFORMED, { query, resultCount: window.filteredNeighborhoods.length });
}

/**
 * Handle search result selection.
 * Flies to neighborhood and opens info window.
 * @param {HTMLElement} resultElement - The clicked result button
 */
export function handleSearchResultClick(resultElement) {
    const name = resultElement.dataset.name;
    const type = resultElement.dataset.type;
    const searchInput = document.getElementById('search-input');
    const searchDropdown = document.getElementById('search-dropdown');

    const n = (window.neighborhoods || []).find(x => x.name === name && x.propertyType === type);

    if (n && window.map) {
        // Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'search_select', {
                neighborhood_name: n.name,
                search_query: searchInput?.value || ''
            });
        }

        // Smooth fly animation
        if (window.smoothFlyTo) {
            window.smoothFlyTo(n.position);
        }

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

    // Close dropdown and clear search
    if (searchDropdown) searchDropdown.classList.add('hidden');
    if (searchInput) searchInput.value = '';

    // Clear search filter and reset list + markers
    window.searchQuery = '';
    window.filteredNeighborhoods = [...(window.neighborhoods || [])];
    if (window.renderResults) window.renderResults();
    if (window.addMarkers) window.addMarkers();

    eventBus.emit(Events.SEARCH_RESULT_SELECTED, { name, type });
}

/**
 * Clear search and reset results.
 */
export function clearSearch() {
    const searchInput = document.getElementById('search-input');
    const searchDropdown = document.getElementById('search-dropdown');

    if (searchInput) searchInput.value = '';
    if (searchDropdown) searchDropdown.classList.add('hidden');

    window.searchQuery = '';
    window.filteredNeighborhoods = [...(window.neighborhoods || [])];
    if (window.renderResults) window.renderResults();
    if (window.addMarkers) window.addMarkers();
}

// Expose on window for legacy code during transition
if (typeof window !== 'undefined') {
    window.handleSearchInput = handleSearchInput;
    window.handleSearchResultClick = handleSearchResultClick;
    window.highlightMatch = highlightMatch;
    window.searchNeighborhoods = searchNeighborhoods;
    window.clearSearch = clearSearch;
}

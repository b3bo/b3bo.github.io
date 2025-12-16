/**
 * @file search.js
 * @description Community search functionality with autocomplete dropdown.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { STATE } from './state.js';
import { smoothFlyTo } from './map.js?v=202501';
import { applyFilters } from './filters.js';

let searchDropdown = null;
let searchInput = null;
let searchResults = null;
let searchButton = null;

/**
 * Get top communities by listing count (respects current filter criteria)
 * @returns {Array} Top 5 neighborhoods by listing count from filtered results
 */
function getTopCommunities() {
    // Use filtered results if available, otherwise fall back to all neighborhoods
    const source = STATE.allFilteredNeighborhoods?.length > 0
        ? STATE.allFilteredNeighborhoods
        : STATE.neighborhoods;

    return [...source]
        .sort((a, b) => (b.stats?.listingCount || 0) - (a.stats?.listingCount || 0))
        .slice(0, 5);
}

/**
 * Filter neighborhoods by name (case-insensitive partial match)
 * @param {string} query - Search query
 * @returns {Array} Matching neighborhoods (max 10)
 */
function filterByName(query) {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    return STATE.neighborhoods
        .filter(n => n.name.toLowerCase().includes(q))
        .slice(0, 10);
}

/**
 * Render search results in dropdown
 * @param {Array} results - Matching neighborhoods
 * @param {boolean} isPopular - Whether these are popular/suggested results
 */
function renderResults(results, isPopular = false) {
    if (!searchResults) return;

    if (results.length === 0) {
        const query = searchInput?.value?.trim();
        if (query) {
            searchResults.innerHTML = `
                <div class="px-4 py-3 text-sm text-neutral-500 dark:text-dark-text-secondary">
                    No matches found
                </div>
            `;
        } else {
            searchResults.innerHTML = '';
        }
        return;
    }

    const header = isPopular ? `
        <div class="px-4 py-2 text-xs font-medium text-neutral-400 dark:text-dark-text-secondary uppercase tracking-wide">
            Most Listings
        </div>
    ` : '';

    searchResults.innerHTML = header + results.map(n => `
        <button type="button" class="search-result w-full text-left px-4 py-2 text-sm hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors cursor-pointer focus:outline-none focus:bg-brand-100 dark:focus:bg-brand-dark/20" data-id="${n.name}">
            <span class="text-neutral-800 dark:text-dark-text-primary">${n.name}</span>
            <span class="text-neutral-500 dark:text-dark-text-secondary"> - ${n.propertyType}</span>
        </button>
    `).join('');
}

/**
 * Navigate to a specific neighborhood on the map
 * @param {Object} neighborhood - The neighborhood to navigate to
 */
function navigateToNeighborhood(neighborhood) {
    if (!neighborhood) return;

    // Find the marker for this neighborhood
    const markerObj = STATE.markers.find(m => m.neighborhood === neighborhood);
    const marker = markerObj ? markerObj.marker : null;

    // Close current info window
    if (STATE.infoWindow && STATE.infoWindow.getMap()) {
        STATE.infoWindow.close();
    }
    STATE.activeMarker = null;

    // Fly to the neighborhood
    smoothFlyTo(neighborhood.position, 15);

    // Auto-open info window after flight completes
    if (marker) {
        const startPos = STATE.map.getCenter();
        const targetLatLng = new google.maps.LatLng(neighborhood.position);
        const distance = google.maps.geometry.spherical.computeDistanceBetween(startPos, targetLatLng);
        const isShortHop = distance < 2000;
        const delay = isShortHop ? 450 : 2200;

        setTimeout(() => {
            google.maps.event.trigger(marker, 'click');
        }, delay);
    }

    // On mobile, close drawer to show map
    if (window.innerWidth < 768) {
        const drawerToggle = document.getElementById('drawer-toggle');
        if (drawerToggle) drawerToggle.checked = false;
    }
}

/**
 * Handle clicking a search result
 * @param {string} neighborhoodName - Name of the neighborhood clicked
 */
function handleResultClick(neighborhoodName) {
    const neighborhood = STATE.neighborhoods.find(n => n.name === neighborhoodName);
    if (neighborhood) {
        // Clear search and close dropdown
        if (searchInput) searchInput.value = '';
        closeDropdown();

        // Navigate to the neighborhood
        navigateToNeighborhood(neighborhood);

        // Track event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'search_select', {
                search_term: neighborhoodName,
                neighborhood_name: neighborhoodName
            });
        }
    }
}

/**
 * Apply search as a filter to the main list
 * @param {string} query - Search query to apply as filter
 */
function applySearchFilter(query) {
    STATE.searchQuery = query.trim();
    closeDropdown();

    // Update button appearance to show active filter
    updateButtonState();

    // Apply filters (which now includes searchQuery)
    applyFilters();

    // Track event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'search_filter', {
            search_term: query
        });
    }
}

/**
 * Clear the search filter
 */
export function clearSearchFilter() {
    STATE.searchQuery = '';
    if (searchInput) searchInput.value = '';
    updateButtonState();
    applyFilters();
}

/**
 * Update search button appearance based on active filter
 */
function updateButtonState() {
    if (!searchButton) return;

    if (STATE.searchQuery) {
        // Show active state - add visual indicator
        searchButton.classList.add('bg-brand-200', 'dark:bg-brand-dark/30', 'border-brand-400', 'dark:border-brand-dark');
        searchButton.classList.remove('bg-white', 'dark:bg-dark-bg-elevated', 'border-neutral-300', 'dark:border-dark-border');
    } else {
        // Reset to default state
        searchButton.classList.remove('bg-brand-200', 'dark:bg-brand-dark/30', 'border-brand-400', 'dark:border-brand-dark');
        searchButton.classList.add('bg-white', 'dark:bg-dark-bg-elevated', 'border-neutral-300', 'dark:border-dark-border');
    }
}

/**
 * Open the search dropdown
 */
function openDropdown() {
    if (!searchDropdown) return;

    searchDropdown.classList.remove('hidden');
    positionDropdown();

    // Focus the input
    if (searchInput) {
        searchInput.value = STATE.searchQuery || '';
        searchInput.focus();
        // Render results if there's an existing query, otherwise show popular
        if (STATE.searchQuery) {
            renderResults(filterByName(STATE.searchQuery));
        } else {
            renderResults(getTopCommunities(), true);
        }
    }
}

/**
 * Close the search dropdown
 */
function closeDropdown() {
    if (!searchDropdown) return;
    searchDropdown.classList.add('hidden');
}

/**
 * Toggle the search dropdown
 */
function toggleDropdown() {
    if (!searchDropdown) return;

    // Always close sort dropdown first
    const sortMenu = document.getElementById('sort-menu');
    if (sortMenu) sortMenu.classList.add('hidden');

    if (searchDropdown.classList.contains('hidden')) {
        openDropdown();
    } else {
        closeDropdown();
    }
}

/**
 * Position the dropdown below the button (portal style)
 */
function positionDropdown() {
    if (!searchDropdown || !searchButton) return;

    const searchRect = searchButton.getBoundingClientRect();
    const offsetY = 8;
    const viewportPadding = 20;
    const dropdownWidth = 280;

    // Account for iOS visual viewport shifts (keyboard/zoom) so the dropdown stays centered
    const vv = window.visualViewport;
    const viewportWidth = vv ? vv.width : window.innerWidth;
    const viewportLeft = vv ? vv.offsetLeft : 0;
    const viewportTop = vv ? vv.offsetTop : 0;

    // Center on search button
    const searchCenter = viewportLeft + searchRect.left + (searchRect.width / 2);
    let left = searchCenter - (dropdownWidth / 2);

    // Viewport constraints
    if (left + dropdownWidth > viewportLeft + viewportWidth - viewportPadding) {
        left = viewportLeft + viewportWidth - dropdownWidth - viewportPadding;
    }
    if (left < viewportLeft + viewportPadding) {
        left = viewportLeft + viewportPadding;
    }

    searchDropdown.style.position = 'fixed';
    searchDropdown.style.top = (viewportTop + searchRect.bottom + offsetY) + 'px';
    searchDropdown.style.left = left + 'px';
    searchDropdown.style.width = dropdownWidth + 'px';
    searchDropdown.style.zIndex = '2147483647';
}

/**
 * Debounce helper
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Initialize search functionality
 */
export function setupSearch() {
    searchButton = document.getElementById('search-button');
    searchDropdown = document.getElementById('search-dropdown');
    searchInput = document.getElementById('search-input');
    searchResults = document.getElementById('search-results');

    if (!searchButton || !searchDropdown || !searchInput || !searchResults) {
        console.warn('Search elements not found');
        return;
    }

    // Portal the dropdown to body for proper z-index handling
    document.body.appendChild(searchDropdown);

    // Button click toggles dropdown
    searchButton.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close sort menu
        const sortMenu = document.getElementById('sort-menu');
        if (sortMenu) sortMenu.classList.add('hidden');
        toggleDropdown();
    });

    // Input handler with debounce
    const debouncedSearch = debounce((query) => {
        if (query.trim()) {
            renderResults(filterByName(query));
        } else {
            renderResults(getTopCommunities(), true);
        }
    }, 150);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    // Keyboard handling
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                applySearchFilter(query);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeDropdown();
        } else if (e.key === 'Backspace' && searchInput.value === '' && STATE.searchQuery) {
            // Clear filter when backspacing on empty input
            clearSearchFilter();
        }
    });

    // iOS viewport reset on blur - fixes zoom drift issue
    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollLeft = 0;
            document.body.scrollLeft = 0;
        }, 100);
    });

    // Result click handling (delegated)
    searchResults.addEventListener('click', (e) => {
        const resultBtn = e.target.closest('.search-result');
        if (resultBtn) {
            const name = resultBtn.getAttribute('data-id');
            handleResultClick(name);
        }
    });

    // Close on click/touch outside
    document.addEventListener('click', (e) => {
        if (!searchDropdown.classList.contains('hidden') &&
            !searchDropdown.contains(e.target) &&
            e.target !== searchButton &&
            !searchButton.contains(e.target)) {
            closeDropdown();
        }
    });

    // Global escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !searchDropdown.classList.contains('hidden')) {
            e.preventDefault();
            closeDropdown();
        }
    });

    // Reposition on resize/scroll
    ['resize', 'orientationchange'].forEach(evt => {
        window.addEventListener(evt, () => {
            if (!searchDropdown.classList.contains('hidden')) {
                positionDropdown();
            }
        });
    });

    window.addEventListener('scroll', () => {
        if (!searchDropdown.classList.contains('hidden')) {
            positionDropdown();
        }
    }, true);

    // Handle iOS visual viewport changes (keyboard/zoom)
    if (window.visualViewport) {
        ['resize', 'scroll'].forEach(evt => {
            window.visualViewport.addEventListener(evt, () => {
                if (!searchDropdown.classList.contains('hidden')) {
                    positionDropdown();
                }
            });
        });
    }

    // Initialize button state
    updateButtonState();
}

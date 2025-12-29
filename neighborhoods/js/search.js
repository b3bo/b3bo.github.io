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
let selectedIndex = -1;

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
 * Highlight matching text in a string
 * @param {string} text - Original text
 * @param {string} query - Search query to highlight
 * @returns {string} HTML with matching text wrapped in <mark>
 */
function highlightMatch(text, query) {
    if (!query || !query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<strong class="font-semibold text-brand-700 dark:text-brand-dark">$1</strong>');
}

/**
 * Update visual highlight on search results and aria-activedescendant
 */
function updateSelectedHighlight() {
    if (!searchResults) return;
    const items = searchResults.querySelectorAll('.search-result');
    items.forEach((item, i) => {
        if (i === selectedIndex) {
            item.classList.add('bg-brand-100', 'dark:bg-brand-dark/20');
            item.setAttribute('aria-selected', 'true');
        } else {
            item.classList.remove('bg-brand-100', 'dark:bg-brand-dark/20');
            item.setAttribute('aria-selected', 'false');
        }
    });

    // Update aria-activedescendant on the input
    if (searchInput) {
        if (selectedIndex >= 0 && items[selectedIndex]) {
            searchInput.setAttribute('aria-activedescendant', items[selectedIndex].id);
        } else {
            searchInput.removeAttribute('aria-activedescendant');
        }
    }
}

/**
 * Render search results in dropdown
 * @param {Array} results - Matching neighborhoods
 * @param {boolean} isPopular - Whether these are popular/suggested results
 */
function renderResults(results, isPopular = false) {
    if (!searchResults) return;
    selectedIndex = -1; // Reset selection on new results

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

    const query = searchInput?.value?.trim() || '';
    searchResults.innerHTML = header + results.map((n, index) => `
        <button type="button" tabindex="-1" role="option" id="search-option-${index}" aria-selected="false" class="search-result w-full text-left px-4 py-2 text-sm hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors cursor-pointer" data-id="${n.name}">
            <span class="text-neutral-800 dark:text-dark-text-primary">${isPopular ? n.name : highlightMatch(n.name, query)}</span>
            <span class="text-neutral-500 dark:text-dark-text-secondary"> - ${n.propertyType}</span>
        </button>
    `).join('');

    // Clear aria-activedescendant since results were re-rendered
    if (searchInput) {
        searchInput.removeAttribute('aria-activedescendant');
    }
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

    // Ensure map is initialized
    if (!STATE.map) return;

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

    // Keep drawer open so users can browse multiple results
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

    // Update aria-expanded on trigger button
    if (searchButton) {
        searchButton.setAttribute('aria-expanded', 'true');
    }

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

    // Update aria-expanded on trigger button
    if (searchButton) {
        searchButton.setAttribute('aria-expanded', 'false');
    }

    // Clear aria-activedescendant
    if (searchInput) {
        searchInput.removeAttribute('aria-activedescendant');
    }

    // Reset selection
    selectedIndex = -1;

    // Return focus to trigger button
    if (searchButton && document.activeElement !== searchButton) {
        searchButton.focus();
    }
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
    const offsetY = 10;
    const viewportPadding = 12;

    // Account for iOS visual viewport shifts (keyboard/zoom) so the dropdown stays centered
    const vv = window.visualViewport;
    const viewportWidth = vv ? vv.width : window.innerWidth;
    const viewportLeft = vv ? vv.offsetLeft : 0;
    const viewportTop = vv ? vv.offsetTop : 0;

    // Center on search button (use 280px for centering to match sort menu)
    const dropdownWidth = 280;
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
    const top = Math.max(0, viewportTop + searchRect.bottom + offsetY);
    searchDropdown.style.top = top + 'px';
    searchDropdown.style.left = left + 'px';
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

    // Input handler with debounce - updates both dropdown AND filters main list
    const debouncedSearch = debounce((query) => {
        if (query.trim()) {
            renderResults(filterByName(query));
            // Also apply as filter to main list (live filtering)
            STATE.searchQuery = query.trim();
            updateButtonState();
            applyFilters();
        } else {
            renderResults(getTopCommunities(), true);
            // Clear filter when input is cleared
            if (STATE.searchQuery) {
                STATE.searchQuery = '';
                updateButtonState();
                applyFilters();
            }
        }
    }, 150);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    // Keyboard handling
    searchInput.addEventListener('keydown', (e) => {
        const items = searchResults.querySelectorAll('.search-result');
        const itemCount = items.length;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (itemCount > 0) {
                selectedIndex = (selectedIndex + 1) % itemCount;
                updateSelectedHighlight();
                items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (itemCount > 0) {
                selectedIndex = selectedIndex <= 0 ? itemCount - 1 : selectedIndex - 1;
                updateSelectedHighlight();
                items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // If an item is selected, navigate to it
            if (selectedIndex >= 0 && items[selectedIndex]) {
                const name = items[selectedIndex].getAttribute('data-id');
                handleResultClick(name);
            } else {
                // Otherwise apply as filter
                const query = searchInput.value.trim();
                if (query) {
                    applySearchFilter(query);
                }
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeDropdown();
        } else if (e.key === 'Backspace' && searchInput.value === '' && STATE.searchQuery) {
            // Clear filter when backspacing on empty input
            clearSearchFilter();
        } else if (e.key === 'Tab') {
            // Close dropdown on Tab - prevent default to keep focus on search button
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
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

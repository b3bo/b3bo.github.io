/**
 * @file ui.js
 * @description Handles UI rendering, list items, and event listeners.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { STATE } from './state.js';
import { CONFIG } from './config.js';
import { formatPrice } from './utils.js';
import { smoothFlyTo } from './map.js?v=202501';
import { applySortOnly } from './filters.js';

export function renderListItems(neighborhoodsToRender) {
    const listContainer = document.getElementById('neighborhoodList');

    neighborhoodsToRender.forEach(neighborhood => {
        // Find existing marker for this neighborhood to link click event
        const markerObj = STATE.markers.find(m => m.neighborhood === neighborhood);
        const marker = markerObj ? markerObj.marker : null;

        // Create List Item
        if (listContainer) {
            // Format price for card (e.g. $1.3M)
            // Use Median Price to match Info Window
            const price = neighborhood.stats.medianPrice || neighborhood.stats.avgPrice;
            const formattedPrice = formatPrice(price);

            const card = document.createElement('div');
            // Use the same brand-hover/active visual language as the sidebar menu items.
            // Also add focus-visible ring and keyboard support for accessibility.
            card.className = 'bg-white dark:bg-dark-bg-elevated px-4 py-3 rounded-xl border border-neutral-200 dark:border-dark-border cursor-pointer overflow-hidden transition-colors hover:bg-brand-100 dark:hover:bg-brand-dark/20 active:bg-brand-200 dark:active:bg-brand-dark/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-dark';
            card.setAttribute('role', 'button');
            card.tabIndex = 0;
            card.innerHTML = `
                <div class="flex justify-between items-start gap-2 mb-1">
                    <h3 class="text-base font-semibold text-neutral-800 dark:text-dark-text-primary break-words">${neighborhood.name}</h3>
                    <span class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary whitespace-nowrap">${formattedPrice}</span>
                </div>
                <div class="text-xs text-neutral-600 dark:text-dark-text-secondary mb-3">${neighborhood.stats.listingCount} Listings</div>
                <div class="text-xs text-neutral-600 dark:text-dark-text-secondary leading-relaxed break-words">
                    ${neighborhood.amenities.join(', ')}
                </div>
            `;
            
            // Add click listener to pan to marker (auto-open after landing when enabled)
            card.addEventListener('click', () => {
                if (!marker) return;

                // Track neighborhood card click
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'select_neighborhood', {
                        neighborhood_name: neighborhood.name,
                        listing_count: neighborhood.stats.listingCount,
                        price: formattedPrice
                    });
                }

                // Close current info window
                if (STATE.infoWindow && STATE.infoWindow.getMap()) {
                    STATE.infoWindow.close();
                }
                // Clear active marker
                STATE.activeMarker = null;

                // Calculate distance to determine animation timing
                const startPos = STATE.map.getCenter();
                const targetLatLng = new google.maps.LatLng(neighborhood.position);
                const distance = google.maps.geometry.spherical.computeDistanceBetween(startPos, targetLatLng);
                const isShortHop = distance < 2000;

                // Fly to new location
                smoothFlyTo(neighborhood.position, 15);

                // Auto-open after flight completes
                if (CONFIG.map.autoOpenOnFly) {
                    const delay = isShortHop ? 450 : 2200;
                    setTimeout(() => {
                        google.maps.event.trigger(marker, 'click');
                    }, delay);
                }
                
                // On mobile, close drawer to show map
                if (window.innerWidth < 768) {
                    document.getElementById('drawer-toggle').checked = false;
                }
            });

            // Support keyboard activation (Enter / Space) for accessibility
            card.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    card.click();
                }
            });

            listContainer.appendChild(card);
        }
    });
}

export function navigateNeighborhood(direction) {
    if (event) event.stopPropagation();
    if (!window.currentNeighborhood || !STATE.allFilteredNeighborhoods.length) return;
    
    const currentIndex = STATE.allFilteredNeighborhoods.indexOf(window.currentNeighborhood);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex + direction;
    // Wrap around
    if (newIndex < 0) newIndex = STATE.allFilteredNeighborhoods.length - 1;
    if (newIndex >= STATE.allFilteredNeighborhoods.length) newIndex = 0;
    
    const nextNeighborhood = STATE.allFilteredNeighborhoods[newIndex];
    const markerObj = STATE.markers.find(m => m.neighborhood === nextNeighborhood);
    
    if (markerObj) {
        const marker = markerObj.marker;
        
        // Close current info window and deactivate ripple
        if (STATE.infoWindow && STATE.infoWindow.getMap()) {
            STATE.infoWindow.close();
        }
        if (STATE.activeMarker) {
            // Import createMarkerIcon is not available here, so we'll let the click handler manage it
            STATE.activeMarker = null;
        }

        // Calculate distance to determine animation timing
        const startPos = STATE.map.getCenter();
        const targetLatLng = new google.maps.LatLng(nextNeighborhood.position);
        const distance = google.maps.geometry.spherical.computeDistanceBetween(startPos, targetLatLng);
        const isShortHop = distance < 2000;

        // Fly to new location
        smoothFlyTo(nextNeighborhood.position, 15);

        if (isShortHop) {
            // Short hop: fast animation - trigger click after brief delay
            setTimeout(() => {
                google.maps.event.trigger(marker, 'click');
            }, 450);
        } else {
            // Long flight: 2s animation - trigger click after flight completes
            setTimeout(() => {
                google.maps.event.trigger(marker, 'click');
            }, 2200);
        }
    }
}

function setupSortDropdown() {
    const sortButton = document.getElementById('sort-button');
    const sortMenu = document.getElementById('sort-menu');

    if (!sortButton || !sortMenu) {
        console.warn('Sort dropdown elements not found:', { sortButton, sortMenu });
        return;
    }

    console.log('Setting up sort dropdown');

    // Generate sort options dynamically
    // This generates the sort options padding.
    // Render sort options as content-driven rows.
    // Each button is sized by its contents (not forced full-width) so the container padding (p-6)
    // applied in `index.html` is visible. We keep `py-2` to preserve vertical spacing between items.
    sortMenu.innerHTML = CONFIG.ui.sortOptions.map(option => {
        const isActive = STATE.currentSort === option.id;
        return `
            <button class="sort-option w-full flex items-center justify-between px-4 py-2 text-sm cursor-pointer gap-2 text-left hover:bg-brand-100 dark:hover:bg-brand-dark/20 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-dark ${isActive ? 'active bg-brand-200 dark:bg-brand-dark/30 text-brand-700 dark:text-brand-dark font-medium' : 'text-neutral-600 font-normal'}" data-sort-id="${option.id}" type="button">
                <span class="truncate">${option.label}</span>
                ${isActive ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ml-3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
            </button>
        `;
    }).join('');

    // Toggle dropdown on button click
    // If we moved the menu to a portal and a separate handler is controlling toggling,
    // don't add a duplicate toggle handler here (prevents double-toggle).
    if (!sortMenu.dataset || sortMenu.dataset.portal !== 'true') {
        sortButton.addEventListener('click', (e) => {
            e.stopPropagation();
            sortMenu.classList.toggle('hidden');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!sortButton.contains(e.target) && !sortMenu.contains(e.target)) {
            sortMenu.classList.add('hidden');
        }
    });

    // Handle sort option selection
    sortMenu.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        const sortOption = e.target.closest('.sort-option');
        if (!sortOption) return;

        const sortId = sortOption.getAttribute('data-sort-id');
        const option = CONFIG.ui.sortOptions.find(opt => opt.id === sortId);

        if (option) {
            // Update state
            STATE.currentSort = sortId;

            // Update active state in menu
            sortMenu.querySelectorAll('.sort-option').forEach(opt => {
                const isActive = opt.getAttribute('data-sort-id') === sortId;

                // Toggle Tailwind classes
                opt.classList.toggle('active', isActive);
                opt.classList.toggle('bg-brand-200', isActive);
                opt.classList.toggle('dark:bg-brand-dark/30', isActive);
                opt.classList.toggle('text-brand-700', isActive);
                opt.classList.toggle('dark:text-brand-dark', isActive);
                opt.classList.toggle('font-medium', isActive);
                opt.classList.toggle('text-neutral-600', !isActive);
                opt.classList.toggle('font-normal', !isActive);

                // Add/remove checkmark
                const checkmark = opt.querySelector('svg');
                if (isActive && !checkmark) {
                    opt.innerHTML += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
                } else if (!isActive && checkmark) {
                    checkmark.remove();
                }
            });

            // Close dropdown
            sortMenu.classList.add('hidden');

            // Re-sort and re-render list only (don't recreate markers)
            applySortOnly();
        }
    });
}

export function setupUI() {
    // Setup sort dropdown
    setupSortDropdown();

    // (no filter button - sort button is used to toggle the dropdown)

    // Property type toggle (Homes/Condos) - now handled in filters.js
    // Note: The event listeners for property type buttons are set up in filters.js

    // Infinite Scroll - attach to Results panel content
    const resultsPanel = document.querySelector('#results-panel .panel-content');
    if (resultsPanel) {
        resultsPanel.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = resultsPanel;
            
            // Load more when within 200px of bottom
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                if (STATE.currentRenderCount < STATE.allFilteredNeighborhoods.length) {
                    const nextBatch = STATE.allFilteredNeighborhoods.slice(STATE.currentRenderCount, STATE.currentRenderCount + CONFIG.data.batchSize);
                    if (nextBatch.length > 0) {
                        renderListItems(nextBatch);
                        STATE.currentRenderCount += CONFIG.data.batchSize;
                    }
                }
            }
        });
    }

    // Close drawer when clicking on empty space
    document.getElementById('sidebar').addEventListener('click', function(e) {
        // Check if the click target is interactive or inside an interactive element
        if (e.target.closest('button') || 
            e.target.closest('a') || 
            e.target.closest('label') || 
            e.target.closest('input') ||
            e.target.closest('.menu-item')) {
            return;
        }
        
        // Close the drawer by unchecking the toggle
        const drawerToggle = document.getElementById('drawer-toggle');
        if (drawerToggle && drawerToggle.checked) {
            drawerToggle.checked = false;
        }
    });
}

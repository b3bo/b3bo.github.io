/**
 * @file core/events.js
 * @description Centralized event delegation for performance and memory efficiency.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { eventBus, Events } from './eventBus.js';
import { updatePriceSlider } from '../filters/index.js';

// Handler registries
const clickHandlers = new Map();
const keydownHandlers = new Map();
const inputHandlers = new Map();

/**
 * Register a click handler for elements matching a selector.
 * @param {string} selector - CSS selector to match
 * @param {Function} handler - Handler function (event, element) => void
 * @returns {Function} Unregister function
 */
export function onClick(selector, handler) {
    if (!clickHandlers.has(selector)) {
        clickHandlers.set(selector, new Set());
    }
    clickHandlers.get(selector).add(handler);
    return () => clickHandlers.get(selector)?.delete(handler);
}

/**
 * Register a keydown handler for elements matching a selector.
 * @param {string} selector - CSS selector to match (use 'document' for global)
 * @param {Function} handler - Handler function (event, element) => void
 * @returns {Function} Unregister function
 */
export function onKeydown(selector, handler) {
    if (!keydownHandlers.has(selector)) {
        keydownHandlers.set(selector, new Set());
    }
    keydownHandlers.get(selector).add(handler);
    return () => keydownHandlers.get(selector)?.delete(handler);
}

/**
 * Register an input handler for elements matching a selector.
 * @param {string} selector - CSS selector to match
 * @param {Function} handler - Handler function (event, element) => void
 * @returns {Function} Unregister function
 */
export function onInput(selector, handler) {
    if (!inputHandlers.has(selector)) {
        inputHandlers.set(selector, new Set());
    }
    inputHandlers.get(selector).add(handler);
    return () => inputHandlers.get(selector)?.delete(handler);
}

/**
 * Find matching element for a selector, starting from target and going up.
 * @param {Element} target - Event target
 * @param {string} selector - CSS selector
 * @returns {Element|null} Matching element or null
 */
function findMatchingElement(target, selector) {
    if (selector === 'document') return document.documentElement;
    return target.closest(selector);
}

/**
 * Execute handlers for matching elements.
 * @param {Map} registry - Handler registry
 * @param {Event} event - DOM event
 */
function executeHandlers(registry, event) {
    for (const [selector, handlers] of registry) {
        const element = findMatchingElement(event.target, selector);
        if (element) {
            for (const handler of handlers) {
                try {
                    handler(event, element);
                    // If handler prevented default or stopped propagation, respect it
                    if (event.defaultPrevented) return;
                } catch (error) {
                    console.error(`Error in ${event.type} handler for "${selector}":`, error);
                }
            }
        }
    }
}

/**
 * Initialize event delegation on document.
 * Should be called once when app starts.
 */
export function initEventDelegation() {
    // Single delegated click handler
    document.addEventListener(
        'click',
        event => {
            executeHandlers(clickHandlers, event);
        },
        { capture: false }
    );

    // Single delegated keydown handler
    document.addEventListener(
        'keydown',
        event => {
            executeHandlers(keydownHandlers, event);
        },
        { capture: false }
    );

    // Single delegated input handler
    document.addEventListener(
        'input',
        event => {
            executeHandlers(inputHandlers, event);
        },
        { capture: false }
    );

    console.log('Event delegation initialized');
}

/**
 * Register common UI patterns for event delegation.
 * These replace scattered addEventListener calls.
 */
export function registerCommonHandlers() {
    // Menu item click - opens sliding panels
    onClick('.menu-item', (event, element) => {
        const panelId = element.dataset.panel;
        if (!panelId) return;

        const panel = document.getElementById(panelId);
        const mainMenu = document.getElementById('main-menu');

        if (panel) {
            // Store last focused item for Escape key return
            window.lastFocusedMenuItem = element;
            panel.classList.remove('translate-x-full');
            if (mainMenu) mainMenu.style.display = 'none';

            // Focus first focusable element in panel
            setTimeout(() => {
                const focusable = panel.querySelector('button, input, [tabindex="0"]');
                focusable?.focus();

                // Detect overflow and add fade class if panel content is scrollable
                const panelContent = panel.querySelector('.panel-content');
                if (panelContent) {
                    if (panelContent.scrollHeight > panelContent.clientHeight + 4) {
                        panelContent.classList.add('has-overflow');
                    } else {
                        panelContent.classList.remove('has-overflow');
                    }
                }
            }, 100);

            eventBus.emit(Events.PANEL_OPENED, { panelId });
        }
    });

    // Menu item keyboard navigation
    onKeydown('.menu-item', (event, element) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            element.click();
        }
    });

    // Back button in sliding panels
    onClick('.sliding-panel button[onclick*="translate-x-full"]', (event, element) => {
        const panel = element.closest('.sliding-panel');
        const mainMenu = document.getElementById('main-menu');

        if (panel) {
            panel.classList.add('translate-x-full');
            if (mainMenu) {
                mainMenu.style.removeProperty('display');
                mainMenu.scrollTop = 0;
                // Return focus to menu item
                if (window.lastFocusedMenuItem) {
                    setTimeout(() => window.lastFocusedMenuItem.focus(), 50);
                }
            }
            eventBus.emit(Events.PANEL_CLOSED, { panelId: panel.id });
        }
    });

    // Sort option selection
    onClick('.sort-option', (event, element) => {
        const radio = element.querySelector('input[type="radio"]');
        if (radio && !radio.checked) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // Property type filter buttons (homes/condos)
    onClick('#homes-btn, #condos-btn', (event, element) => {
        const isActive = element.classList.contains('filter-btn-active');
        element.classList.toggle('filter-btn-active', !isActive);
        element.classList.toggle('filter-btn-inactive', isActive);

        if (window.applyFilters) window.applyFilters();
        eventBus.emit(Events.FILTERS_CHANGED, { type: 'propertyType' });
    });

    // Amenity tag clicks (skip price presets - they have their own handler)
    onClick('.amenity-tag', (event, element) => {
        // Skip price presets - they have their own dedicated handler
        if (element.classList.contains('price-preset')) return;

        const isActive = element.classList.contains('filter-btn-active');
        element.classList.toggle('filter-btn-active', !isActive);
        element.classList.toggle('filter-btn-inactive', isActive);

        // Handle mutually exclusive pairs
        const oppositeId = element.dataset.opposite;
        if (oppositeId && !isActive) {
            const opposite = document.getElementById(oppositeId);
            if (opposite) {
                opposite.classList.remove('filter-btn-active');
                opposite.classList.add('filter-btn-inactive');
            }
        }

        if (window.applyFilters) window.applyFilters();
        eventBus.emit(Events.FILTERS_CHANGED, { type: 'amenity' });
    });

    // Area tag clicks
    onClick('.area-tag', (event, element) => {
        const isActive = element.classList.contains('filter-btn-active');
        element.classList.toggle('filter-btn-active', !isActive);
        element.classList.toggle('filter-btn-inactive', isActive);

        // Show/hide boundary
        const zipCode = element.dataset.zipcode;
        if (zipCode) {
            if (!isActive && window.showCustomBoundary) {
                window.showCustomBoundary(zipCode);
            } else if (isActive && window.hideCustomBoundary) {
                window.hideCustomBoundary(zipCode);
            }
        }

        if (window.applyFilters) window.applyFilters();
        eventBus.emit(Events.FILTERS_CHANGED, { type: 'area' });
    });

    // Search result clicks (delegated in container)
    onClick('#search-results .search-result', (event, element) => {
        if (window.handleSearchResultClick) {
            window.handleSearchResultClick(element);
        }
    });

    // Escape key - close dropdowns, panels, info windows
    onKeydown('document', event => {
        if (event.key === 'Escape') {
            if (window.handleEscapeKey) {
                window.handleEscapeKey();
            }
        }
    });

    // Arrow key navigation for info windows
    onKeydown('document', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            if (window.infoWindow?.getMap() && window.navigateNeighborhood) {
                event.preventDefault();
                window.navigateNeighborhood(event.key === 'ArrowLeft' ? -1 : 1);
            }
        }
    });

    // Slider input handling
    onInput('#price-min, #price-max, #beds-slider, #baths-slider', (event, element) => {
        if (window.applyFilters) {
            // Debounce filter application
            clearTimeout(window._filterDebounce);
            window._filterDebounce = setTimeout(() => window.applyFilters(), 50);
        }
    });

    // Price preset clicks - supports toggle and consecutive range extension
    onClick('.price-preset', (event, element) => {
        const priceMinSlider = document.getElementById('price-min');
        const priceMaxSlider = document.getElementById('price-max');
        const allPresets = Array.from(document.querySelectorAll('.price-preset'));

        const clickedMin = parseInt(element.dataset.min, 10);
        const clickedMax = parseInt(element.dataset.max, 10);
        const isActive = element.classList.contains('selected');

        if (isActive) {
            // Toggle OFF this preset
            element.classList.remove('selected');

            // Check if any presets still active
            const stillActive = allPresets.filter(btn => btn.classList.contains('selected'));

            if (stillActive.length === 0) {
                // No presets active - reset to default (both at 0 = no filter)
                if (priceMinSlider && priceMaxSlider) {
                    priceMinSlider.value = 0;
                    priceMaxSlider.value = 0;
                }
            } else {
                // Recalculate range from remaining active presets
                let newMin = 41, newMax = 0;
                stillActive.forEach(btn => {
                    newMin = Math.min(newMin, parseInt(btn.dataset.min, 10));
                    newMax = Math.max(newMax, parseInt(btn.dataset.max, 10));
                });
                if (priceMinSlider && priceMaxSlider) {
                    priceMinSlider.value = newMin;
                    priceMaxSlider.value = newMax;
                }
            }
        } else {
            // Activating a preset - check if consecutive with existing selection
            const currentActive = allPresets.filter(btn => btn.classList.contains('selected'));

            if (currentActive.length === 0) {
                // No current selection - just activate this one
                element.classList.add('selected');
                if (priceMinSlider && priceMaxSlider) {
                    priceMinSlider.value = clickedMin;
                    priceMaxSlider.value = clickedMax;
                }
            } else {
                // Check if clicked preset is adjacent to current selection
                let currentMin = 41, currentMax = 0;
                currentActive.forEach(btn => {
                    currentMin = Math.min(currentMin, parseInt(btn.dataset.min, 10));
                    currentMax = Math.max(currentMax, parseInt(btn.dataset.max, 10));
                });

                // Adjacent if clicked range touches current range
                const isAdjacent = (clickedMax === currentMin) || (clickedMin === currentMax);

                if (isAdjacent) {
                    // Extend selection - activate clicked preset
                    element.classList.add('selected');
                    const newMin = Math.min(currentMin, clickedMin);
                    const newMax = Math.max(currentMax, clickedMax);
                    if (priceMinSlider && priceMaxSlider) {
                        priceMinSlider.value = newMin;
                        priceMaxSlider.value = newMax;
                    }
                } else {
                    // Not adjacent - deselect all, select only clicked
                    allPresets.forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    element.classList.add('selected');
                    if (priceMinSlider && priceMaxSlider) {
                        priceMinSlider.value = clickedMin;
                        priceMaxSlider.value = clickedMax;
                    }
                }
            }
        }

        // Update the slider display and apply filters
        const minVal = parseInt(priceMinSlider?.value) || 0;
        const maxVal = parseInt(priceMaxSlider?.value) || 0;

        const PRICE_STEPS = window.PRICE_STEPS || [];
        const priceDisplay = document.getElementById('price-display');
        const priceFill = document.getElementById('price-fill');

        // Update filter state
        window.filterState.priceMin = minVal;
        window.filterState.priceMax = maxVal;

        // Update display
        if (priceDisplay) {
            if (minVal === 0 && maxVal === 0) {
                priceDisplay.textContent = '$250K - $35M+';
            } else {
                const formatPrice = (p) => p >= 1000000 ? '$' + (p / 1000000).toFixed(p % 1000000 === 0 ? 0 : 1) + 'M' : '$' + (p / 1000).toFixed(0) + 'K';
                const minPrice = PRICE_STEPS[minVal] || PRICE_STEPS[0] || 250000;
                const maxPrice = PRICE_STEPS[maxVal] || PRICE_STEPS[PRICE_STEPS.length - 1] || 35000000;
                priceDisplay.textContent = `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}${maxVal === 41 ? '+' : ''}`;
            }
        }

        // Update track fill
        if (priceFill) {
            const totalSteps = 41;
            const minPct = minVal / totalSteps;
            const maxPct = maxVal / totalSteps;
            priceFill.style.left = minVal === 0 ? '0' : `${minPct * 100}%`;
            priceFill.style.width = `${(maxVal === 0 ? 0 : maxPct - minPct) * 100}%`;
        }

        if (window.applyFilters) window.applyFilters();
        eventBus.emit(Events.FILTERS_CHANGED, { type: 'pricePreset' });
    });
}

/**
 * Get handler count for debugging.
 * @returns {Object} Handler counts by type
 */
export function getHandlerCounts() {
    return {
        click: Array.from(clickHandlers.values()).reduce((sum, set) => sum + set.size, 0),
        keydown: Array.from(keydownHandlers.values()).reduce((sum, set) => sum + set.size, 0),
        input: Array.from(inputHandlers.values()).reduce((sum, set) => sum + set.size, 0)
    };
}

// Expose for debugging
if (typeof window !== 'undefined') {
    window._eventDelegation = {
        onClick,
        onKeydown,
        onInput,
        getHandlerCounts
    };
}

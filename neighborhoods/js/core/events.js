/**
 * @file core/events.js
 * @description Centralized event delegation for performance and memory efficiency.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { eventBus, Events } from './eventBus.js';

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

    // Amenity tag clicks
    onClick('.amenity-tag', (event, element) => {
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

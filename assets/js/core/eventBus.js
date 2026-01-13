/**
 * @file core/eventBus.js
 * @description Pub/sub event bus for cross-module communication.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

/**
 * Creates an event bus for decoupled communication between modules.
 * @returns {Object} Event bus with on, off, emit, and once methods
 */
export function createEventBus() {
    const events = new Map();

    return {
        /**
         * Subscribe to an event
         * @param {string} event - Event name
         * @param {Function} callback - Handler function
         * @returns {Function} Unsubscribe function
         */
        on(event, callback) {
            if (!events.has(event)) {
                events.set(event, new Set());
            }
            events.get(event).add(callback);

            // Return unsubscribe function
            return () => this.off(event, callback);
        },

        /**
         * Unsubscribe from an event
         * @param {string} event - Event name
         * @param {Function} callback - Handler to remove
         */
        off(event, callback) {
            if (events.has(event)) {
                events.get(event).delete(callback);
            }
        },

        /**
         * Emit an event to all subscribers
         * @param {string} event - Event name
         * @param {*} data - Data to pass to handlers
         */
        emit(event, data) {
            if (events.has(event)) {
                events.get(event).forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error in event handler for "${event}":`, error);
                    }
                });
            }
        },

        /**
         * Subscribe to an event once (auto-unsubscribe after first call)
         * @param {string} event - Event name
         * @param {Function} callback - Handler function
         * @returns {Function} Unsubscribe function
         */
        once(event, callback) {
            const wrapper = data => {
                this.off(event, wrapper);
                callback(data);
            };
            return this.on(event, wrapper);
        },

        /**
         * Remove all listeners for an event (or all events if no event specified)
         * @param {string} [event] - Event name (optional)
         */
        clear(event) {
            if (event) {
                events.delete(event);
            } else {
                events.clear();
            }
        },

        /**
         * Get count of listeners for an event
         * @param {string} event - Event name
         * @returns {number} Listener count
         */
        listenerCount(event) {
            return events.has(event) ? events.get(event).size : 0;
        }
    };
}

// Default event bus instance
export const eventBus = createEventBus();

// Event name constants for type safety and discoverability
export const Events = {
    // Data events
    DATA_LOADED: 'data:loaded',
    DATA_FILTERED: 'data:filtered',

    // Map events
    MAP_READY: 'map:ready',
    MAP_IDLE: 'map:idle',
    MAP_THEME_CHANGED: 'map:themeChanged',

    // Marker events
    MARKER_CLICKED: 'marker:clicked',
    MARKER_HOVERED: 'marker:hovered',
    MARKERS_UPDATED: 'markers:updated',

    // Filter events
    FILTERS_CHANGED: 'filters:changed',
    FILTERS_CLEARED: 'filters:cleared',

    // UI events
    PANEL_OPENED: 'ui:panelOpened',
    PANEL_CLOSED: 'ui:panelClosed',
    SIDEBAR_TOGGLED: 'ui:sidebarToggled',
    DROPDOWN_OPENED: 'ui:dropdownOpened',
    DROPDOWN_CLOSED: 'ui:dropdownClosed',

    // Search events
    SEARCH_CHANGED: 'search:changed',
    SEARCH_PERFORMED: 'search:performed',
    SEARCH_RESULT_SELECTED: 'search:resultSelected',

    // Boundary events
    BOUNDARY_SHOWN: 'boundary:shown',
    BOUNDARY_HIDDEN: 'boundary:hidden',

    // Navigation events
    NEIGHBORHOOD_NAVIGATED: 'nav:neighborhoodNavigated',
    FLY_TO_STARTED: 'nav:flyToStarted',
    FLY_TO_COMPLETED: 'nav:flyToCompleted',

    // Animation events
    ANIMATION_STARTED: 'animation:started',
    ANIMATION_COMPLETED: 'animation:completed',
    ANIMATION_CANCELLED: 'animation:cancelled'
};

// Expose on window for debugging
if (typeof window !== 'undefined') {
    window.eventBus = eventBus;
    window.Events = Events;
}

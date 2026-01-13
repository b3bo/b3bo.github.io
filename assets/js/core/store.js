/**
 * @file core/store.js
 * @description Centralized state management with pub/sub pattern.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

/**
 * Creates a store with getState, setState, and subscribe methods.
 * @param {Object} initialState - The initial state object
 * @returns {Object} Store with getState, setState, subscribe, and getSlice methods
 */
export function createStore(initialState) {
    let state = { ...initialState };
    const listeners = new Set();
    const sliceListeners = new Map();

    return {
        /**
         * Get the current state
         * @returns {Object} Current state
         */
        getState() {
            return state;
        },

        /**
         * Update state with partial object (shallow merge)
         * @param {Object} partial - Partial state to merge
         */
        setState(partial) {
            const prevState = state;
            state = { ...state, ...partial };

            // Notify all listeners
            listeners.forEach(fn => fn(state, prevState));

            // Notify slice listeners for changed keys
            for (const key of Object.keys(partial)) {
                if (sliceListeners.has(key)) {
                    sliceListeners.get(key).forEach(fn => fn(state[key], prevState[key]));
                }
            }
        },

        /**
         * Subscribe to all state changes
         * @param {Function} fn - Callback (state, prevState) => void
         * @returns {Function} Unsubscribe function
         */
        subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },

        /**
         * Subscribe to changes on a specific state key
         * @param {string} key - State key to watch
         * @param {Function} fn - Callback (newValue, oldValue) => void
         * @returns {Function} Unsubscribe function
         */
        subscribeToSlice(key, fn) {
            if (!sliceListeners.has(key)) {
                sliceListeners.set(key, new Set());
            }
            sliceListeners.get(key).add(fn);
            return () => sliceListeners.get(key).delete(fn);
        },

        /**
         * Get a specific slice of state
         * @param {string} key - State key
         * @returns {*} Value at key
         */
        getSlice(key) {
            return state[key];
        }
    };
}

// Default application store instance
export const store = createStore({
    // Map
    map: null,
    markers: [],
    activeMarker: null,
    infoWindow: null,
    hoverInfoWindow: null,
    customBoundaries: new Set(),
    areaMarkers: new Map(),

    // Data
    neighborhoods: [],
    filteredNeighborhoods: [],
    areaPresets: null,

    // Filters
    filterState: {
        propertyType: null,
        areas: new Set(),
        amenities: new Set(),
        priceMin: 0,
        priceMax: 41,
        bedsMin: 1,
        bathsMin: 1
    },
    searchQuery: '',
    sortOrder: 'listings-desc',

    // UI State
    isSingleMode: false,
    currentNeighborhood: null,
    sidebarOpen: false,
    activePanel: null,

    // Animation State
    currentAnimationFrame: null,

    // Initialization flags
    appInitialized: false,
    markersInitialized: false,
    dataReady: false
});

// Expose store on window for Playwright tests and debugging
if (typeof window !== 'undefined') {
    window.store = store;

    // Sync to legacy window.STATE for backwards compatibility
    store.subscribe(state => {
        if (window.STATE) {
            Object.assign(window.STATE, {
                map: state.map,
                markers: state.markers,
                neighborhoods: state.neighborhoods,
                allFilteredNeighborhoods: state.filteredNeighborhoods,
                activeMarker: state.activeMarker,
                customBoundaries: state.customBoundaries,
                searchQuery: state.searchQuery,
                currentSort: state.sortOrder
            });
        }
    });
}

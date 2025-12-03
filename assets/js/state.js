/**
 * @file state.js
 * @description Centralized state management for the application.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
export const STATE = {
    map: null,
    markers: [],
    infoWindow: null,
    hoverInfoWindow: null,
    neighborhoods: [],
    allFilteredNeighborhoods: [],
    activeMarker: null,
    customBoundaries: new Set(),
    currentRenderCount: 0,
    currentSort: 'name-asc',
    filters: {
        bedsMin: 1,
        bathsMin: 1,
        priceMin: null,  // null = no filter (show all)
        priceMax: null  // null = no filter (show all)
    }
};
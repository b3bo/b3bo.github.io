/**
 * @file map/boundaries.js
 * @description Lazy loading and caching of GeoJSON zip code boundaries.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { CONFIG } from '../config.js';
import { eventBus, Events } from '../core/eventBus.js';

// Cache for loaded GeoJSON data
const boundaryCache = new Map();

// Track which boundaries are currently visible on map
const visibleBoundaries = new Set();

// Track pending loads to avoid duplicate fetches
const pendingLoads = new Map();

/**
 * Get the GeoJSON path for a zip code.
 * @param {string} zipCode - Zip code
 * @returns {string} Path to GeoJSON file
 */
function getBoundaryPath(zipCode) {
    const basePath = CONFIG.data.geojsonPath || './neighborhoods/jsons/';
    return `${basePath}${zipCode}.geojson`;
}

/**
 * Load boundary GeoJSON data (cached).
 * @param {string} zipCode - Zip code to load
 * @returns {Promise<Object|null>} GeoJSON data or null if failed
 */
export async function loadBoundary(zipCode) {
    // Return cached data if available
    if (boundaryCache.has(zipCode)) {
        return boundaryCache.get(zipCode);
    }

    // Return pending promise if already loading
    if (pendingLoads.has(zipCode)) {
        return pendingLoads.get(zipCode);
    }

    // Start loading
    const loadPromise = (async () => {
        try {
            const response = await fetch(getBoundaryPath(zipCode));
            if (!response.ok) {
                throw new Error(`Failed to load boundary for ${zipCode}`);
            }
            const data = await response.json();
            boundaryCache.set(zipCode, data);
            return data;
        } catch (error) {
            console.warn(`Boundary load failed for ${zipCode}:`, error.message);
            return null;
        } finally {
            pendingLoads.delete(zipCode);
        }
    })();

    pendingLoads.set(zipCode, loadPromise);
    return loadPromise;
}

/**
 * Get boundary style based on current theme.
 * @returns {Object} Google Maps Data style object
 */
function getBoundaryStyle() {
    const isDark = document.documentElement.classList.contains('dark');
    const primaryColor = isDark ? '#5ba3ab' : '#4c8f96';
    return {
        strokeColor: primaryColor,
        strokeWeight: 1.5,
        strokeOpacity: 0.35,
        fillColor: primaryColor,
        fillOpacity: 0.15,
        clickable: false
    };
}

/**
 * Show a boundary on the map.
 * Lazy loads if not cached.
 * @param {string} zipCode - Zip code to show
 * @returns {Promise<boolean>} True if successful
 */
export async function showBoundary(zipCode) {
    const map = window.map;
    if (!map) return false;

    // Already visible
    if (visibleBoundaries.has(zipCode)) return true;

    visibleBoundaries.add(zipCode);

    // Load GeoJSON (uses cache if available)
    const data = await loadBoundary(zipCode);
    if (!data) {
        visibleBoundaries.delete(zipCode);
        return false;
    }

    // Add to map using Google Maps Data layer
    map.data.addGeoJson(data, { idPropertyName: 'ZCTA5CE20' });

    // Apply style
    map.data.setStyle((feature) => {
        const featureZip = feature.getProperty('ZCTA5CE20') || feature.getProperty('ZCTA5CE10');
        if (visibleBoundaries.has(featureZip)) {
            return getBoundaryStyle();
        }
        return { visible: false };
    });

    eventBus.emit(Events.BOUNDARY_SHOWN, { zipCode });
    return true;
}

/**
 * Hide a boundary from the map.
 * @param {string} zipCode - Zip code to hide
 */
export function hideBoundary(zipCode) {
    const map = window.map;
    if (!map || !visibleBoundaries.has(zipCode)) return;

    visibleBoundaries.delete(zipCode);

    // Remove features for this zip code
    map.data.forEach((feature) => {
        const featureZip = feature.getProperty('ZCTA5CE20') || feature.getProperty('ZCTA5CE10');
        if (featureZip === zipCode) {
            map.data.remove(feature);
        }
    });

    eventBus.emit(Events.BOUNDARY_HIDDEN, { zipCode });
}

/**
 * Hide all visible boundaries.
 */
export function hideAllBoundaries() {
    const toHide = [...visibleBoundaries];
    toHide.forEach(hideBoundary);
}

/**
 * Get currently visible boundaries.
 * @returns {Set<string>} Set of visible zip codes
 */
export function getVisibleBoundaries() {
    return new Set(visibleBoundaries);
}

/**
 * Check if a boundary is visible.
 * @param {string} zipCode - Zip code to check
 * @returns {boolean} True if visible
 */
export function isBoundaryVisible(zipCode) {
    return visibleBoundaries.has(zipCode);
}

/**
 * Refresh boundary styles (call after theme change).
 */
export function refreshBoundaryStyles() {
    const map = window.map;
    if (!map) return;

    map.data.setStyle((feature) => {
        const featureZip = feature.getProperty('ZCTA5CE20') || feature.getProperty('ZCTA5CE10');
        if (visibleBoundaries.has(featureZip)) {
            return getBoundaryStyle();
        }
        return { visible: false };
    });
}

/**
 * Preload boundaries for specified zip codes (optional optimization).
 * Does not show them on map, just caches the data.
 * @param {string[]} zipCodes - Array of zip codes to preload
 */
export function preloadBoundaries(zipCodes) {
    zipCodes.forEach(loadBoundary);
}

/**
 * Clear the boundary cache.
 */
export function clearBoundaryCache() {
    boundaryCache.clear();
}

// Expose on window for legacy code during transition
if (typeof window !== 'undefined') {
    window.customBoundaries = visibleBoundaries;
    window.showCustomBoundary = showBoundary;
    window.hideCustomBoundary = hideBoundary;
    window.refreshBoundaryStyles = refreshBoundaryStyles;
    window.hideAllBoundaries = hideAllBoundaries;
}

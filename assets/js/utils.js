/**
 * @file utils.js
 * @description Utility functions for formatting, URL parsing, and helpers.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { CONFIG } from './config.js';
import { STATE } from './state.js';

// Simple HTML escape to prevent XSS
export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Helper to format price (e.g. $1.25M)
export function formatPrice(price) {
    if (!price) return '$0';
    if (price >= 1000000) {
        return '$' + (price / 1000000).toFixed(2) + 'M';
    } else if (price >= 1000) {
        return '$' + (price / 1000).toFixed(0) + 'K';
    }
    return '$' + price.toLocaleString();
}

// Helper to format price for slider (e.g. $1.2M or $500K)
export function formatSliderPrice(price) {
    if (price >= 1000000) {
        return '$' + (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1) + 'M';
    } else if (price >= 1000) {
        return '$' + (price / 1000).toFixed(0) + 'K';
    }
    return '$' + price;
}

// Get stats object for an area based on property type (homes, condos, or combined)
export function getAreaStats(area, propertyType) {
    const propType = (propertyType || '').toLowerCase();
    return propType === 'homes' ? (area.homeStats || area.stats || {})
         : propType === 'condos' ? (area.condoStats || area.stats || {})
         : (area.stats || {});
}

// Get neighborhoods list for an area based on property type
export function getAreaNeighborhoods(area, propertyType) {
    const propType = (propertyType || '').toLowerCase();
    return propType === 'homes' ? (area.homeNeighborhoods || area.neighborhoods || [])
         : propType === 'condos' ? (area.condoNeighborhoods || area.neighborhoods || [])
         : (area.neighborhoods || []);
}

// Zip code boundary management
export function normalizeZip(value) {
    if (!value) return null;
    const digitsMatch = String(value).match(/\d{5}/);
    return digitsMatch ? digitsMatch[0] : null;
}

// Helper to get CSS variable value
export function getThemeColor(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

// Parse URL parameters
export function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        neighborhood: params.get('neighborhood'), // Slug of specific neighborhood
        mode: params.get('mode') ? params.get('mode').trim() : null, // 'single' = hide drawer, single neighborhood view
        zoom: params.get('zoom') ? parseInt(params.get('zoom')) : null,
        lat: params.get('lat') ? parseFloat(params.get('lat')) : null,
        lng: params.get('lng') ? parseFloat(params.get('lng')) : null,
        autoOpen: params.get('autoOpen') === 'true',
        autopan: params.get('autopan') === 'true',
        offsetPx: params.get('offsetPx') !== null ? parseFloat(params.get('offsetPx')) : null,
        offsetPct: params.get('offsetPct') !== null ? parseFloat(params.get('offsetPct')) : null,
        marker: params.get('marker'), // Marker to auto-open
        propertyType: params.get('propertyType'), // Property type filter for marker
        controls: params.get('controls') // 'false' to hide map controls (for embeds)
    };
}

// Convert neighborhood name to slug
export function toSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Helper to parse range strings like "$500,000 - $3,695,000" or "3 - 6" or "3-4"
export function parseRange(rangeStr) {
    if (!rangeStr || rangeStr === 'N/A') return null;
    // Remove '$', ',', and whitespace
    const cleanStr = rangeStr.replace(/[$,\s]/g, '');
    const parts = cleanStr.split('-');
    if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        const max = parseFloat(parts[1]);
        // Validate both are valid numbers
        if (!isNaN(min) && !isNaN(max)) {
            return { min, max };
        }
    } else if (parts.length === 1) {
        // Handle single value like "3" -> {min: 3, max: 3}
        const val = parseFloat(parts[0]);
        if (!isNaN(val)) {
            return { min: val, max: val };
        }
    }
    return null;
}

// Debounce helper for performance
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Throttle helper - ensures function is called at most once per interval
export function throttle(func, limit) {
    let inThrottle = false;
    let lastArgs = null;

    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    func.apply(this, lastArgs);
                    lastArgs = null;
                }
            }, limit);
        } else {
            lastArgs = args;
        }
    };
}

/**
 * RequestAnimationFrame wrapper with automatic cleanup tracking.
 * @param {Function} callback - Animation callback (timestamp) => boolean (return false to stop)
 * @returns {Object} Controller with cancel() method and isRunning property
 */
export function createAnimation(callback) {
    let frameId = null;
    let cancelled = false;

    const animate = timestamp => {
        if (cancelled) return;
        const shouldContinue = callback(timestamp);
        if (shouldContinue !== false && !cancelled) {
            frameId = requestAnimationFrame(animate);
        } else {
            frameId = null;
        }
    };

    frameId = requestAnimationFrame(animate);

    return {
        cancel() {
            cancelled = true;
            if (frameId !== null) {
                cancelAnimationFrame(frameId);
                frameId = null;
            }
        },
        get isRunning() {
            return frameId !== null && !cancelled;
        }
    };
}

// Easing functions for animations
export const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: t => t * t * t,
    easeOutCubic: t => --t * t * t + 1,
    easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1)
};

export function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
}

// URL parameter management
export function updateUrlParams(newParams) {
    const params = new URLSearchParams(window.location.search);

    // Update or add new parameters
    for (const key in newParams) {
        if (newParams[key] && newParams[key].length > 0) {
            params.set(key, newParams[key].join(','));
        } else {
            params.delete(key);
        }
    }

    return `${window.location.pathname}?${params.toString()}`;
}

// Expose functions on window for legacy main.js
if (typeof window !== 'undefined') {
    window.parseRange = parseRange;
    window.getAreaStats = getAreaStats;
    window.getAreaNeighborhoods = getAreaNeighborhoods;
}

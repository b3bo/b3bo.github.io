/**
 * @file utils.js
 * @description Utility functions for formatting, URL parsing, and helpers.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { CONFIG } from './config.js';
import { STATE } from './state.js';

// Helper to format price (e.g. $1.25M)
export function formatPrice(price) {
    if (!price) return '$0';
    if (price >= 1000000) {
        return '$' + (price / 1000000).toFixed(2) + 'M';
    } else if (price >= 1000) {
        return '$' + (price / 1000).toFixed(0) + 'k';
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
        offsetPct: params.get('offsetPct') !== null ? parseFloat(params.get('offsetPct')) : null
    };
}

// Convert neighborhood name to slug
export function toSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Helper to parse range strings like "$500,000 - $3,695,000" or "3 - 6"
export function parseRange(rangeStr) {
    if (!rangeStr) return null;
    // Remove '$', ',', and whitespace
    const cleanStr = rangeStr.replace(/[$,\s]/g, '');
    const parts = cleanStr.split('-');
    if (parts.length === 2) {
        return {
            min: parseInt(parts[0]),
            max: parseInt(parts[1])
        };
    }
    return null;
}

// Debounce helper for performance
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

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

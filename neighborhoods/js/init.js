// ==========================================
// PRODUCTION ES MODULE IMPORTS
// ==========================================
import { CONFIG } from './config.js';
import { STATE } from './state.js';
import { loadNeighborhoods } from './data.js';
import { formatPrice } from './utils.js';


// Expose CONFIG globally so other scripts can use it
window.CONFIG = CONFIG;

// Expose PRICE_STEPS globally for filter scripts
window.PRICE_STEPS = CONFIG.ui.priceSteps;

// Configure paths for local dev (absolute paths for Vite)
CONFIG.data.geojsonPath = './neighborhoods/jsons/';
CONFIG.data.neighborhoodFiles = [
    './neighborhoods/jsons/7ea1bf14d884d192.json.b64',
    './neighborhoods/jsons/b762bb338ba328e5.json.b64',
    './neighborhoods/jsons/d2ea7fdfc87ff3e7.json.b64',
    './neighborhoods/jsons/d897c3d107c48ccc.json.b64',
    './neighborhoods/jsons/dcb3d8a92cc6eb54.json.b64',
    './neighborhoods/jsons/e0e3b36d8e692892.json.b64',
    './neighborhoods/jsons/f7e6349b564cdbb2.json.b64'
];

// Load production data
const neighborhoods = await loadNeighborhoods();
console.log('Loaded', neighborhoods.length, 'neighborhoods from production data');

// Expose to global scope for other scripts
window.neighborhoods = neighborhoods;
window.filteredNeighborhoods = [...neighborhoods];

// Sync STATE for ES module consumers (search, filters)
STATE.neighborhoods = neighborhoods;
STATE.allFilteredNeighborhoods = [...neighborhoods];
window.markers = window.markers || [];
window.map = window.map || null;
window.infoWindow = window.infoWindow || null;
window.sortOrder = window.sortOrder || 'listings-desc';
window.formatPrice = formatPrice;

function toSlug(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
window.toSlug = toSlug;

// Signal data ready and trigger coordination
window.dataReady = true;
window.dispatchEvent(new Event('dataLoaded'));

// If map already initialized, trigger marker creation
if (window.tryInitializeMarkers) {
    window.tryInitializeMarkers();
}

// Load app module (sets up UI, filters, search)
await import('./app.js');

// Setup UI directly (app.js initMap waits for googleMapsReady which HTML doesn't set)
const { setupUI } = await import('./ui.js');
const { setupFilters, applyFilters } = await import('./filters.js');

// Wait for DOM to be ready, then setup UI
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupUI();
        setupFilters();
        applyFilters();
    });
} else {
    setupUI();
    setupFilters();
    applyFilters();
}

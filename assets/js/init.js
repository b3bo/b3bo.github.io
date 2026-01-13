/**
 * @file init.js
 * @description Production ES module initialization for Neighborhood Finder™.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

// ==========================================
// PRODUCTION ES MODULE IMPORTS
// ==========================================
import { CONFIG } from './config.js';
import { STATE } from './state.js';
import { loadNeighborhoods } from './data.js';
import { formatPrice } from './utils.js';

// Core infrastructure
import { store } from './core/store.js';
import { eventBus, Events } from './core/eventBus.js';
import { initEventDelegation, registerCommonHandlers } from './core/events.js';

// Feature modules (exposes window.* during transition)
import { animateCount } from './animations/index.js';
import './map/centering.js';
import './map/boundaries.js';
import './ui/results.js';
import './ui/infoWindow.js';
import { initWizard } from './ui/wizard.js';
import './filters/index.js';
import './search/index.js';
import './keyboard/index.js';

// Initialize event delegation layer (single listeners for performance)
initEventDelegation();
registerCommonHandlers();

// Expose CONFIG globally so other scripts can use it
window.CONFIG = CONFIG;

// Expose PRICE_STEPS globally for filter scripts
window.PRICE_STEPS = CONFIG.ui.priceSteps;

// Configure paths for local dev (Vite middleware maps ./assets/ to assets/)
CONFIG.data.geojsonPath = './assets/mls/ecar/boundaries/';
CONFIG.data.areaPresetsFile = './assets/mls/ecar/presets/areas.json.b64';
CONFIG.data.manifestFile = './assets/mls/ecar/manifest.json';
CONFIG.data.neighborhoodFiles = [
    './assets/mls/ecar/neighborhoods/7ea1bf14d884d192.json.b64',
    './assets/mls/ecar/neighborhoods/b762bb338ba328e5.json.b64',
    './assets/mls/ecar/neighborhoods/d2ea7fdfc87ff3e7.json.b64',
    './assets/mls/ecar/neighborhoods/d897c3d107c48ccc.json.b64',
    './assets/mls/ecar/neighborhoods/dcb3d8a92cc6eb54.json.b64',
    './assets/mls/ecar/neighborhoods/e0e3b36d8e692892.json.b64',
    './assets/mls/ecar/neighborhoods/f7e6349b564cdbb2.json.b64'
];

// Load production data
const neighborhoods = await loadNeighborhoods();
console.log('Loaded', neighborhoods.length, 'neighborhoods from production data');

// Load area presets for single mode
async function loadAreaPresets() {
    try {
        const presetsFile = CONFIG.data.areaPresetsFile || './assets/mls/ecar/presets/areas.json.b64';
        const response = await fetch(presetsFile);
        if (!response.ok) throw new Error('Failed to load area presets');
        const text = await response.text();
        const jsonStr = new TextDecoder().decode(Uint8Array.from(atob(text), c => c.charCodeAt(0)));
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Error loading area presets:', e);
        return null;
    }
}
const areaPresets = await loadAreaPresets();
if (areaPresets) {
    console.log('Loaded', areaPresets.presets?.length || 0, 'area presets');
}

// Expose to global scope for other scripts
window.neighborhoods = neighborhoods;
window.filteredNeighborhoods = [...neighborhoods];
window.areaPresets = areaPresets;

// Sync STATE for ES module consumers (search, filters)
STATE.neighborhoods = neighborhoods;
STATE.allFilteredNeighborhoods = [...neighborhoods];
window.markers = window.markers || [];
window.map = window.map || null;
window.infoWindow = window.infoWindow || null;
window.sortOrder = window.sortOrder || 'listings-desc';
window.formatPrice = formatPrice;

function toSlug(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
window.toSlug = toSlug;

// Signal data ready and trigger coordination
window.dataReady = true;
window.dispatchEvent(new Event('dataLoaded'));

// If map already initialized, trigger marker creation
if (window.tryInitializeMarkers) {
    window.tryInitializeMarkers();
}

// Initialize onboarding wizard
initWizard();

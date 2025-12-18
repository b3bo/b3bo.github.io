/**
 * @file config.js
 * @description Configuration settings for the Community Finder Map.
 *
 * This file contains all configurable settings for the application including:
 * - Map initialization and behavior
 * - Data loading and pagination
 * - UI options (filters, sorting, amenities)
 * - Animation speeds and transitions
 * - Color palette references
 *
 * To customize the application, modify values in this file rather than
 * hard-coding them throughout the codebase.
 *
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
export const CONFIG = {
    // App version - MAJOR.MINOR.PATCH (auto-incremented on deploy)
    version: '1.1.1',

    // ===================================================================
    // MAP SETTINGS
    // ===================================================================
    map: {
        // Default map center coordinates (Emerald Coast)
        defaultCenter: { lat: 30.294396274692907, lng: -86.01317525044458 },

        // Default zoom level for map view
        defaultZoom: 14,

        // Zoom level when displaying single neighborhood
        singleNeighborhoodZoom: 12,

        // Duration (ms) for map camera fly-to animation
        flyToDuration: 2000,

        // Auto-open info window after flying to location
        autoOpenOnFly: true,

        // Flight zoom arc - minZoom based on distance (meters)
        // Zooms out to minZoom at midpoint, then back to targetZoom
        flightZoomArc: {
            micro: { maxDistance: 2000, minZoom: 13.5  },    // < 2km: gentle hop
            short: { maxDistance: 5000, minZoom: 13 },    // 2-5km: subtle arc
            medium: { maxDistance: 20000, minZoom: 12 },  // 5-20km: moderate arc
            long: { minZoom: 10 }                          // > 20km: big arc
        },

        // Flight duration based on distance (ms)
        flightDuration: {
            micro: 800,    // < 1km
            short: 1200,   // 1-2km
            medium: 2000   // > 2km
        },

        // Google Maps Cloud mapId for styling
        mapId: '92b2f4ea8b2fce54a50ed2e9'
    },

    // ===================================================================
    // DATA SETTINGS
    // ===================================================================
    data: {
        // Number of neighborhood cards to render per batch (infinite scroll)
        batchSize: 20,

        // Custom zip codes for area filtering
        customZipCodes: ['32461', '32541', '32459', '32550', '32413'],

        // Paths to neighborhood JSON data files (base64 encoded)
        // NOTE: These paths are for LOCAL DEV. Deploy script transforms to ./neighborhoods/jsons/
        neighborhoodFiles: [
            './neighborhoods/jsons/7ea1bf14d884d192.json.b64',
            './neighborhoods/jsons/b762bb338ba328e5.json.b64',
            './neighborhoods/jsons/d2ea7fdfc87ff3e7.json.b64',
            './neighborhoods/jsons/d897c3d107c48ccc.json.b64',
            './neighborhoods/jsons/dcb3d8a92cc6eb54.json.b64',
            './neighborhoods/jsons/e0e3b36d8e692892.json.b64',
            './neighborhoods/jsons/f7e6349b564cdbb2.json.b64'
        ],

        // Path to geojson boundary files (zip code boundaries)
        geojsonPath: './neighborhoods/jsons/'
    },

    // ===================================================================
    // UI LISTS & RANGES
    // ===================================================================
    ui: {
        // Available amenities for filtering (must match canonical names from amenity_mappings.json)
        amenities: [
            'Beach Access', 'Clubhouse', 'Community Pool', 'Dock', 'Elevator',
            'Fitness', 'Gated', 'Golf', 'No Short-Term', 'Pet-Friendly',
            'Pickleball', 'Playgrounds', 'Short-Term', 'Tennis',
            'Waterfront', 'Waterview'
        ],

        // Price range steps for slider (in dollars)
        priceSteps: [
            250000, 300000, 350000, 400000, 450000, 500000,
            550000, 600000, 650000, 700000, 750000, 800000, 850000, 900000, 950000, 1000000,
            1250000, 1500000, 1750000, 2000000, 2250000, 2500000, 2750000, 3000000, 3250000, 3500000, 3750000, 4000000, 4250000, 4500000, 4750000, 5000000,
            6000000, 7000000, 8000000, 9000000, 10000000,
            15000000, 20000000, 25000000, 30000000, 35000000
        ],

        // Sort options for results list
        sortOptions: [
            { id: 'name-asc', label: 'Name (A-Z)', field: 'name', order: 'asc' },
            { id: 'name-desc', label: 'Name (Z-A)', field: 'name', order: 'desc' },
            { id: 'price-asc', label: 'Price: Low to High', field: 'price', order: 'asc' },
            { id: 'price-desc', label: 'Price: High to Low', field: 'price', order: 'desc' },
            { id: 'listings-desc', label: 'Most Listings', field: 'listingCount', order: 'desc' },
            { id: 'dom-asc', label: 'DOM: Low to High', field: 'avgDom', order: 'asc' }
        ]
        ,
        // Per-breakpoint offsets (pixels) for the portalled sort menu.
        // We anchor the menu's TOP-RIGHT to the button's BOTTOM-RIGHT.
        // Positive x values move the menu to the RIGHT; negative x move to the LEFT.
        // Positive y values move the menu DOWN; negative y move UP.
        // Structure: { x: { desktop, tablet, mobile }, y: { desktop, tablet, mobile } }
        sortMenuOffset: {
            x: {
                // Horizontal shift from button's right edge. Positive -> right, negative -> left.
                // Set to -28 so the menu moves left 28px across breakpoints.
                desktop: 0,
                tablet: 0,
                mobile: 0
            },
            y: {
                desktop: 8, // vertical gap between button bottom and menu top (px)
                tablet: 8,
                mobile: 6
            }
        }
    },

    // ===================================================================
    // THEME SETTINGS (Single/Iframe Mode)
    // ===================================================================
    theme: {
        // Theme for single mode (iframe embeds): 'light', 'dark', or 'system'
        // Full app always allows user toggle; this only affects ?mode=single
        singleModeTheme: 'light'
    },

    // ===================================================================
    // ANIMATION & TRANSITIONS
    // ===================================================================
    animations: {
        // Sliding panel transition speed (ms)
        // Used for Criteria, Areas, Amenities, Results panels
        panelSlideDuration: 500,

        // Panel transition timing function
        panelSlideEasing: 'ease-out'
    },
    // ===================================================================
    // COLOR PALETTE
    // ===================================================================
    // Note: Primary brand colors are defined in assets/css/neighborhoods/styles.css
    // These are Tailwind utility class references for easy application
    colors: {
        text: {
            primary: 'text-neutral-700',   // High emphasis (Headers, Values)
            secondary: 'text-neutral-500', // Medium emphasis (Labels, Subtitles)
            tertiary: 'text-neutral-400',  // Low emphasis (Inactive, Placeholders)
            error: 'text-red-600'
        },
        background: {
            sidebar: 'rgb(255, 255, 255)',  // Main sidebar background
            disclaimer: '#8FC7CC'           // Disclaimer bar (water/teal)
        }
    }
};

// Expose CONFIG on window for inline scripts (index.html) to read when the module bundle
// hasn't executed yet in some load scenarios. This makes CONFIG available globally.
if (typeof window !== 'undefined') {
    // Avoid overwriting an existing global object unless necessary
    try {
        window.CONFIG = window.CONFIG || CONFIG;
    } catch (e) {
        // ignore if assignment fails in restricted environments
    }
}

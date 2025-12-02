/**
 * @file config.js
 * @description Configuration settings for the Community Finder Map.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
export const CONFIG = {
    // Map Settings
    map: {
        defaultCenter: { lat: 30.294396274692907, lng: -86.01317525044458 },
        defaultZoom: 12,
        singleNeighborhoodZoom: 13,
        flyToDuration: 2000,
        autoOpenOnFly: true,
        mapId: '92b2f4ea8b2fce54a50ed2e9'
    },
    // Data Settings
    data: {
        batchSize: 20,
        customZipCodes: ['32461', '32541', '32459', '32550', '32413'],
        neighborhoodFiles: [
            './neighborhoods/17-30A-West.json.b64',
            './neighborhoods/18-30A-East.json.b64'
        ]
    },
    // UI Lists & Ranges
    ui: {
        amenities: [
            'Pool', 'Beach Access', 'Fitness', 'Pickleball', 'Tennis', 
            'Golf', 'Playgrounds', 'Walking Trails', 'Dog Park', 
            'Gated', 'Waterfront', 'Short-Term', 'No Short-Term'
        ],
        priceSteps: [
            250000, 300000, 350000, 400000, 450000, 500000, 
            550000, 600000, 650000, 700000, 750000, 800000, 850000, 900000, 950000, 1000000,
            1250000, 1500000, 1750000, 2000000, 2250000, 2500000, 2750000, 3000000, 3250000, 3500000, 3750000, 4000000, 4250000, 4500000, 4750000, 5000000,
            6000000, 7000000, 8000000, 9000000, 10000000,
            15000000, 20000000, 25000000, 30000000, 35000000
        ]
    },
    // Color Palette (Centralized for easy updates)
    colors: {
        text: {
            primary: 'text-neutral-700',   // High emphasis (Headers, Values)
            secondary: 'text-neutral-500', // Medium emphasis (Labels, Subtitles)
            tertiary: 'text-neutral-400',  // Low emphasis (Inactive, Placeholders)
            error: 'text-red-600'
        },
        background: {
            sidebar: 'rgb(255, 255, 255)',    // Sidebar/filter panel background
            card: 'rgb(255, 255, 255)',       // Info window card background (matching sidebar)
            cardInner: 'bg-white',            // Inner stat boxes
            primary: 'bg-neutral-100'         // General background
        },
        brand: {
            primary: '#4c8f96',               // Main brand color (buttons, links)
            primaryHover: '#3a6d73',          // Hover state
            primaryLight: 'rgba(76, 143, 150, 0.3)'  // Light variant
        },
        border: {
            default: 'border-neutral-300',    // Default borders
            light: 'border-neutral-200'       // Light borders
        }
    }
};
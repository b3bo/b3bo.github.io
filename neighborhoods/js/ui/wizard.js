/**
 * @file ui/wizard.js
 * @description Multi-step onboarding wizard for Neighborhood Finder.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { formatSliderPrice, formatPrice, parseRange } from '../utils.js';

// ==========================================
// WIZARD STATE
// ==========================================

const TOTAL_STEPS = 6;

// Step metadata for vertical indicator
const STEP_META = [
    { label: 'Welcome', sublabel: 'Get started' },
    { label: 'Property Type', sublabel: 'Homes or condos' },
    { label: 'Budget & Size', sublabel: 'Price and size' },
    { label: 'Location', sublabel: 'Where to look' },
    { label: 'Amenities', sublabel: 'Must-haves' },
    { label: 'Summary', sublabel: 'Your matches' }
];

const wizardState = {
    isOpen: false,
    currentStep: 0,
    selections: {
        homes: false, // independent toggle (like sidebar)
        condos: false, // independent toggle (like sidebar)
        priceMin: 0, // both thumbs stacked left = Any price
        priceMax: 0, // both thumbs stacked left = Any price
        bedsMin: 1,
        bathsMin: 1,
        areas: new Set(),
        amenities: new Set()
    }
};

// Focus trap elements
let previousActiveElement = null;

// ==========================================
// STEP CONTENT GENERATORS
// ==========================================

function generateWelcomeStep() {
    return `
<div class="text-center py-6">
            <div class="w-16 h-16 bg-neutral-800 dark:bg-neutral-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span style="font-family: 'Cinzel', serif; font-size: 1.75rem; font-weight: 600; color: white; letter-spacing: 0.05em;">TS</span>
            </div>
            <h2 id="wizard-title" class="text-xl font-heading font-semibold text-neutral-800 dark:text-dark-text-primary mb-3">
                Welcome to Neighborhood Finder™
            </h2>
            <p class="text-sm text-neutral-600 dark:text-dark-text-secondary leading-relaxed max-w-sm mx-auto">
                Discover your perfect community along 30A and Florida's Emerald Coast.
                We'll help you explore <strong>700+ neighborhoods</strong> across Destin, Santa Rosa Beach,
                Miramar Beach, Inlet Beach, and Panama City Beach.
            </p>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-4">
                Let's find what you're looking for in just a few quick steps.
            </p>
        </div>
    `;
}

function generatePropertyTypeStep() {
    const homesSelected = wizardState.selections.homes ? 'selected' : '';
    const condosSelected = wizardState.selections.condos ? 'selected' : '';

    return `
        <div class="py-4">
            <h2 class="text-lg font-heading font-semibold text-neutral-800 dark:text-dark-text-primary mb-2 text-center">
                Are you looking for a home or condo?
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-center">
                You can select both if you're open to either.
            </p>
            <div class="flex gap-4 justify-center py-4">
                <button class="wizard-prop-type flex-1 max-w-[140px] flex flex-col items-center gap-3 p-6 rounded-xl border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg-elevated hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-all ${homesSelected}" data-type="Homes">
                    <svg class="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    <span class="text-sm font-medium text-neutral-700 dark:text-dark-text-primary">Homes</span>
                </button>
                <button class="wizard-prop-type flex-1 max-w-[140px] flex flex-col items-center gap-3 p-6 rounded-xl border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg-elevated hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-all ${condosSelected}" data-type="Condos">
                    <svg class="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <span class="text-sm font-medium text-neutral-700 dark:text-dark-text-primary">Condos</span>
                </button>
            </div>
            <p class="text-xs text-neutral-400 dark:text-neutral-500 text-center mt-2">
                Or skip to see everything
            </p>
        </div>
    `;
}

function generateBudgetStep() {
    const PRICE_STEPS = window.PRICE_STEPS || [];
    const minVal = wizardState.selections.priceMin;
    const maxVal = wizardState.selections.priceMax;

    // When both at 0 (stacked left), show full range
    const minPrice = PRICE_STEPS[minVal] || PRICE_STEPS[0] || 250000;
    const maxPrice =
        maxVal === 0
            ? PRICE_STEPS[PRICE_STEPS.length - 1] || 35000000
            : PRICE_STEPS[maxVal] || PRICE_STEPS[PRICE_STEPS.length - 1] || 35000000;
    const priceDisplay = `${formatSliderPrice(minPrice)} - ${formatSliderPrice(maxPrice)}${maxVal === 0 || maxVal >= 41 ? '+' : ''}`;

    // Fill: when both at 0, no fill shown (thumbs stacked left)
    const priceFillLeft = 0;
    const priceFillWidth = maxVal === 0 ? 0 : minVal === 0 ? (maxVal / 41) * 100 : ((maxVal - minVal) / 41) * 100;
    const bedsDisplay =
        wizardState.selections.bedsMin === 1
            ? 'Any'
            : wizardState.selections.bedsMin >= 6
              ? '6+'
              : `${wizardState.selections.bedsMin}+`;
    const bathsDisplay =
        wizardState.selections.bathsMin === 1
            ? 'Any'
            : wizardState.selections.bathsMin >= 6
              ? '6+'
              : `${wizardState.selections.bathsMin}+`;
    const bedsFill = ((wizardState.selections.bedsMin - 1) / 5) * 100;
    const bathsFill = ((wizardState.selections.bathsMin - 1) / 5) * 100;

    return `
        <div class="py-4">
            <h2 class="text-lg font-heading font-semibold text-neutral-800 dark:text-dark-text-primary mb-2 text-center">
                What's your budget and size needs?
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-center">
                Don't worry, you can always adjust these later.
            </p>
            <div class="space-y-8 py-4">
                <!-- Price -->
                <div>
                    <div class="flex justify-between items-baseline mb-2">
                        <span class="text-sm font-medium text-neutral-600 dark:text-dark-text-secondary">Price</span>
                        <span class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary" id="wizard-price-display">${priceDisplay}</span>
                    </div>
                    <div class="range-slider">
                        <div class="range-track-bg"></div>
                        <div class="range-track-fill" id="wizard-price-fill" style="left: ${priceFillLeft}%; width: ${priceFillWidth}%;"></div>
                        <input type="range" min="0" max="41" value="${wizardState.selections.priceMin}" id="wizard-price-min">
                        <input type="range" min="0" max="41" value="${wizardState.selections.priceMax}" id="wizard-price-max">
                    </div>
                </div>

                <!-- Beds -->
                <div>
                    <div class="flex justify-between items-baseline mb-2">
                        <span class="text-sm font-medium text-neutral-600 dark:text-dark-text-secondary">Bedrooms</span>
                        <span class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary" id="wizard-beds-display">${bedsDisplay}</span>
                    </div>
                    <div class="range-slider">
                        <div class="range-track-bg"></div>
                        <div class="range-track-fill" id="wizard-beds-fill" style="width: ${bedsFill}%;"></div>
                        <input type="range" min="1" max="6" value="${wizardState.selections.bedsMin}" step="1" id="wizard-beds-min">
                    </div>
                </div>

                <!-- Baths -->
                <div>
                    <div class="flex justify-between items-baseline mb-2">
                        <span class="text-sm font-medium text-neutral-600 dark:text-dark-text-secondary">Bathrooms</span>
                        <span class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary" id="wizard-baths-display">${bathsDisplay}</span>
                    </div>
                    <div class="range-slider">
                        <div class="range-track-bg"></div>
                        <div class="range-track-fill" id="wizard-baths-fill" style="width: ${bathsFill}%;"></div>
                        <input type="range" min="1" max="6" value="${wizardState.selections.bathsMin}" step="1" id="wizard-baths-min">
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateAreasStep() {
    const areas = [
        { name: 'Destin', zipcode: '32541' },
        { name: 'Santa Rosa Beach', zipcode: '32459' },
        { name: 'Miramar Beach', zipcode: '32550' },
        { name: 'Inlet Beach', zipcode: '32461' },
        { name: 'Panama City Beach', zipcode: '32413' }
    ];
    const subareas = [
        { name: 'West 30A', subarea: '17 - 30A West' },
        { name: 'East 30A', subarea: '18 - 30A East' },
        { name: 'Sandestin', subarea: '1503 - Sandestin Resort' }
    ];

    const areaButtons = areas
        .map(a => {
            const selected = wizardState.selections.areas.has(a.zipcode) ? 'selected' : '';
            return `<button class="wizard-area-tag px-3 py-2 rounded-lg text-sm font-medium border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg-elevated text-neutral-700 dark:text-dark-text-primary hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors ${selected}" data-zipcode="${a.zipcode}">${a.name}</button>`;
        })
        .join('\n                ');

    const subareaButtons = subareas
        .map(s => {
            const selected = wizardState.selections.areas.has(s.subarea) ? 'selected' : '';
            return `<button class="wizard-area-tag px-3 py-2 rounded-lg text-sm font-medium border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg-elevated text-neutral-700 dark:text-dark-text-primary hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors ${selected}" data-subarea="${s.subarea}">${s.name}</button>`;
        })
        .join('\n                ');

    return `
        <div class="py-4">
            <h2 class="text-lg font-heading font-semibold text-neutral-800 dark:text-dark-text-primary mb-2 text-center">
                Where would you like to live?
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-center">
                Pick as many areas as you'd like to explore.
            </p>
            <div class="py-2">
                <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 block">Cities</span>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${areaButtons}
                </div>
                <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 block mt-4">Sub-Areas</span>
                <div class="flex flex-wrap gap-2">
                    ${subareaButtons}
                </div>
            </div>
            <p class="text-xs text-neutral-400 dark:text-neutral-500 text-center mt-4">
                Or skip to search the entire coast
            </p>
        </div>
    `;
}

function generateAmenitiesStep() {
    const amenities = [
        'Beach Access',
        'Community Pool',
        'Gated',
        'Golf',
        'Tennis',
        'Pickleball',
        'Fitness',
        'Waterfront',
        'Pet-Friendly'
    ];
    const rentalPolicies = ['Short-Term', 'No Short-Term'];

    const amenityButtons = amenities
        .map(a => {
            const selected = wizardState.selections.amenities.has(a) ? 'selected' : '';
            return `<button class="wizard-amenity-tag btn btn--pill hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors ${selected}" data-amenity="${a}">${a}</button>`;
        })
            .join('\n                ');

    const rentalButtons = rentalPolicies
        .map(r => {
            const selected = wizardState.selections.amenities.has(r) ? 'selected' : '';
            return `<button class="wizard-amenity-tag btn btn--pill hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors ${selected}" data-amenity="${r}">${r === 'Short-Term' ? 'Short-Term OK' : 'No Short-Term'}</button>`;
        })
            .join('\n                ');

    return `
        <div class="py-4">
            <h2 class="text-lg font-heading font-semibold text-neutral-800 dark:text-dark-text-primary mb-2 text-center">
                Any must-have features?
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-center">
                Select the amenities that matter most to you.
            </p>
            <div class="py-2">
                <div class="flex flex-wrap gap-2 justify-center">
                    ${amenityButtons}
                </div>
                <hr class="border-neutral-200 dark:border-dark-border my-4">
                <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 block text-center">Rental Policy</span>
                <div class="flex gap-2 justify-center">
                    ${rentalButtons}
                </div>
            </div>
        </div>
    `;
}

function generateSummaryStep() {
    return `
        <div class="py-2 sm:py-4">
            <h2 class="text-base sm:text-lg font-heading font-semibold text-neutral-800 dark:text-dark-text-primary mb-1 sm:mb-2 text-center">
                Here's what we found.
            </h2>
            <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-4 sm:mb-6 text-center">
                These neighborhoods match your criteria.
            </p>

            <!-- Hero Number -->
            <div class="text-center mb-4 sm:mb-6">
                <div class="text-3xl sm:text-5xl font-bold text-brand-600 dark:text-brand-dark" id="wizard-stat-communities">--</div>
                <div class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">Matching Neighborhoods</div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 rounded-xl p-3 sm:p-4 text-center">
                    <div class="text-base sm:text-xl font-semibold text-neutral-800 dark:text-dark-text-primary" id="wizard-stat-listings">--</div>
                    <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Active Listings</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 rounded-xl p-3 sm:p-4 text-center">
                    <div class="text-base sm:text-xl font-semibold text-neutral-800 dark:text-dark-text-primary" id="wizard-stat-median">--</div>
                    <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Median Price</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 rounded-xl p-3 sm:p-4 text-center">
                    <div class="text-base sm:text-xl font-semibold text-neutral-800 dark:text-dark-text-primary" id="wizard-stat-price-range">--</div>
                    <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Price Range</div>
                </div>
                <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 rounded-xl p-3 sm:p-4 text-center">
                    <div class="text-base sm:text-xl font-semibold text-neutral-800 dark:text-dark-text-primary" id="wizard-stat-dom">--</div>
                    <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Avg Days on Market</div>
                </div>
            </div>

            <!-- Top Neighborhoods Preview -->
            <div id="wizard-top-communities">
                <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 block">Top Neighborhoods by Listings</span>
                <div id="wizard-top-list" class="space-y-2">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>
    `;
}

const stepGenerators = [
    generateWelcomeStep,
    generatePropertyTypeStep,
    generateBudgetStep,
    generateAreasStep,
    generateAmenitiesStep,
    generateSummaryStep
];

// ==========================================
// CORE WIZARD FUNCTIONS
// ==========================================

/**
 * Open the wizard modal
 */
export function openWizard() {
    const modal = document.getElementById('wizard-modal');
    if (!modal) return;

    // Store current focus for restoration
    previousActiveElement = document.activeElement;

    // Check if there are saved selections (non-default values)
    const sel = wizardState.selections;
    const hasSavedValues =
        sel.homes ||
        sel.condos ||
        sel.priceMin !== 0 ||
        sel.priceMax !== 0 ||
        sel.bedsMin !== 1 ||
        sel.bathsMin !== 1 ||
        sel.areas.size > 0 ||
        sel.amenities.size > 0;

    // Start at step 1 (Property Type) if there are saved values, otherwise step 0 (Welcome)
    wizardState.currentStep = hasSavedValues ? 1 : 0;

    // Show modal
    modal.classList.remove('hidden');
    wizardState.isOpen = true;

    // Render first step
    renderCurrentStep();
    updateStepIndicators();
    updateNavigationButtons();

    // Focus close button
    setTimeout(() => {
        const closeBtn = document.getElementById('wizard-close');
        if (closeBtn) closeBtn.focus();
    }, 100);
}

/**
 * Close the wizard modal
 */
export function closeWizard() {
    const modal = document.getElementById('wizard-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    wizardState.isOpen = false;

    // Restore focus
    if (previousActiveElement) {
        previousActiveElement.focus();
    }
}

/**
 * Navigate to next step
 */
export function nextStep() {
    if (wizardState.currentStep >= TOTAL_STEPS - 1) {
        // Final step - apply filters and close
        applyWizardFilters();
        closeWizard();
        return;
    }

    wizardState.currentStep++;
    renderCurrentStep();
    updateStepIndicators();
    updateNavigationButtons();

    // On summary step, calculate and display stats
    if (wizardState.currentStep === 5) {
        setTimeout(calculateAndDisplayStats, 50);
    }
}

/**
 * Navigate to previous step
 */
export function prevStep() {
    if (wizardState.currentStep <= 0) return;

    wizardState.currentStep--;
    renderCurrentStep();
    updateStepIndicators();
    updateNavigationButtons();
}

/**
 * Render the current step content
 */
function renderCurrentStep() {
    const container = document.getElementById('wizard-content');
    if (!container) return;

    const generator = stepGenerators[wizardState.currentStep];
    if (generator) {
        container.innerHTML = generator();
        attachStepEventListeners();
    }
}

/**
 * Update vertical step indicators (desktop) and horizontal step indicators (mobile)
 */
function updateStepIndicators() {
    const verticalContainer = document.getElementById('wizard-steps-vertical');
    const horizontalContainer = document.getElementById('wizard-steps-horizontal');

    const checkmarkSvg = `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
    </svg>`;

    // Render vertical step indicators (desktop)
    if (verticalContainer) {
        const checkmarkSvgLarge = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>`;

        verticalContainer.innerHTML = STEP_META.map((step, index) => {
            let stateClass = '';
            let circleContent = index + 1;

            if (index < wizardState.currentStep) {
                stateClass = 'completed';
                circleContent = checkmarkSvgLarge;
            } else if (index === wizardState.currentStep) {
                stateClass = 'active';
            }

            return `
                <div class="wizard-step-item ${stateClass}">
                    <div class="wizard-step-circle">${circleContent}</div>
                    <div class="pt-1">
                        <div class="wizard-step-label">${step.label}</div>
                        <div class="wizard-step-sublabel">${step.sublabel}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render horizontal step indicators (mobile)
    if (horizontalContainer) {
        horizontalContainer.innerHTML = STEP_META.map((step, index) => {
            let stateClass = '';
            let circleContent = index + 1;

            if (index < wizardState.currentStep) {
                stateClass = 'completed';
                circleContent = checkmarkSvg;
            } else if (index === wizardState.currentStep) {
                stateClass = 'active';
            }

            // Add connecting line before all steps except the first
            const lineBefore = index > 0 ? '<div class="wizard-step-h-line"></div>' : '';

            return `
                <div class="wizard-step-h ${stateClass}">
                    ${lineBefore}
                    <div class="wizard-step-h-circle">${circleContent}</div>
                </div>
            `;
        }).join('');
    }
}

/**
 * Update navigation button states
 */
function updateNavigationButtons() {
    const backBtn = document.getElementById('wizard-back');
    const nextBtn = document.getElementById('wizard-next');

    if (backBtn) {
        backBtn.disabled = wizardState.currentStep === 0;
    }

    if (nextBtn) {
        nextBtn.textContent = wizardState.currentStep === TOTAL_STEPS - 1 ? 'Explore Results' : 'Next';
    }
}

// ==========================================
// FILTER APPLICATION
// ==========================================

/**
 * Apply wizard selections to the global filter state
 */
function applyWizardFilters() {
    const fs = window.filterState;
    if (!fs) return;

    // Apply property type (independent toggles like sidebar)
    const homesBtn = document.getElementById('btn-homes');
    const condosBtn = document.getElementById('btn-condos');

    // Sync sidebar buttons to match wizard selections
    if (homesBtn) {
        if (wizardState.selections.homes) {
            homesBtn.classList.add('active');
        } else {
            homesBtn.classList.remove('active');
        }
    }
    if (condosBtn) {
        if (wizardState.selections.condos) {
            condosBtn.classList.add('active');
        } else {
            condosBtn.classList.remove('active');
        }
    }

    // Apply price range
    fs.priceMin = wizardState.selections.priceMin;
    fs.priceMax = wizardState.selections.priceMax;

    // Update price slider UI
    const priceMinSlider = document.getElementById('price-min');
    const priceMaxSlider = document.getElementById('price-max');
    if (priceMinSlider) priceMinSlider.value = fs.priceMin;
    if (priceMaxSlider) priceMaxSlider.value = fs.priceMax;

    // Apply beds/baths
    fs.bedsMin = wizardState.selections.bedsMin;
    fs.bathsMin = wizardState.selections.bathsMin;

    // Update beds/baths slider UI
    const bedsSlider = document.getElementById('beds-min');
    const bathsSlider = document.getElementById('baths-min');
    if (bedsSlider) bedsSlider.value = fs.bedsMin;
    if (bathsSlider) bathsSlider.value = fs.bathsMin;

    // Apply areas
    fs.areas = new Set(wizardState.selections.areas);
    document.querySelectorAll('.area-tag').forEach(tag => {
        const zipcode = tag.dataset.zipcode;
        const subarea = tag.dataset.subarea;
        if (fs.areas.has(zipcode) || fs.areas.has(subarea)) {
            tag.classList.add('selected');
        }
    });

    // Apply amenities
    fs.amenities = new Set(wizardState.selections.amenities);
    document.querySelectorAll('.amenity-tag').forEach(tag => {
        const amenity = tag.dataset.amenity;
        if (fs.amenities.has(amenity)) {
            tag.classList.add('selected');
        }
    });

    // Update slider displays
    if (window.updatePriceSlider) {
        window.updatePriceSlider(priceMinSlider, priceMaxSlider);
    }
    if (window.updateBedsSlider) window.updateBedsSlider();
    if (window.updateBathsSlider) window.updateBathsSlider();

    // Trigger filter application
    if (window.applyFilters) {
        window.applyFilters();
    }

    // Open the Summary panel in sidebar
    const summaryPanel = document.getElementById('summary-panel');
    const mainMenu = document.getElementById('main-menu');
    if (summaryPanel) {
        // Close all other panels first
        document.querySelectorAll('.sliding-panel').forEach(p => {
            p.classList.add('translate-x-full');
        });
        // Hide main menu
        if (mainMenu) mainMenu.style.display = 'none';
        // Open summary panel
        summaryPanel.classList.remove('translate-x-full');
    }
}

// ==========================================
// SUMMARY STATISTICS
// ==========================================

/**
 * Calculate and display summary statistics
 */
function calculateAndDisplayStats() {
    const neighborhoods = window.neighborhoods || [];
    const PRICE_STEPS = window.PRICE_STEPS || [];

    console.log('[Wizard] Calculating stats with', neighborhoods.length, 'neighborhoods');
    console.log(
        '[Wizard] Selections:',
        JSON.stringify({
            homes: wizardState.selections.homes,
            condos: wizardState.selections.condos,
            priceMin: wizardState.selections.priceMin,
            priceMax: wizardState.selections.priceMax,
            bedsMin: wizardState.selections.bedsMin,
            bathsMin: wizardState.selections.bathsMin,
            areas: [...wizardState.selections.areas],
            amenities: [...wizardState.selections.amenities]
        })
    );

    // If no neighborhoods loaded yet, show loading state
    if (neighborhoods.length === 0) {
        console.warn('[Wizard] No neighborhoods data available');
        return;
    }

    // Filter based on wizard selections
    const filtered = neighborhoods.filter(n => {
        // Property type (same logic as sidebar - OR between homes/condos)
        const isHomesActive = wizardState.selections.homes;
        const isCondosActive = wizardState.selections.condos;
        if (isHomesActive || isCondosActive) {
            const propType = (n.propertyType || '').toLowerCase();
            let matchesType = false;
            if (isHomesActive && (propType === 'homes' || propType === 'townhomes')) {
                matchesType = true;
            }
            if (isCondosActive && propType === 'condos') {
                matchesType = true;
            }
            if (!matchesType) return false;
        }

        // Areas
        if (wizardState.selections.areas.size > 0) {
            const matchesArea =
                wizardState.selections.areas.has(n.zipCode) ||
                wizardState.selections.areas.has(n.area) ||
                wizardState.selections.areas.has(n.subArea);
            if (!matchesArea) return false;
        }

        // Amenities (AND logic)
        if (wizardState.selections.amenities.size > 0) {
            const nAmenities = n.amenities || [];
            const hasAll = [...wizardState.selections.amenities].every(a => nAmenities.includes(a));
            if (!hasAll) return false;
        }

        // Price range: 0 = no limit (both thumbs stacked left = Any price)
        const stats = n.stats || {};
        const priceMinIdx = wizardState.selections.priceMin;
        const priceMaxIdx = wizardState.selections.priceMax;
        const minPrice = priceMinIdx === 0 ? 0 : PRICE_STEPS[priceMinIdx] || 0;
        const maxPrice =
            priceMaxIdx === 0 || priceMaxIdx >= 41
                ? Number.MAX_SAFE_INTEGER
                : PRICE_STEPS[priceMaxIdx] || Number.MAX_SAFE_INTEGER;

        // Try numeric minPrice/maxPrice first, fall back to parsing priceRange string
        let nbMinPrice = stats.minPrice != null ? parseFloat(stats.minPrice) : null;
        let nbMaxPrice = stats.maxPrice != null ? parseFloat(stats.maxPrice) : null;

        // If no numeric values, parse the priceRange string (e.g., "$619,900 - $3,990,000")
        if ((nbMinPrice === null || nbMaxPrice === null) && stats.priceRange) {
            const parsed = parseRange(stats.priceRange);
            if (parsed) {
                nbMinPrice = parsed.min;
                nbMaxPrice = parsed.max;
            }
        }

        if (nbMinPrice !== null && nbMaxPrice !== null && !isNaN(nbMinPrice) && !isNaN(nbMaxPrice)) {
            if (!(maxPrice >= nbMinPrice && minPrice <= nbMaxPrice)) return false;
        }

        // Beds
        if (wizardState.selections.bedsMin > 1) {
            const nbMaxBeds = stats.maxBeds !== undefined ? parseFloat(stats.maxBeds) : null;
            if (nbMaxBeds !== null && !isNaN(nbMaxBeds) && nbMaxBeds < wizardState.selections.bedsMin) return false;
        }

        // Baths
        if (wizardState.selections.bathsMin > 1) {
            const nbMaxBaths = stats.maxBaths !== undefined ? parseFloat(stats.maxBaths) : null;
            if (nbMaxBaths !== null && !isNaN(nbMaxBaths) && nbMaxBaths < wizardState.selections.bathsMin) return false;
        }

        return true;
    });

    console.log('[Wizard] Filtered to', filtered.length, 'of', neighborhoods.length, 'neighborhoods');

    // Calculate aggregate stats
    const totalListings = filtered.reduce((sum, n) => sum + (n.stats?.listingCount || 0), 0);
    const prices = filtered.map(n => n.stats?.medianPrice || n.stats?.avgPrice || 0).filter(p => p > 0);
    const minResultPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxResultPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const medianPrice = prices.length > 0 ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0;
    const avgDom =
        filtered.length > 0
            ? Math.round(filtered.reduce((sum, n) => sum + (n.stats?.avgDom || 0), 0) / filtered.length)
            : 0;

    // Update UI
    const communitiesEl = document.getElementById('wizard-stat-communities');
    const listingsEl = document.getElementById('wizard-stat-listings');
    const priceRangeEl = document.getElementById('wizard-stat-price-range');
    const medianEl = document.getElementById('wizard-stat-median');
    const domEl = document.getElementById('wizard-stat-dom');

    if (communitiesEl) communitiesEl.textContent = filtered.length.toLocaleString();
    if (listingsEl) listingsEl.textContent = totalListings.toLocaleString();
    if (priceRangeEl) {
        priceRangeEl.textContent =
            prices.length > 0 ? `${formatPrice(minResultPrice)} - ${formatPrice(maxResultPrice)}` : 'N/A';
    }
    if (medianEl) medianEl.textContent = medianPrice > 0 ? formatPrice(medianPrice) : 'N/A';
    if (domEl) domEl.textContent = avgDom > 0 ? `${avgDom} days` : 'N/A';

    // Top 3 neighborhoods by listings
    const top3 = [...filtered].sort((a, b) => (b.stats?.listingCount || 0) - (a.stats?.listingCount || 0)).slice(0, 3);

    const topListEl = document.getElementById('wizard-top-list');
    if (topListEl) {
        if (top3.length > 0) {
            topListEl.innerHTML = top3
                .map(
                    n => `
                <div class="flex justify-between items-center py-2 px-3 bg-white dark:bg-dark-bg-elevated rounded-lg border border-neutral-200 dark:border-dark-border">
                    <span class="text-sm font-medium text-neutral-700 dark:text-dark-text-primary">${n.name}</span>
                    <span class="text-xs text-neutral-500 dark:text-neutral-400">${n.stats?.listingCount || 0} listings</span>
                </div>
            `
                )
                .join('');
        } else {
            topListEl.innerHTML =
                '<p class="text-sm text-neutral-500 dark:text-neutral-400 text-center py-2">No matching neighborhoods found</p>';
        }
    }
}

// ==========================================
// EVENT HANDLERS
// ==========================================

function attachStepEventListeners() {
    // Property type selection
    document.querySelectorAll('.wizard-prop-type').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            // Toggle independently (like sidebar - can select both)
            btn.classList.toggle('selected');
            const isNowSelected = btn.classList.contains('selected');

            if (type === 'Homes') {
                wizardState.selections.homes = isNowSelected;
            } else if (type === 'Condos') {
                wizardState.selections.condos = isNowSelected;
            }
        });
    });

    // Area tags
    document.querySelectorAll('.wizard-area-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
            const zipcode = btn.dataset.zipcode;
            const subarea = btn.dataset.subarea;
            const value = zipcode || subarea;

            if (btn.classList.contains('selected')) {
                wizardState.selections.areas.add(value);
            } else {
                wizardState.selections.areas.delete(value);
            }
        });
    });

    // Amenity tags (with mutual exclusivity for rental policy)
    document.querySelectorAll('.wizard-amenity-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            const amenity = btn.dataset.amenity;

            // Handle mutual exclusivity for rental policies
            if (amenity === 'Short-Term' || amenity === 'No Short-Term') {
                const opposite = amenity === 'Short-Term' ? 'No Short-Term' : 'Short-Term';
                const oppositeBtn = document.querySelector(`.wizard-amenity-tag[data-amenity="${opposite}"]`);
                if (oppositeBtn) {
                    oppositeBtn.classList.remove('selected');
                    wizardState.selections.amenities.delete(opposite);
                }
            }

            btn.classList.toggle('selected');
            if (btn.classList.contains('selected')) {
                wizardState.selections.amenities.add(amenity);
            } else {
                wizardState.selections.amenities.delete(amenity);
            }
        });
    });

    // Price sliders - both thumbs start at 0 (stacked left = Any price)
    const priceMin = document.getElementById('wizard-price-min');
    const priceMax = document.getElementById('wizard-price-max');
    if (priceMin && priceMax) {
        const updatePriceDisplay = event => {
            const PRICE_STEPS = window.PRICE_STEPS || [];
            const totalSteps = 41;

            let minVal = parseInt(priceMin.value) || 0;
            let maxVal = parseInt(priceMax.value) || 0;

            // Push behavior - prevent overlap
            if (minVal > maxVal && maxVal !== 0) {
                if (event?.target === priceMax) {
                    priceMin.value = maxVal;
                    minVal = maxVal;
                } else {
                    priceMax.value = minVal;
                    maxVal = minVal;
                }
            }

            // Update wizard state
            wizardState.selections.priceMin = minVal;
            wizardState.selections.priceMax = maxVal;

            // Update display
            const display = document.getElementById('wizard-price-display');
            if (display) {
                const minPrice = PRICE_STEPS[minVal] || PRICE_STEPS[0];
                const maxPrice =
                    maxVal === 0
                        ? PRICE_STEPS[PRICE_STEPS.length - 1]
                        : PRICE_STEPS[maxVal] || PRICE_STEPS[PRICE_STEPS.length - 1];
                display.textContent = `${formatSliderPrice(minPrice)} - ${formatSliderPrice(maxPrice)}${maxVal === 0 || maxVal >= 41 ? '+' : ''}`;
            }

            // Update track fill
            const fill = document.getElementById('wizard-price-fill');
            if (fill) {
                if (maxVal === 0) {
                    // Both at 0 = no fill
                    fill.style.left = '0';
                    fill.style.width = '0';
                } else {
                    const minPct = minVal / totalSteps;
                    const maxPct = maxVal / totalSteps;
                    fill.style.left = `${minPct * 100}%`;
                    fill.style.width = `${(maxPct - minPct) * 100}%`;
                }
            }
        };

        priceMin.addEventListener('input', e => updatePriceDisplay(e));
        priceMax.addEventListener('input', e => updatePriceDisplay(e));
    }

    // Beds/Baths sliders
    const setupSingleSlider = (sliderId, displayId, fillId, stateKey) => {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        const fill = document.getElementById(fillId);

        if (slider) {
            slider.addEventListener('input', () => {
                const val = parseInt(slider.value);
                wizardState.selections[stateKey] = val;

                if (display) {
                    display.textContent = val === 1 ? 'Any' : val >= 6 ? '6+' : `${val}+`;
                }
                if (fill) {
                    fill.style.width = `${((val - 1) / 5) * 100}%`;
                }
            });
        }
    };

    setupSingleSlider('wizard-beds-min', 'wizard-beds-display', 'wizard-beds-fill', 'bedsMin');
    setupSingleSlider('wizard-baths-min', 'wizard-baths-display', 'wizard-baths-fill', 'bathsMin');
}

function resetSelections() {
    wizardState.selections = {
        homes: false,
        condos: false,
        priceMin: 0,
        priceMax: 0,
        bedsMin: 1,
        bathsMin: 1,
        areas: new Set(),
        amenities: new Set()
    };
}

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initialize wizard event handlers
 */
export function initWizard() {
    // Trigger button
    const triggerBtn = document.getElementById('wizard-trigger');
    if (triggerBtn) {
        triggerBtn.addEventListener('click', openWizard);
    }

    // Close button (desktop)
    const closeBtn = document.getElementById('wizard-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeWizard);
    }

    // Close button (mobile)
    const closeBtnMobile = document.getElementById('wizard-close-mobile');
    if (closeBtnMobile) {
        closeBtnMobile.addEventListener('click', closeWizard);
    }

    // Navigation buttons
    const nextBtn = document.getElementById('wizard-next');
    const backBtn = document.getElementById('wizard-back');
    if (nextBtn) nextBtn.addEventListener('click', nextStep);
    if (backBtn) backBtn.addEventListener('click', prevStep);

    // Keyboard: Escape to close
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && wizardState.isOpen) {
            closeWizard();
        }
    });

    console.log('[Wizard] Initialized');
}

// Expose for external access
if (typeof window !== 'undefined') {
    window.openWizard = openWizard;
    window.closeWizard = closeWizard;
}

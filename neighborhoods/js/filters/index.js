/**
 * @file filters/index.js
 * @description Filter coordination, state management, and apply logic.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { eventBus, Events } from '../core/eventBus.js';

// ==========================================
// FILTER STATE INITIALIZATION
// ==========================================

/**
 * Initialize filter state on window for legacy compatibility.
 */
export function initFilterState() {
    window.filterState = window.filterState || {
        propertyType: null, // null = all, 'Homes', 'Condos'
        areas: new Set(), // selected zip codes
        amenities: new Set(), // selected amenities
        priceMin: 0, // min price index
        priceMax: 41, // max price index
        bedsMin: 1,
        bathsMin: 1
    };
}

// ==========================================
// PRICE SLIDER
// ==========================================

/**
 * Format price for slider display.
 * @param {number} price - Price value
 * @returns {string} Formatted price string
 */
export function formatSliderPrice(price) {
    if (price >= 1000000) {
        return '$' + (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1) + 'M';
    }
    return '$' + (price / 1000).toFixed(0) + 'K';
}

/**
 * Update price slider UI and filter state.
 * @param {HTMLInputElement} minInput - Min price input element
 * @param {HTMLInputElement} maxInput - Max price input element
 * @param {Event} event - Input event (to determine which slider moved)
 */
export function updatePriceSlider(minInput, maxInput, event) {
    if (!minInput || !maxInput) return;

    const PRICE_STEPS = window.PRICE_STEPS || [];
    const priceDisplay = document.getElementById('price-display');
    const priceFill = document.getElementById('price-fill');

    let minVal = parseInt(minInput.value);
    let maxVal = parseInt(maxInput.value);
    if (isNaN(minVal)) minVal = 0;
    if (isNaN(maxVal)) maxVal = 0;
    const totalSteps = 41;

    // Push behavior - prevent overlap
    if (minVal > maxVal) {
        if (event?.target === maxInput) {
            minInput.value = maxVal;
            minVal = maxVal;
        } else {
            maxInput.value = minVal;
            maxVal = minVal;
        }
    }

    // Update filter state
    window.filterState.priceMin = minVal;
    window.filterState.priceMax = maxVal;

    // Update display
    if (priceDisplay) {
        if (minVal === 0 && maxVal === 0) {
            // Default state - no filter
            priceDisplay.textContent = '$250K - $35M+';
        } else {
            const minPrice = PRICE_STEPS[minVal] || PRICE_STEPS[0];
            const maxPrice = PRICE_STEPS[maxVal] || PRICE_STEPS[PRICE_STEPS.length - 1];
            priceDisplay.textContent = `${formatSliderPrice(minPrice)} - ${formatSliderPrice(maxPrice)}${maxVal === 41 ? '+' : ''}`;
        }
    }

    // Update track fill
    if (priceFill) {
        const minPct = minVal / totalSteps;
        const maxPct = maxVal / totalSteps;
        if (minVal === 0) {
            priceFill.style.left = '0';
            priceFill.style.width = `${maxPct * 100}%`;
        } else {
            priceFill.style.left = `${minPct * 100}%`;
            priceFill.style.width = `${(maxPct - minPct) * 100}%`;
        }
    }

    applyFilters();
}

// ==========================================
// BEDS/BATHS SLIDERS
// ==========================================

/**
 * Update beds slider UI and filter state.
 */
export function updateBedsSlider() {
    const bedsInput = document.getElementById('beds-min');
    const bedsDisplay = document.getElementById('beds-display');
    const bedsFill = document.getElementById('beds-fill');

    if (!bedsInput) return;
    const val = parseInt(bedsInput.value) || 1;
    window.filterState.bedsMin = val;

    // Update display
    if (bedsDisplay) {
        bedsDisplay.textContent = val === 1 ? 'Any' : val >= 6 ? '6+' : `${val}+`;
    }

    // Update track fill (1-6 range)
    if (bedsFill) {
        const pct = ((val - 1) / 5) * 100;
        bedsFill.style.width = `${pct}%`;
    }

    applyFilters();
}

/**
 * Update baths slider UI and filter state.
 */
export function updateBathsSlider() {
    const bathsInput = document.getElementById('baths-min');
    const bathsDisplay = document.getElementById('baths-display');
    const bathsFill = document.getElementById('baths-fill');

    if (!bathsInput) return;
    const val = parseInt(bathsInput.value) || 1;
    window.filterState.bathsMin = val;

    // Update display
    if (bathsDisplay) {
        bathsDisplay.textContent = val === 1 ? 'Any' : val >= 6 ? '6+' : `${val}+`;
    }

    // Update track fill (1-6 range)
    if (bathsFill) {
        const pct = ((val - 1) / 5) * 100;
        bathsFill.style.width = `${pct}%`;
    }

    applyFilters();
}

// ==========================================
// APPLY FILTERS
// ==========================================

/**
 * Apply all active filters and update results.
 * Central filtering logic that combines property type, area, amenity,
 * price, beds, and baths filters.
 */
export function applyFilters() {
    const PRICE_STEPS = window.PRICE_STEPS || [];
    const homesBtn = document.getElementById('btn-homes');
    const condosBtn = document.getElementById('btn-condos');

    const isHomesActive = homesBtn ? homesBtn.classList.contains('active') : false;
    const isCondosActive = condosBtn ? condosBtn.classList.contains('active') : false;
    const selectedAreas = window.filterState.areas;
    const selectedAmenities = window.filterState.amenities;

    // Get price range from filter state
    const priceMinIdx = window.filterState.priceMin || 0;
    const priceMaxIdx = window.filterState.priceMax || 41;

    // Get beds/baths from filter state
    const minBeds = window.filterState.bedsMin || 1;
    const minBaths = window.filterState.bathsMin || 1;

    // Convert to actual prices
    let minPrice = priceMinIdx === 0 ? 0 : PRICE_STEPS[priceMinIdx] || 0;
    let maxPrice = priceMaxIdx >= 41 ? Number.MAX_SAFE_INTEGER : PRICE_STEPS[priceMaxIdx] || Number.MAX_SAFE_INTEGER;

    window.filteredNeighborhoods = (window.neighborhoods || []).filter(n => {
        // Property type filter
        let matchesType = true;
        if (isHomesActive || isCondosActive) {
            matchesType = false;
            const propType = (n.propertyType || '').toLowerCase();
            if (isHomesActive && (propType === 'homes' || propType === 'townhomes')) {
                matchesType = true;
            }
            if (isCondosActive && propType === 'condos') {
                matchesType = true;
            }
        }

        // Area filter (OR logic)
        let matchesArea = true;
        if (selectedAreas.size > 0) {
            matchesArea = selectedAreas.has(n.zipCode) || selectedAreas.has(n.area) || selectedAreas.has(n.subArea);
        }

        // Amenity filter (AND logic - must have ALL selected)
        let matchesAmenities = true;
        if (selectedAmenities.size > 0) {
            matchesAmenities = [...selectedAmenities].every(a => n.amenities && n.amenities.includes(a));
        }

        // Price filter (overlap check)
        let inPriceRange = true;
        const stats = n.stats || {};
        const nbMinPrice = stats.minPrice !== undefined ? parseFloat(stats.minPrice) : null;
        const nbMaxPrice = stats.maxPrice !== undefined ? parseFloat(stats.maxPrice) : null;

        if (nbMinPrice !== null && nbMaxPrice !== null && !isNaN(nbMinPrice) && !isNaN(nbMaxPrice)) {
            inPriceRange = maxPrice >= nbMinPrice && minPrice <= nbMaxPrice;
        } else if (stats.avgPrice > 0) {
            inPriceRange = stats.avgPrice >= minPrice && stats.avgPrice <= maxPrice;
        }

        // Beds filter
        let inBedsRange = true;
        if (minBeds > 1) {
            const nbMaxBeds = stats.maxBeds !== undefined ? parseFloat(stats.maxBeds) : null;
            if (nbMaxBeds !== null && !isNaN(nbMaxBeds)) {
                inBedsRange = nbMaxBeds >= minBeds;
            }
        }

        // Baths filter
        let inBathsRange = true;
        if (minBaths > 1) {
            const nbMaxBaths = stats.maxBaths !== undefined ? parseFloat(stats.maxBaths) : null;
            if (nbMaxBaths !== null && !isNaN(nbMaxBaths)) {
                inBathsRange = nbMaxBaths >= minBaths;
            }
        }

        return matchesType && matchesArea && matchesAmenities && inPriceRange && inBedsRange && inBathsRange;
    });

    // Re-render results and markers
    if (window.renderResults) window.renderResults();
    if (window.addMarkers) window.addMarkers();
    if (window.fitBoundsToNeighborhoods) window.fitBoundsToNeighborhoods();

    // Emit filter applied event
    eventBus.emit(Events.FILTERS_APPLIED, {
        count: window.filteredNeighborhoods.length,
        filters: {
            propertyType: isHomesActive ? 'homes' : isCondosActive ? 'condos' : null,
            areas: [...selectedAreas],
            amenities: [...selectedAmenities],
            priceMin: minPrice,
            priceMax: maxPrice,
            bedsMin: minBeds,
            bathsMin: minBaths
        }
    });
}

// ==========================================
// CLEAR ALL FILTERS
// ==========================================

/**
 * Reset all filters to default state.
 */
export function clearAllFilters() {
    // Reset filter state
    window.filterState = {
        propertyType: null,
        areas: new Set(),
        amenities: new Set(),
        priceMin: 0,
        priceMax: 41,
        bedsMin: 1,
        bathsMin: 1
    };

    // Reset search
    window.searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    // Reset UI controls
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    if (priceMin) priceMin.value = 0;
    if (priceMax) priceMax.value = 41;

    const bedsSlider = document.getElementById('beds-min');
    const bathsSlider = document.getElementById('baths-min');
    if (bedsSlider) bedsSlider.value = 1;
    if (bathsSlider) bathsSlider.value = 1;

    // Reset property type buttons
    const homesBtn = document.getElementById('btn-homes');
    const condosBtn = document.getElementById('btn-condos');
    if (homesBtn) homesBtn.classList.remove('active');
    if (condosBtn) condosBtn.classList.remove('active');

    // Also reset data-filter-type buttons
    document.querySelectorAll('[data-filter-type]').forEach(btn => {
        btn.classList.remove('bg-brand-600', 'text-white');
        btn.classList.add('bg-white', 'text-neutral-700');
    });

    // Reset area tag buttons
    document.querySelectorAll('.area-tag').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Clear area markers
    if (window.areaMarkers) {
        window.areaMarkers.forEach((marker, slug) => {
            if (window.hideAreaMarker) window.hideAreaMarker(slug);
        });
    }

    // Reset amenity checkboxes and tags
    document.querySelectorAll('input[data-amenity]').forEach(cb => {
        cb.checked = false;
    });
    document.querySelectorAll('.amenity-tag').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Reset price preset buttons to default (unselected) state
    document.querySelectorAll('.price-preset').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Clear any visible map boundaries
    if (window.customBoundaries && window.hideCustomBoundary) {
        const boundariesToClear = [...window.customBoundaries];
        boundariesToClear.forEach(zipCode => {
            window.hideCustomBoundary(zipCode);
        });
    }

    // Reset filtered neighborhoods to all
    window.filteredNeighborhoods = [...(window.neighborhoods || [])];

    // Re-render
    if (window.renderResults) window.renderResults();
    if (window.addMarkers) window.addMarkers();

    // Update price display
    const priceDisplay = document.getElementById('price-display');
    if (priceDisplay) priceDisplay.textContent = '$250K - $35M+';

    // Update beds/baths displays
    const bedsDisplay = document.getElementById('beds-display');
    const bathsDisplay = document.getElementById('baths-display');
    if (bedsDisplay) bedsDisplay.textContent = 'Any';
    if (bathsDisplay) bathsDisplay.textContent = 'Any';

    // Update fills to default
    const priceFill = document.getElementById('price-fill');
    const bedsFill = document.getElementById('beds-fill');
    const bathsFill = document.getElementById('baths-fill');
    if (priceFill) {
        priceFill.style.left = '0';
        priceFill.style.width = '100%';
    }
    if (bedsFill) bedsFill.style.width = '0%';
    if (bathsFill) bathsFill.style.width = '0%';

    // Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'clear_filters');
    }

    // Emit event
    eventBus.emit(Events.FILTERS_CLEARED);
}

// ==========================================
// AREA TAG HANDLER
// ==========================================

/**
 * Handle area tag click - toggle selection and update filter state.
 * @param {HTMLElement} tag - The clicked area tag element
 */
export function handleAreaTagClick(tag) {
    tag.classList.toggle('selected');
    const zipCode = tag.getAttribute('data-zipcode');
    const subarea = tag.getAttribute('data-subarea');
    const isSelected = tag.classList.contains('selected');

    if (zipCode) {
        if (isSelected) {
            window.filterState.areas.add(zipCode);
            if (window.showCustomBoundary) window.showCustomBoundary(zipCode);
        } else {
            window.filterState.areas.delete(zipCode);
            if (window.hideCustomBoundary) window.hideCustomBoundary(zipCode);
        }

        // Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'filter_area', {
                area: zipCode,
                action: isSelected ? 'selected' : 'deselected'
            });
        }
    }

    if (subarea) {
        if (isSelected) {
            window.filterState.areas.add(subarea);
        } else {
            window.filterState.areas.delete(subarea);
        }

        // Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'filter_subarea', {
                subarea: subarea,
                action: isSelected ? 'selected' : 'deselected'
            });
        }
    }

    applyFilters();
}

// ==========================================
// AMENITY TAG HANDLER
// ==========================================

/**
 * Handle amenity tag click - toggle selection with mutual exclusivity for certain tags.
 * @param {HTMLElement} tag - The clicked amenity tag element
 */
export function handleAmenityTagClick(tag) {
    const amenity = tag.getAttribute('data-amenity');
    if (!amenity) return;

    // Handle mutual exclusivity for Short-Term / No Short-Term
    if (amenity === 'Short-Term') {
        const noShortTermTag = document.querySelector('.amenity-tag[data-amenity="No Short-Term"]');
        if (noShortTermTag && noShortTermTag.classList.contains('selected')) {
            noShortTermTag.classList.remove('selected');
            window.filterState.amenities.delete('No Short-Term');
        }
    } else if (amenity === 'No Short-Term') {
        const shortTermTag = document.querySelector('.amenity-tag[data-amenity="Short-Term"]');
        if (shortTermTag && shortTermTag.classList.contains('selected')) {
            shortTermTag.classList.remove('selected');
            window.filterState.amenities.delete('Short-Term');
        }
    }

    tag.classList.toggle('selected');
    const isSelected = tag.classList.contains('selected');

    if (isSelected) {
        window.filterState.amenities.add(amenity);
    } else {
        window.filterState.amenities.delete(amenity);
    }

    // Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'filter_amenity', {
            amenity: amenity,
            action: isSelected ? 'selected' : 'deselected'
        });
    }

    applyFilters();
}

// ==========================================
// PROPERTY TYPE HANDLER
// ==========================================

/**
 * Handle property type button click.
 * @param {HTMLElement} btn - The clicked button (homes or condos)
 */
export function handlePropertyTypeClick(btn) {
    btn.classList.toggle('active');
    applyFilters();
}

// Expose on window for legacy code during transition
if (typeof window !== 'undefined') {
    window.applyFilters = applyFilters;
    window.clearAllFilters = clearAllFilters;
    window.updateBedsSlider = updateBedsSlider;
    window.updateBathsSlider = updateBathsSlider;
    window.handleAreaTagClick = handleAreaTagClick;
    window.handleAmenityTagClick = handleAmenityTagClick;
    window.handlePropertyTypeClick = handlePropertyTypeClick;
    window.formatSliderPrice = formatSliderPrice;
    window.initFilterState = initFilterState;

    // Initialize filter state immediately
    initFilterState();
}

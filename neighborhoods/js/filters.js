/**
 * @file filters.js
 * @description Logic for filtering neighborhoods by price, amenities, etc.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { CONFIG } from './config.js';
import { STATE } from './state.js';
import { formatSliderPrice, parseRange, updateUrlParams } from './utils.js';
import { createMarkers } from './markers.js';
import { renderListItems } from './ui.js';
import { showCustomBoundary, hideCustomBoundary, fitBoundsToNeighborhoods } from './map.js?v=202501';

// Debounce helper for performance
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const debouncedApplyFilters = debounce(() => applyFilters(), 100);

// Apply sorting to neighborhoods array
export function applySorting(neighborhoods, sortId) {
    const sortOption = CONFIG.ui.sortOptions.find(opt => opt.id === sortId);
    if (!sortOption) return neighborhoods;

    const sorted = [...neighborhoods]; // Don't mutate original
    const { field, order } = sortOption;

    sorted.sort((a, b) => {
        let valA, valB;

        // Get comparison values based on field
        switch(field) {
            case 'name':
                valA = a.name;
                valB = b.name;
                return order === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);

            case 'price':
                valA = a.stats.medianPrice || a.stats.avgPrice || 0;
                valB = b.stats.medianPrice || b.stats.avgPrice || 0;
                break;

            case 'listingCount':
                valA = a.stats.listingCount || 0;
                valB = b.stats.listingCount || 0;
                break;

            case 'avgDom':
                valA = a.stats.avgDom || 999; // High default for missing data
                valB = b.stats.avgDom || 999;
                break;
        }

        return order === 'asc' ? valA - valB : valB - valA;
    });

    return sorted;
}

// Apply sorting only (without recreating markers) - for when only sort order changes
export function applySortOnly() {
    // Sort the current filtered neighborhoods
    const sortedNeighborhoods = applySorting(STATE.allFilteredNeighborhoods, STATE.currentSort);
    STATE.allFilteredNeighborhoods = sortedNeighborhoods;
    STATE.currentRenderCount = 0;

    // Clear and re-render list only
    const listContainer = document.getElementById('neighborhoodList');
    if (listContainer) listContainer.innerHTML = '';

    if (sortedNeighborhoods.length > 0) {
        renderListItems(sortedNeighborhoods.slice(0, CONFIG.data.batchSize));
        STATE.currentRenderCount = CONFIG.data.batchSize;
    }

    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `${STATE.allFilteredNeighborhoods.length} ${STATE.allFilteredNeighborhoods.length === 1 ? 'match' : 'matches'} found!`;
    }
}

// Track previous areas/subareas to detect changes
let previousSelectedAreas = new Set();
let previousSelectedSubareas = new Set();

export function setupFilters() {
    // Price Slider Logic
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    const priceDisplay = document.getElementById('price-display');
    const rangeFill = document.getElementById('price-fill');

    function updatePriceSlider() {
        let minVal = parseInt(priceMinInput.value);
        let maxVal = parseInt(priceMaxInput.value);
        
        // Ensure values are numbers
        if (isNaN(minVal)) minVal = 0;
        if (isNaN(maxVal)) maxVal = 41;

        const totalSteps = 41;

        // Push behavior
        if (minVal > maxVal) {
            if (this === priceMaxInput) {
                priceMinInput.value = maxVal;
                minVal = maxVal;
            } else if (this === priceMinInput) {
                priceMaxInput.value = minVal;
                maxVal = minVal;
            } else {
                priceMinInput.value = maxVal;
                minVal = maxVal;
            }
        }

        const minPriceDisplay = CONFIG.ui.priceSteps[minVal];
        const maxPriceDisplay = CONFIG.ui.priceSteps[maxVal];

        // Update STATE for URL slug generation
        // If both at 0 (default/stacked), set to null to indicate no filter
        if (minVal === 0 && maxVal === 0) {
            STATE.filters.priceMin = null;
            STATE.filters.priceMax = null;
            priceDisplay.textContent = "$250K - $35M+";
        } else {
            STATE.filters.priceMin = minPriceDisplay;
            STATE.filters.priceMax = maxPriceDisplay;
            priceDisplay.textContent = `${formatSliderPrice(minPriceDisplay)} - ${formatSliderPrice(maxPriceDisplay)}${maxVal === 41 ? '+' : ''}`;
        }

        // Calculate percentages
        const minPct = minVal / totalSteps;
        const maxPct = maxVal / totalSteps;

        // Update track fill (no offset needed - thumb reaches track edges)
        if (minVal === 0) {
            rangeFill.style.left = '0';
            rangeFill.style.width = `${maxPct * 100}%`;
        } else {
            rangeFill.style.left = `${minPct * 100}%`;
            rangeFill.style.width = `${(maxPct - minPct) * 100}%`;
        }
        
        debouncedApplyFilters();
    }

    priceMinInput.addEventListener('input', updatePriceSlider);
    priceMaxInput.addEventListener('input', updatePriceSlider);
    
    // Beds Slider Logic
    const bedsMinInput = document.getElementById('beds-min');
    const bedsDisplay = document.getElementById('beds-display');
    const bedsFill = document.getElementById('beds-fill');

    function updateBedsSlider() {
        const val = parseInt(bedsMinInput.value);
        bedsDisplay.textContent = val === 6 ? '6+' : val + '+';
        
        // Update STATE for URL slug generation
        STATE.filters.bedsMin = val;
        
        // Normalize to 0-1 range (min 1, max 6)
        let pct = (val - 1) / 5;
        
        // Update fill width (no offset needed - thumb reaches track edges)
        bedsFill.style.width = `${pct * 100}%`;
        
        debouncedApplyFilters();
    }

    bedsMinInput.addEventListener('input', updateBedsSlider);
    
    // Baths Slider Logic
    const bathsMinInput = document.getElementById('baths-min');
    const bathsDisplay = document.getElementById('baths-display');
    const bathsFill = document.getElementById('baths-fill');

    function updateBathsSlider() {
        const val = parseInt(bathsMinInput.value);
        bathsDisplay.textContent = val === 6 ? '6+' : val + '+';
        
        // Update STATE for future use
        STATE.filters.bathsMin = val;
        
        // Normalize to 0-1 range (min 1, max 6)
        let pct = (val - 1) / 5;
        
        // Update fill width (no offset needed - thumb reaches track edges)
        bathsFill.style.width = `${pct * 100}%`;
        
        debouncedApplyFilters();
    }

    bathsMinInput.addEventListener('input', updateBathsSlider);

    // Area Filters Logic
    document.querySelectorAll('#areaFilters .amenity-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('selected');
            const zipCode = this.getAttribute('data-zipcode');
            const isSelected = this.classList.contains('selected');
            if (typeof gtag !== 'undefined') {
                gtag('event', 'filter_area', {
                    area: zipCode,
                    action: isSelected ? 'selected' : 'deselected'
                });
            }
            applyFilters();
        });
    });

    // Sub-area Filters Logic (West 30A / East 30A)
    document.querySelectorAll('#subareaFilters .amenity-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('selected');
            const subarea = this.getAttribute('data-subarea');
            const isSelected = this.classList.contains('selected');
            if (typeof gtag !== 'undefined') {
                gtag('event', 'filter_subarea', {
                    subarea: subarea,
                    action: isSelected ? 'selected' : 'deselected'
                });
            }
            applyFilters();
        });
    });

    // Create amenity tags dynamically from loaded neighborhood data
    const amenitySet = new Set();
    STATE.neighborhoods.forEach(n => {
        if (n.amenities && Array.isArray(n.amenities)) {
            n.amenities.forEach(a => amenitySet.add(a));
        }
    });
    // Convert to sorted array (special items like Short-Term/No Short-Term go last)
    const specialAmenities = ['Short-Term', 'No Short-Term'];
    const allAmenities = Array.from(amenitySet)
        .filter(a => !specialAmenities.includes(a))
        .sort((a, b) => a.localeCompare(b))
        .concat(specialAmenities.filter(a => amenitySet.has(a)));
    const defaultSelected = []; 
    
    const amenityContainer = document.getElementById('amenityFilters');
    if (amenityContainer) {
        amenityContainer.innerHTML = '';
        
        allAmenities.forEach(amenity => {
            const tag = document.createElement('button');
            tag.className = 'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg-elevated text-neutral-700 dark:text-dark-text-primary hover:bg-brand-100 dark:hover:bg-brand-dark/20 hover:text-brand-700 dark:hover:text-brand-dark transition-colors cursor-pointer amenity-tag' + (defaultSelected.includes(amenity) ? ' selected' : '');
            tag.textContent = amenity;
            tag.setAttribute('data-amenity', amenity); 
            
            tag.addEventListener('click', function() {
                // Handle mutually exclusive Short-Term / No Short-Term
                if (amenity === 'Short-Term' || amenity === 'No Short-Term') {
                    const otherTag = amenity === 'Short-Term' ? 'No Short-Term' : 'Short-Term';
                    const otherButton = Array.from(amenityContainer.children).find(
                        btn => btn.getAttribute('data-amenity') === otherTag
                    );
                    
                    if (this.classList.contains('selected')) {
                        this.classList.remove('selected');
                        if (typeof gtag !== 'undefined') {
                            gtag('event', 'filter_amenity', {
                                amenity: amenity,
                                action: 'deselected'
                            });
                        }
                    } else {
                        if (otherButton) {
                            otherButton.classList.remove('selected');
                        }
                        this.classList.add('selected');
                        if (typeof gtag !== 'undefined') {
                            gtag('event', 'filter_amenity', {
                                amenity: amenity,
                                action: 'selected'
                            });
                        }
                    }
                } else {
                    this.classList.toggle('selected');
                    const isSelected = this.classList.contains('selected');
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'filter_amenity', {
                            amenity: amenity,
                            action: isSelected ? 'selected' : 'deselected'
                        });
                    }
                }
                applyFilters();
            });
            
            amenityContainer.appendChild(tag);
        });
    }

    // Property Type Buttons (Homes/Condos)
    const homesBtn = document.getElementById('btn-homes');
    const condosBtn = document.getElementById('btn-condos');

    if (homesBtn) {
        homesBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            applyFilters();
        });
    }

    if (condosBtn) {
        condosBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            applyFilters();
        });
    }

    // Initialize sliders visual state
    updatePriceSlider();
    updateBedsSlider();
    updateBathsSlider();
}

export function applyFilters() {
    const selectedAreas = new Set();
    const selectedSubareas = new Set();
    const selectedAmenities = new Set();
    let minPrice = 0;
    let maxPrice = 0;
    let minBeds = 1;
    let maxBeds = 6;
    let minBaths = 1;
    let maxBaths = 6;

    // Get selected areas (zip codes)
    document.querySelectorAll('#areaFilters .amenity-tag.selected').forEach(tag => {
        selectedAreas.add(tag.getAttribute('data-zipcode'));
    });

    // Get selected sub-areas (West 30A / East 30A)
    document.querySelectorAll('#subareaFilters .amenity-tag.selected').forEach(tag => {
        selectedSubareas.add(tag.getAttribute('data-subarea'));
    });

    // Get selected amenities
    document.querySelectorAll('#amenityFilters .amenity-tag.selected').forEach(tag => {
        selectedAmenities.add(tag.getAttribute('data-amenity'));
    });

    // Get price range
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    
    if (priceMinInput && priceMaxInput) {
        // Special case: if both sliders are at 0 (stacked on left), show all
        if (parseInt(priceMinInput.value) === 0 && parseInt(priceMaxInput.value) === 0) {
            minPrice = 0;
            maxPrice = Number.MAX_SAFE_INTEGER;
        } else {
            minPrice = parseInt(CONFIG.ui.priceSteps[priceMinInput.value]);
            // If max slider is at the end, treat as infinity
            if (parseInt(priceMaxInput.value) === 41) {
                maxPrice = Number.MAX_SAFE_INTEGER;
            } else {
                maxPrice = parseInt(CONFIG.ui.priceSteps[priceMaxInput.value]);
            }
        }
    } else {
        minPrice = 0;
        maxPrice = Number.MAX_SAFE_INTEGER;
    }

    // Get beds range
    const bedsMinInput = document.getElementById('beds-min');
    if (bedsMinInput) {
        minBeds = parseInt(bedsMinInput.value);
    } else {
        minBeds = 0;
    }
    maxBeds = 6; // Always 6+ for max

    // Get baths range
    const bathsMinInput = document.getElementById('baths-min');
    if (bathsMinInput) {
        minBaths = parseInt(bathsMinInput.value);
    } else {
        minBaths = 0;
    }
    maxBaths = 6; // Always 6+ for max

    // Get active property type (buttons are toggleable: both/one/none)
    const homesBtn = document.getElementById('btn-homes');
    const condosBtn = document.getElementById('btn-condos');
    const isHomesActive = homesBtn ? homesBtn.classList.contains('active') : false;
    const isCondosActive = condosBtn ? condosBtn.classList.contains('active') : false;

    const filteredNeighborhoods = STATE.neighborhoods.filter(neighborhood => {
        // Property Type Filter: support multi-select
        // - none active => show all
        // - homes active only => match Homes/Townhomes
        // - condos active only => match Condos
        // - both active => match any
        let matchesPropertyType = true; // default: no property-type filtering
        if (isHomesActive || isCondosActive) {
            matchesPropertyType = false; // we'll check conditions below

            if (isHomesActive && (neighborhood.propertyType === 'Homes' || neighborhood.propertyType === 'Townhomes')) {
                matchesPropertyType = true;
            }

            if (isCondosActive && neighborhood.propertyType === 'Condos') {
                matchesPropertyType = true;
            }
        }

        // Area/Subarea Filter - use OR logic when both are selected
        // This allows selecting "Destin" + "West 30A" to show neighborhoods from either
        let inSelectedLocation = true;
        const hasAreaFilter = selectedAreas.size > 0;
        const hasSubareaFilter = selectedSubareas.size > 0;

        if (hasAreaFilter || hasSubareaFilter) {
            const matchesArea = hasAreaFilter && selectedAreas.has(neighborhood.zipCode);
            // Check both area and subArea fields - allows filtering by Area code (17 - 30A West) or SubArea code (1503 - Sandestin Resort)
            const matchesSubarea = hasSubareaFilter && (selectedSubareas.has(neighborhood.area) || selectedSubareas.has(neighborhood.subArea));
            // OR logic: match if in selected areas OR in selected subareas
            inSelectedLocation = matchesArea || matchesSubarea;
        }

        // Amenity Filter - use AND logic: neighborhood must have ALL selected amenities
        const hasSelectedAmenities = selectedAmenities.size === 0 || [...selectedAmenities].every(amenity => neighborhood.amenities.includes(amenity));
        
        // Price Filter
        let inPriceRange = false;
        const nbMinPrice = neighborhood.stats.minPrice !== undefined ? parseFloat(neighborhood.stats.minPrice) : null;
        const nbMaxPrice = neighborhood.stats.maxPrice !== undefined ? parseFloat(neighborhood.stats.maxPrice) : null;

        if (nbMinPrice !== null && nbMaxPrice !== null && !isNaN(nbMinPrice) && !isNaN(nbMaxPrice)) {
            // Check for overlap: UserMax >= NbMin && UserMin <= NbMax
            inPriceRange = maxPrice >= nbMinPrice && minPrice <= nbMaxPrice;
        } else {
            const priceRange = parseRange(neighborhood.stats.priceRange);
            if (priceRange) {
                // Check for overlap: UserMax >= NbMin && UserMin <= NbMax
                inPriceRange = maxPrice >= priceRange.min && minPrice <= priceRange.max;
            } else {
                // Fallback to avgPrice if range not available
                if (neighborhood.stats.avgPrice > 0) {
                    inPriceRange = neighborhood.stats.avgPrice >= minPrice && neighborhood.stats.avgPrice <= maxPrice;
                } else {
                    // No price data (Sold Only / Masked). Include if minPrice is 0 (default).
                    inPriceRange = minPrice === 0;
                }
            }
        }

        // Beds Filter
        let inBedsRange = false;
        // Use explicit min/max if available, otherwise parse range string
        const nbMinBeds = neighborhood.stats.minBeds !== undefined ? parseFloat(neighborhood.stats.minBeds) : null;
        const nbMaxBeds = neighborhood.stats.maxBeds !== undefined ? parseFloat(neighborhood.stats.maxBeds) : null;
        
        if (nbMinBeds !== null && nbMaxBeds !== null && !isNaN(nbMinBeds) && !isNaN(nbMaxBeds)) {
             // Check if neighborhood has anything >= minBeds
             inBedsRange = nbMaxBeds >= minBeds;
        } else {
            const bedsRange = parseRange(neighborhood.stats.bedsRange);
            if (bedsRange) {
                 inBedsRange = bedsRange.max >= minBeds;
            } else if (neighborhood.stats.avgSqft > 0) {
                 // Fallback heuristic
                 inBedsRange = neighborhood.stats.avgSqft >= minBeds * 300;
            } else {
                // No data available. Include if filter is at minimum (1).
                inBedsRange = minBeds === 1;
            }
        }

        // Baths Filter
        let inBathsRange = false;
        const nbMinBaths = neighborhood.stats.minBaths !== undefined ? parseFloat(neighborhood.stats.minBaths) : null;
        const nbMaxBaths = neighborhood.stats.maxBaths !== undefined ? parseFloat(neighborhood.stats.maxBaths) : null;

        if (nbMinBaths !== null && nbMaxBaths !== null && !isNaN(nbMinBaths) && !isNaN(nbMaxBaths)) {
            // Check if neighborhood has anything >= minBaths
            inBathsRange = nbMaxBaths >= minBaths;
        } else {
            const bathsRange = parseRange(neighborhood.stats.bathsRange);
            if (bathsRange) {
                inBathsRange = bathsRange.max >= minBaths;
            } else if (neighborhood.stats.avgSqft > 0) {
                // Fallback heuristic
                inBathsRange = neighborhood.stats.avgSqft >= minBaths * 150;
            } else {
                // No data available. Include if filter is at minimum (1).
                inBathsRange = minBaths === 1;
            }
        }

        return matchesPropertyType && inSelectedLocation && hasSelectedAmenities && inPriceRange && inBedsRange && inBathsRange;
    });

    // Apply sorting
    const sortedNeighborhoods = applySorting(filteredNeighborhoods, STATE.currentSort);

    STATE.allFilteredNeighborhoods = sortedNeighborhoods; // Update global filtered neighborhoods
    STATE.currentRenderCount = 0; // Reset render count

    // Reset UI
    document.getElementById('resultsCount').textContent = '';

    // Clear existing markers
    STATE.markers.forEach(m => m.marker.setMap(null));
    STATE.markers = [];
    
    // Sync boundaries with selected areas
    // Remove unselected boundaries
    STATE.customBoundaries.forEach(zip => {
        if (!selectedAreas.has(zip)) {
            hideCustomBoundary(zip);
        }
    });

    // Add selected boundaries
    selectedAreas.forEach(zip => {
        if (!STATE.customBoundaries.has(zip)) {
            showCustomBoundary(zip);
        }
    });
    
    // Clear list
    const listContainer = document.getElementById('neighborhoodList');
    if (listContainer) listContainer.innerHTML = '';

    // Show all neighborhoods initially
    if (sortedNeighborhoods.length === 0) {
        // No results found - show message
        document.getElementById('resultsCount').textContent = 'No communities found matching your criteria.';
    } else {
        // Update URL with new filters
        const newUrl = updateUrlParams({ areas: Array.from(selectedAreas), amenities: Array.from(selectedAmenities) });
        history.replaceState(null, '', newUrl);

        // Create markers for ALL filtered neighborhoods
        createMarkers(sortedNeighborhoods);

        // Paginate and render list items
        renderListItems(sortedNeighborhoods.slice(STATE.currentRenderCount, STATE.currentRenderCount + CONFIG.data.batchSize));
        STATE.currentRenderCount += CONFIG.data.batchSize;
    }

    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `${STATE.allFilteredNeighborhoods.length} ${STATE.allFilteredNeighborhoods.length === 1 ? 'community' : 'communities'} found!`;
    }

    // Auto-pan when areas or subareas are updated
    const areasChanged = selectedAreas.size !== previousSelectedAreas.size ||
                         ![...selectedAreas].every(area => previousSelectedAreas.has(area));
    const subareasChanged = selectedSubareas.size !== previousSelectedSubareas.size ||
                            ![...selectedSubareas].every(subarea => previousSelectedSubareas.has(subarea));

    if ((areasChanged || subareasChanged) && sortedNeighborhoods.length > 0) {
        // Small delay to ensure markers are rendered, then fit bounds
        setTimeout(() => {
            console.log('Calling fitBoundsToNeighborhoods');
            // Fit bounds with comfortable padding
            fitBoundsToNeighborhoods(sortedNeighborhoods, 80);

            // Then ensure minimum zoom level for single-area/subarea selections
            if (selectedAreas.size === 1 || selectedSubareas.size === 1) {
                setTimeout(() => {
                    const currentZoom = STATE.map.getZoom();
                    if (currentZoom < 13) {
                        STATE.map.setZoom(13);
                    }
                }, 100);
            }
        }, 200);
    }

    // Update previous areas/subareas for next comparison
    previousSelectedAreas = new Set(selectedAreas);
    previousSelectedSubareas = new Set(selectedSubareas);
}

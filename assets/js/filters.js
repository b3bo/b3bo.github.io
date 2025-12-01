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
import { showCustomBoundary, hideCustomBoundary, fitBoundsToNeighborhoods } from './map.js';

// Debounce helper for performance
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const debouncedApplyFilters = debounce(() => applyFilters(), 100);

// Track previous areas to detect changes
let previousSelectedAreas = new Set();

export function setupFilters() {
    // Price Slider Logic
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    const priceDisplay = document.getElementById('price-display');
    const rangeFill = document.getElementById('range-fill');

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
        STATE.filters.priceMin = minPriceDisplay;
        STATE.filters.priceMax = maxPriceDisplay;

        if (minVal === 0 && maxVal === 0) {
            priceDisplay.textContent = "$250K - $35M+";
        } else {
            priceDisplay.textContent = `${formatSliderPrice(minPriceDisplay)} - ${formatSliderPrice(maxPriceDisplay)}${maxVal === 41 ? '+' : ''}`;
        }

        // Calculate percentages
        const minPct = minVal / totalSteps;
        const maxPct = maxVal / totalSteps;

        // Update track fill
        if (minVal === 0) {
            rangeFill.style.left = '0';
            rangeFill.style.width = `calc(${maxPct * 100}% + ${21 - maxPct * 42}px)`;
        } else {
            rangeFill.style.left = `calc(${minPct * 100}% + ${21 - minPct * 42}px)`;
            rangeFill.style.width = `calc(${(maxPct - minPct) * 100}% - ${(maxPct - minPct) * 42}px)`;
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
        
        // Update fill width with thumb offset correction
        bedsFill.style.width = `calc(${pct * 100}% + ${21 - pct * 42}px)`;
        
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
        
        // Update fill width with thumb offset correction
        bathsFill.style.width = `calc(${pct * 100}% + ${21 - pct * 42}px)`;
        
        debouncedApplyFilters();
    }

    bathsMinInput.addEventListener('input', updateBathsSlider);

    // Area Filters Logic
    document.querySelectorAll('#areaFilters .amenity-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('selected');
            applyFilters();
        });
    });

    // Create amenity tags dynamically
    const allAmenities = CONFIG.ui.amenities;
    const defaultSelected = []; 
    
    const amenityContainer = document.getElementById('amenityFilters');
    if (amenityContainer) {
        amenityContainer.innerHTML = '';
        
        allAmenities.forEach(amenity => {
            const tag = document.createElement('button');
            tag.className = 'amenity-tag' + (defaultSelected.includes(amenity) ? ' selected' : '');
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
                    } else {
                        if (otherButton) {
                            otherButton.classList.remove('selected');
                        }
                        this.classList.add('selected');
                    }
                } else {
                    this.classList.toggle('selected');
                }
                applyFilters();
            });
            
            amenityContainer.appendChild(tag);
        });
    }

    // Initialize sliders visual state
    updatePriceSlider();
    updateBedsSlider();
    updateBathsSlider();
}

export function applyFilters() {
    const selectedAreas = new Set();
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

    // Get selected amenities
    document.querySelectorAll('#amenityFilters .amenity-tag.selected').forEach(tag => {
        selectedAmenities.add(tag.getAttribute('data-amenity'));
    });

    // Get price range
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    
    // Special case: if both are at 0 (min spot), treat as full range
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

    // Get beds range
    const bedsMinInput = document.getElementById('beds-min');
    minBeds = parseInt(bedsMinInput.value);
    maxBeds = 6; // Always 6+ for max

    // Get baths range
    const bathsMinInput = document.getElementById('baths-min');
    minBaths = parseInt(bathsMinInput.value);
    maxBaths = 6; // Always 6+ for max

    // Get active property type
    const isHomesActive = document.getElementById('btn-homes').classList.contains('active');
    const isCondosActive = document.getElementById('btn-condos').classList.contains('active');

    const filteredNeighborhoods = STATE.neighborhoods.filter(neighborhood => {
        // Property Type Filter
        let matchesPropertyType = false;
        if (isHomesActive) {
            matchesPropertyType = neighborhood.propertyType === 'Homes';
        } else if (isCondosActive) {
            matchesPropertyType = neighborhood.propertyType === 'Condos' || neighborhood.propertyType === 'Townhomes';
        }

        // Area Filter
        const inSelectedAreas = selectedAreas.size === 0 || selectedAreas.has(neighborhood.zipCode);
        
        // Amenity Filter
        const hasSelectedAmenities = selectedAmenities.size === 0 || neighborhood.amenities.some(amenity => selectedAmenities.has(amenity));
        
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

        return matchesPropertyType && inSelectedAreas && hasSelectedAmenities && inPriceRange && inBedsRange && inBathsRange;
    });

    STATE.allFilteredNeighborhoods = filteredNeighborhoods; // Update global filtered neighborhoods
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
    if (filteredNeighborhoods.length === 0) {
        // No results found - show message
        document.getElementById('resultsCount').textContent = 'No communities found matching your criteria.';
    } else {
        // Update URL with new filters
        const newUrl = updateUrlParams({ areas: Array.from(selectedAreas), amenities: Array.from(selectedAmenities) });
        history.replaceState(null, '', newUrl);
        
        // Create markers for ALL filtered neighborhoods
        createMarkers(filteredNeighborhoods);

        // Paginate and render list items
        renderListItems(filteredNeighborhoods.slice(STATE.currentRenderCount, STATE.currentRenderCount + CONFIG.data.batchSize));
        STATE.currentRenderCount += CONFIG.data.batchSize;
    }

    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `${STATE.allFilteredNeighborhoods.length} ${STATE.allFilteredNeighborhoods.length === 1 ? 'community' : 'communities'} found!`;
    }

    // Auto-pan when areas are updated
    const areasChanged = selectedAreas.size !== previousSelectedAreas.size ||
                         ![...selectedAreas].every(area => previousSelectedAreas.has(area));

    console.log('Areas changed:', areasChanged);
    console.log('Selected areas:', Array.from(selectedAreas));
    console.log('Previous areas:', Array.from(previousSelectedAreas));
    console.log('Filtered neighborhoods count:', filteredNeighborhoods.length);

    if (areasChanged && filteredNeighborhoods.length > 0) {
        console.log('Triggering auto-pan...');
        // Small delay to ensure markers are rendered, then fit bounds
        setTimeout(() => {
            console.log('Calling fitBoundsToNeighborhoods');
            // Fit bounds with comfortable padding
            fitBoundsToNeighborhoods(filteredNeighborhoods, 80);

            // Then ensure minimum zoom level for single-area selections
            if (selectedAreas.size === 1) {
                setTimeout(() => {
                    const currentZoom = STATE.map.getZoom();
                    if (currentZoom < 13) {
                        STATE.map.setZoom(13);
                    }
                }, 100);
            }
        }, 200);
    }

    // Update previous areas for next comparison
    previousSelectedAreas = new Set(selectedAreas);
}

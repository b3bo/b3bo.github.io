/**
 * @file ui.js
 * @description Handles UI rendering, list items, and event listeners.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { STATE } from './state.js';
import { CONFIG } from './config.js';
import { formatPrice } from './utils.js';
import { smoothFlyTo } from './map.js';

export function renderListItems(neighborhoodsToRender) {
    const listContainer = document.getElementById('neighborhoodList');

    neighborhoodsToRender.forEach(neighborhood => {
        // Find existing marker for this neighborhood to link click event
        const markerObj = STATE.markers.find(m => m.neighborhood === neighborhood);
        const marker = markerObj ? markerObj.marker : null;

        // Create List Item
        if (listContainer) {
            // Format price for card (e.g. $1.3M)
            // Use Median Price to match Info Window
            const price = neighborhood.stats.medianPrice || neighborhood.stats.avgPrice;
            const formattedPrice = formatPrice(price);

            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <h3 class="text-base font-bold ${CONFIG.colors.text.primary}">${neighborhood.name}</h3>
                    <span class="text-sm font-semibold ${CONFIG.colors.text.primary}">${formattedPrice}</span>
                </div>
                <div class="text-xs ${CONFIG.colors.text.secondary} mb-3">${neighborhood.stats.listingCount} Listings</div>
                <div class="text-xs ${CONFIG.colors.text.secondary} leading-relaxed">
                    ${neighborhood.amenities.join(', ')}
                </div>
            `;
            
            // Add click listener to pan to marker (auto-open after landing when enabled)
            card.addEventListener('click', () => {
                if (!marker) return;

                // Close current info window
                if (STATE.infoWindow && STATE.infoWindow.getMap()) {
                    STATE.infoWindow.close();
                }
                // Deactivate current marker ripple
                if (STATE.activeMarker) {
                    const ripple = STATE.activeMarker.content.querySelector('.ripple');
                    if (ripple) ripple.classList.remove('active');
                    STATE.activeMarker = null;
                }
                
                // Fly to new location
                smoothFlyTo(neighborhood.position, 15);
                
                // Auto-open: start ripple 1s after flight begins, then open
                if (CONFIG.map.autoOpenOnFly) {
                    // Ripple cue
                    setTimeout(() => {
                        const ripple = marker.content.querySelector('.ripple');
                        if (ripple) ripple.classList.add('active');
                    }, 1000);
                    // Open shortly after landing
                    setTimeout(() => {
                        google.maps.event.trigger(marker, 'click');
                    }, 3100); // Wait for 2s animation + extra 1s delay
                }
                
                // On mobile, close drawer to show map
                if (window.innerWidth < 768) {
                    document.getElementById('drawer-toggle').checked = false;
                }
            });

            listContainer.appendChild(card);
        }
    });
}

export function navigateNeighborhood(direction) {
    if (event) event.stopPropagation();
    if (!window.currentNeighborhood || !STATE.allFilteredNeighborhoods.length) return;
    
    const currentIndex = STATE.allFilteredNeighborhoods.indexOf(window.currentNeighborhood);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex + direction;
    // Wrap around
    if (newIndex < 0) newIndex = STATE.allFilteredNeighborhoods.length - 1;
    if (newIndex >= STATE.allFilteredNeighborhoods.length) newIndex = 0;
    
    const nextNeighborhood = STATE.allFilteredNeighborhoods[newIndex];
    const markerObj = STATE.markers.find(m => m.neighborhood === nextNeighborhood);
    
    if (markerObj) {
        const marker = markerObj.marker;
        
        // Close current info window
        if (STATE.infoWindow && STATE.infoWindow.getMap()) {
            STATE.infoWindow.close();
        }
        // Deactivate current marker ripple
        if (STATE.activeMarker) {
            const ripple = STATE.activeMarker.content.querySelector('.ripple');
            if (ripple) ripple.classList.remove('active');
            STATE.activeMarker = null;
        }

        // Calculate distance to determine animation timing
        const startPos = STATE.map.getCenter();
        const targetLatLng = new google.maps.LatLng(nextNeighborhood.position);
        const distance = google.maps.geometry.spherical.computeDistanceBetween(startPos, targetLatLng);
        const isShortHop = distance < 2000;

        // Fly to new location
        smoothFlyTo(nextNeighborhood.position, 15);
        
        if (isShortHop) {
            // Short hop: fast animation
            setTimeout(() => {
                const ripple = marker.content.querySelector('.ripple');
                if (ripple) ripple.classList.add('active');
            }, 100);
            
            setTimeout(() => {
                google.maps.event.trigger(marker, 'click');
            }, 450);
        } else {
            // Long flight: 2s animation
            // Ripple cue
            setTimeout(() => {
                const ripple = marker.content.querySelector('.ripple');
                if (ripple) ripple.classList.add('active');
            }, 1000);
            // Open shortly after landing
            setTimeout(() => {
                google.maps.event.trigger(marker, 'click');
            }, 2200);
        }
    }
}

export function setupUI() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active state from all tabs
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('border-b-2', 'border-neutral-900', CONFIG.colors.text.primary);
                b.classList.add(CONFIG.colors.text.tertiary);
                b.classList.remove('active');
            });
            
            // Add active state to clicked tab
            this.classList.add('border-b-2', 'border-neutral-900', CONFIG.colors.text.primary);
            this.classList.remove(CONFIG.colors.text.tertiary);
            this.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show selected tab content
            const tabId = 'tab-' + this.dataset.tab;
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.remove('hidden');
            } else {
                console.error('Tab content not found for:', tabId);
            }
        });
    });

    // Property type toggle (Homes/Condos)
    document.querySelectorAll('.property-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active state from all buttons
            document.querySelectorAll('.property-type-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active state to clicked button
            this.classList.add('active');
            
            // Apply filters (imported dynamically to avoid circular dependency if needed, but here we assume it's fine)
            // We need to import applyFilters. Since it's a setup function, we can pass it in or import it.
            // For now, let's assume the event listener in filters.js handles the logic? 
            // No, filters.js sets up sliders. We need to trigger applyFilters here.
            // We will dispatch a custom event or call it directly.
            // Let's import applyFilters in this file.
            
            // Actually, let's dispatch an event that filters.js listens to, OR just import applyFilters.
            // Importing applyFilters from filters.js creates a circular dependency: filters -> ui -> filters.
            // Solution: Move applyFilters to a separate logic file or inject it.
            // Or, simpler: Just trigger the click on a hidden element or use a custom event.
            // Better yet: Move the event listener setup for these buttons TO filters.js.
            // I will remove this listener here and let filters.js handle it.
        });
    });

    // Infinite Scroll
    const scrollContainer = document.getElementById('sidebar-scroll-container');
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            
            // Load more when within 200px of bottom
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                if (STATE.currentRenderCount < STATE.allFilteredNeighborhoods.length) {
                    const nextBatch = STATE.allFilteredNeighborhoods.slice(STATE.currentRenderCount, STATE.currentRenderCount + CONFIG.data.batchSize);
                    if (nextBatch.length > 0) {
                        renderListItems(nextBatch);
                        STATE.currentRenderCount += CONFIG.data.batchSize;
                    }
                }
            }
        });
    }

    // Close drawer when clicking on empty space
    document.getElementById('sidebar').addEventListener('click', function(e) {
        // Check if the click target is interactive or inside an interactive element
        if (e.target.closest('button') || 
            e.target.closest('a') || 
            e.target.closest('label') || 
            e.target.closest('input') ||
            e.target.closest('.tab-btn')) {
            return;
        }
        
        // Close the drawer by unchecking the toggle
        const drawerToggle = document.getElementById('drawer-toggle');
        if (drawerToggle && drawerToggle.checked) {
            drawerToggle.checked = false;
        }
    });
}

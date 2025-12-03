/**
 * @file map.js
 * @description Core map initialization and camera movement logic.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { CONFIG } from './config.js';
import { STATE } from './state.js';
import { getUrlParams, clamp, getThemeColor, toSlug } from './utils.js';
import { addMarkers, showInfoWindow } from './markers.js';
import { setupFilters, applyFilters } from './filters.js';
import { loadNeighborhoods } from './data.js';

export function initializeMap(center, zoom) {
    STATE.map = new google.maps.Map(document.getElementById('map'), {
        zoom: zoom,
        center: center,
        mapId: CONFIG.map.mapId,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        streetViewControl: true,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControl: true,
        clickableIcons: false
    });

    // Track zoom level changes
    let lastZoom = STATE.map.getZoom();

    STATE.map.addListener('idle', () => {
        const currentZoom = STATE.map.getZoom();
        if (currentZoom !== lastZoom) {
            lastZoom = currentZoom;
        }
    });

    // Disable Google Maps default auto-pan when info windows open
    STATE.infoWindow = new google.maps.InfoWindow({ maxWidth: 280, disableAutoPan: true });
    STATE.hoverInfoWindow = new google.maps.InfoWindow({ maxWidth: 280, disableAutoPan: true });
    
    // Set higher z-index for hover info window to appear above clicked info windows
    google.maps.event.addListener(STATE.hoverInfoWindow, 'domready', () => {
        const iwOuter = document.querySelector('.gm-style-iw-c');
        if (iwOuter && STATE.hoverInfoWindow.getMap()) {
            iwOuter.parentElement.style.zIndex = '100';
        }
    });
    
    // Override Google Maps fullscreen to include sidebar
    // Wait for fullscreen button to be added to DOM
    setTimeout(() => {
        const fullscreenButtons = document.querySelectorAll('button[title*="fullscreen" i], button[aria-label*="fullscreen" i]');
        fullscreenButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Use our custom fullscreen logic
                if (!document.fullscreenElement) {
                    document.body.requestFullscreen();
                    // Open drawer in fullscreen
                    const drawerToggle = document.getElementById('drawer-toggle');
                    if (drawerToggle && params.mode !== 'single') {
                        setTimeout(() => {
                            drawerToggle.checked = true;
                        }, 100);
                    }
                } else {
                    document.exitFullscreen();
                }
            }, true); // Capture phase to intercept before Google's handler
        });
    }, 1000);
    
    // Also listen for fullscreen changes in case button intercept doesn't work
    document.addEventListener('fullscreenchange', () => {
        const drawerToggle = document.getElementById('drawer-toggle');
        if (document.fullscreenElement && params.mode !== 'single') {
            if (drawerToggle) {
                drawerToggle.checked = true;
            }
        }
    });
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const mapLayout = document.getElementById('map-layout');
    const fullscreenEnterIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
    `;
    const fullscreenExitIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 18 18 6M6 6l12 12" />
        </svg>
    `;

    const notifyHostFullscreen = (active) => {
        try {
            window.parent.postMessage({ type: 'fullscreenChanged', active }, '*');
        } catch (err) {
            console.warn('postMessage to host failed', err);
        }
    };

    let toggleMobileFullscreenFromMessage = null;

    if (isMobile && mapLayout) {
        const mobileFullscreenBtn = document.createElement('button');
        mobileFullscreenBtn.className = 'mobile-fullscreen-btn';
        mobileFullscreenBtn.title = 'Toggle fullscreen';
        mobileFullscreenBtn.setAttribute('aria-pressed', 'false');
        mobileFullscreenBtn.innerHTML = fullscreenEnterIcon;
        mobileFullscreenBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 10;
            background: white;
            border: none;
            border-radius: 2px;
            width: 40px;
            height: 40px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
        `;

        const applyButtonPosition = (isActive) => {
            if (isActive) {
                mobileFullscreenBtn.style.position = 'fixed';
                mobileFullscreenBtn.style.top = '1rem';
                mobileFullscreenBtn.style.right = '1rem';
                mobileFullscreenBtn.style.zIndex = '1100';
                mobileFullscreenBtn.style.opacity = '0.95';
            } else {
                mobileFullscreenBtn.style.position = 'absolute';
                mobileFullscreenBtn.style.top = '10px';
                mobileFullscreenBtn.style.right = '10px';
                mobileFullscreenBtn.style.zIndex = '10';
                mobileFullscreenBtn.style.opacity = '1';
            }
        };

        applyButtonPosition(false);

        const updateButtonIcon = (isActive) => {
            mobileFullscreenBtn.innerHTML = isActive ? fullscreenExitIcon : fullscreenEnterIcon;
            mobileFullscreenBtn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            applyButtonPosition(isActive);
        };

        const setFauxFullscreen = (isActive) => {
            document.body.classList.toggle('mobile-faux-fullscreen', isActive);
            updateButtonIcon(isActive);
            if (isActive) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            const drawerToggle = document.getElementById('drawer-toggle');
            if (drawerToggle) {
                drawerToggle.checked = !isActive && drawerToggle.checked;
            }
            notifyHostFullscreen(isActive);
        };

        mobileFullscreenBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();

            if (isIOS) {
                const willActivate = !document.body.classList.contains('mobile-faux-fullscreen');
                setFauxFullscreen(willActivate);
                return;
            }

            try {
                if (!document.fullscreenElement) {
                    if (mapLayout.requestFullscreen) {
                        await mapLayout.requestFullscreen();
                    } else if (mapLayout.webkitRequestFullscreen) {
                        await mapLayout.webkitRequestFullscreen();
                    }
                } else {
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        await document.webkitExitFullscreen();
                    }
                }
            } catch (error) {
                console.error('Fullscreen error:', error);
            }
        }, true);

        document.addEventListener('fullscreenchange', () => {
            if (!isIOS) {
                const active = Boolean(document.fullscreenElement);
                updateButtonIcon(active);
                notifyHostFullscreen(active);
            } else if (!document.body.classList.contains('mobile-faux-fullscreen')) {
                updateButtonIcon(false);
                notifyHostFullscreen(false);
            }
        });

        toggleMobileFullscreenFromMessage = async (shouldEnter) => {
            if (typeof shouldEnter === 'undefined') {
                shouldEnter = !document.body.classList.contains('mobile-faux-fullscreen') && !document.fullscreenElement;
            }

            if (isIOS) {
                setFauxFullscreen(shouldEnter);
                return;
            }

            try {
                if (shouldEnter && !document.fullscreenElement) {
                    if (mapLayout.requestFullscreen) {
                        await mapLayout.requestFullscreen();
                    } else if (mapLayout.webkitRequestFullscreen) {
                        await mapLayout.webkitRequestFullscreen();
                    }
                } else if (!shouldEnter && document.fullscreenElement) {
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        await document.webkitExitFullscreen();
                    }
                }
            } catch (error) {
                console.error('Fullscreen error:', error);
            }
        };

        document.body.appendChild(mobileFullscreenBtn);
    }

    if (!toggleMobileFullscreenFromMessage && mapLayout) {
        toggleMobileFullscreenFromMessage = async (shouldEnter) => {
            const desiredState = typeof shouldEnter === 'boolean'
                ? shouldEnter
                : !document.fullscreenElement;

            try {
                if (desiredState && !document.fullscreenElement) {
                    if (mapLayout.requestFullscreen) {
                        await mapLayout.requestFullscreen();
                    } else if (mapLayout.webkitRequestFullscreen) {
                        await mapLayout.webkitRequestFullscreen();
                    }
                } else if (!desiredState && document.fullscreenElement) {
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        await document.webkitExitFullscreen();
                    }
                }
            } catch (error) {
                console.error('Fullscreen error:', error);
            }
        };
    }

    const allowedHostOrigins = [
        'https://www.truesouthcoastalhomes.com',
        'https://truesouthcoastalhomes.com',
        'https://neighborhoods.truesouthcoastalhomes.com'
    ];

    window.addEventListener('message', (event) => {
        if (!event.data || !allowedHostOrigins.includes(event.origin)) {
            return;
        }

        if (!toggleMobileFullscreenFromMessage) {
            return;
        }

        if (event.data.type === 'enterFullscreen') {
            toggleMobileFullscreenFromMessage(true);
        } else if (event.data.type === 'exitFullscreen') {
            toggleMobileFullscreenFromMessage(false);
        }
    });
    
    addMarkers();
    
    // Only setup filters if NOT in single mode.
    const params = getUrlParams();
    if (params.mode !== 'single') {
        setupFilters();
        applyFilters();
    }
}

// Custom Boundary Logic
export function showCustomBoundary(zipCode) {
    if (STATE.customBoundaries.has(zipCode)) return;
    STATE.customBoundaries.add(zipCode);
    
    // Try loading with ZCTA5CE20 (2020 Census) first, then fallback to ZCTA5CE10 (2010 Census)
    STATE.map.data.loadGeoJson(`./assets/data/${zipCode}.geojson`, { idPropertyName: 'ZCTA5CE20' }, function(features) {
        // Style the data layer
        STATE.map.data.setStyle(function(feature) {
            // Check for either 2020 or 2010 property
            const featureZip = feature.getProperty('ZCTA5CE20') || feature.getProperty('ZCTA5CE10');
            if (STATE.customBoundaries.has(featureZip)) {
                const brandColor = getThemeColor('--color-brand');
                return {
                    strokeColor: brandColor,
                    strokeWeight: 2.5,
                    strokeOpacity: 0.85,
                    fillColor: brandColor,
                    fillOpacity: 0.15,
                    clickable: false
                };
            }
            return { visible: false };
        });
    });
}

export function hideCustomBoundary(zipCode) {
    if (!STATE.customBoundaries.has(zipCode)) return;
    
    STATE.customBoundaries.delete(zipCode);
    
    // Remove features with this zip code
    STATE.map.data.forEach(function(feature) {
        const featureZip = feature.getProperty('ZCTA5CE20') || feature.getProperty('ZCTA5CE10');
        if (featureZip === zipCode) {
            STATE.map.data.remove(feature);
        }
    });
}

// Smooth camera transition
export function smoothFlyTo(targetPosition, targetZoom = 15) {
    const map = STATE.map;
    const startPos = map.getCenter();
    const startZoom = map.getZoom();
    const targetLatLng = new google.maps.LatLng(targetPosition);
    
    // Calculate the final offset position BEFORE flight
    // Use geometric calculation for precise centering (90-95% accuracy)
    const offsetPixels = calculateCenteredOffset(targetZoom);
    const offsetTarget = offsetLatLng(targetPosition, offsetPixels, targetZoom);
    
    // Calculate distance (requires geometry library)
    const distance = google.maps.geometry.spherical.computeDistanceBetween(startPos, targetLatLng);
    
    // If close (< 2km), just standard pan/zoom
    if (distance < 2000) {
        map.panTo(offsetTarget);
        // Simple zoom animation
        const zoomDiff = targetZoom - startZoom;
        if (Math.abs(zoomDiff) > 0.1) {
            let steps = 20;
            let currentStep = 0;
            const zoomInterval = setInterval(() => {
                currentStep++;
                const progress = currentStep / steps;
                // EaseOutQuad
                const ease = 1 - (1 - progress) * (1 - progress);
                const newZoom = startZoom + (zoomDiff * ease);
                map.moveCamera({ zoom: newZoom });
                if (currentStep >= steps) clearInterval(zoomInterval);
            }, 16);
        }
        return;
    }

    // Long distance flight animation - fly directly to offset position
    const startTime = performance.now();
    const duration = CONFIG.map.flyToDuration;
    const minZoom = 11; // Cruising altitude
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // EaseInOutCubic for position
        const ease = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // Interpolate Position directly to offset target
        const curLat = startPos.lat() + (offsetTarget.lat - startPos.lat()) * ease;
        const curLng = startPos.lng() + (offsetTarget.lng - startPos.lng()) * ease;
        
        // Interpolate Zoom (Parabolic arc)
        let curZoom;
        if (progress < 0.5) {
            // 0% to 50%: Zoom out from startZoom to minZoom
            const zoomProgress = progress * 2; // 0 to 1
            // Ease out to slow down as we reach peak
            const zoomEase = 1 - Math.pow(1 - zoomProgress, 2); 
            curZoom = startZoom + (minZoom - startZoom) * zoomEase;
        } else {
            // 50% to 100%: Zoom in from minZoom to targetZoom
            const zoomProgress = (progress - 0.5) * 2; // 0 to 1
            // Ease in to speed up as we land
            const zoomEase = zoomProgress * zoomProgress;
            curZoom = minZoom + (targetZoom - minZoom) * zoomEase;
        }
        
        map.moveCamera({
            center: { lat: curLat, lng: curLng },
            zoom: curZoom
        });
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

/**
 * Calculates precise offset for centering marker + info window visually.
 * Uses geometric calculation based on actual viewport and element dimensions.
 * Accuracy: 90-95% across all viewports and zoom levels.
 *
 * @param {number} zoomLevel - Target zoom level (unused, kept for API compatibility)
 * @returns {number} Pixel offset to center visual combo at viewport center
 */
export function calculateCenteredOffset(zoomLevel) {
    const params = getUrlParams();

    // URL overrides take precedence (for debugging/testing)
    if (params.offsetPx != null && !isNaN(params.offsetPx)) {
        return params.offsetPx;
    }
    if (params.offsetPct != null && !isNaN(params.offsetPct)) {
        const viewportHeight = Math.max(320, window.innerHeight);
        return clamp((viewportHeight * params.offsetPct) / 100, 100, 300);
    }

    // Viewport-aware card height estimation
    const w = window.innerWidth;
    let cardHeight;
    if (w < 640) {
        cardHeight = 320; // Mobile: taller cards (more stacking)
    } else if (w < 1024) {
        cardHeight = 300; // Tablet: medium cards
    } else {
        cardHeight = 280; // Desktop: compact cards
    }

    // Known marker dimensions
    const markerHeight = 40; // From CSS (.ripple-marker)

    // Geometric calculation for visual centering:
    // Card appears ABOVE marker
    // Total visual height = cardHeight + markerHeight
    // Visual center = cardHeight/2 - markerHeight/2 offset from marker
    //
    // Example: 300px card + 40px marker
    // Total: 340px
    // Visual center: 150px - 20px = 130px above marker center
    const offset = (cardHeight / 2) - (markerHeight / 2);

    // Small comfort buffer (prevents card from touching viewport edge)
    const buffer = 15;

    return Math.round(offset + buffer);
}

// Legacy heuristic offset computation (kept for reference/fallback)
// Use calculateCenteredOffset() instead for better accuracy
export function computeOffsetPx(zoomLevel) {
    return calculateCenteredOffset(zoomLevel);
}

// Helper function to offset lat/lng by pixels
export function offsetLatLng(latLng, offsetPixels, zoomLevel) {
    const scale = Math.pow(2, zoomLevel || STATE.map.getZoom());
    const worldCoordinate = STATE.map.getProjection().fromLatLngToPoint(new google.maps.LatLng(latLng));
    
    const pixelOffset = new google.maps.Point(
        0,
        -offsetPixels / scale  // Negative to shift map UP (marker appears lower)
    );
    
    const newWorldCoordinate = new google.maps.Point(
        worldCoordinate.x,
        worldCoordinate.y + pixelOffset.y
    );
    
    const newLatLng = STATE.map.getProjection().fromPointToLatLng(newWorldCoordinate);
    // Preserve original longitude to avoid subtle horizontal drift from projection rounding
    return { lat: newLatLng.lat(), lng: latLng.lng };
}

/**
 * Fits map viewport to show all neighborhoods optimally.
 * Automatically calculates center point and zoom level based on bounds.
 * @param {Array} neighborhoods - Array of neighborhood objects with position {lat, lng}
 * @param {number} padding - Optional padding in pixels (default: 50)
 */
export function fitBoundsToNeighborhoods(neighborhoods, padding = 50) {

    if (!neighborhoods || neighborhoods.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    // Extend bounds to include all neighborhoods
    neighborhoods.forEach(neighborhood => {
        bounds.extend(new google.maps.LatLng(
            neighborhood.position.lat,
            neighborhood.position.lng
        ));
    });

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    console.log('Calculated bounds - NE:', ne.lat(), ne.lng(), 'SW:', sw.lat(), sw.lng());
    console.log('Current map center before fitBounds:', STATE.map.getCenter().lat(), STATE.map.getCenter().lng());
    console.log('Current zoom before fitBounds:', STATE.map.getZoom());

    // Fit map to bounds with padding
    STATE.map.fitBounds(bounds, padding);

    console.log('fitBounds called');
}

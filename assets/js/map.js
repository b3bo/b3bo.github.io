/**
 * @file map.js
 * @description Core map initialization and camera movement logic.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { CONFIG } from './config.js';
import { STATE } from './state.js';
import { getUrlParams, clamp, getThemeColor } from './utils.js';
import { addMarkers, showInfoWindow } from './markers.js';
import { setupFilters, applyFilters } from './filters.js';
import { loadNeighborhoods, toSlug } from './data.js'; // Wait, loadNeighborhoods is in data.js, toSlug in utils.js

// Need to fix imports in map.js as I write it.
// toSlug is in utils.js
// loadNeighborhoods is in data.js

// Re-importing correctly
import { toSlug } from './utils.js';

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

    // Log initial zoom level
    let lastZoom = STATE.map.getZoom();
    console.log('Initial Zoom level:', lastZoom);

    // Only log zoom changes when the map stops moving (idle) to avoid spamming during animation
    STATE.map.addListener('idle', () => {
        const currentZoom = STATE.map.getZoom();
        if (currentZoom !== lastZoom) {
            console.log('Zoom level changed:', currentZoom);
            lastZoom = currentZoom;
        }
    });

    // Disable Google Maps default auto-pan when info windows open
    STATE.infoWindow = new google.maps.InfoWindow({ maxWidth: 280, disableAutoPan: true });
    STATE.hoverInfoWindow = new google.maps.InfoWindow({ maxWidth: 280, disableAutoPan: true });
    
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
    const offsetPixels = computeOffsetPx(targetZoom);
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

// Heuristic offset computation (scaled-from-baseline)
export function computeOffsetPx(zoomLevel) {
    const params = getUrlParams();
    // URL overrides take precedence
    if (params.offsetPx != null && !isNaN(params.offsetPx)) {
        return params.offsetPx;
    }
    if (params.offsetPct != null && !isNaN(params.offsetPct)) {
        const dvh = Math.max(320, window.innerHeight); // dvh approx
        return clamp((dvh * params.offsetPct) / 100, 120, 250);
    }

    const baseOffset = 150; // tuned baseline for ~280px card at zoom 14–15

    // Estimated card height by breakpoint
    const w = window.innerWidth;
    let estimatedCardHeightPx = 280;
    if (w < 640) {
        estimatedCardHeightPx = 340;
    } else if (w < 1024) {
        estimatedCardHeightPx = 320;
    }
    const cardScale = estimatedCardHeightPx / 280;

    // Viewport scaling using dvh
    const dvh = Math.max(320, window.innerHeight);
    const isIframeSingleMode = params.mode === 'single';
    const viewportHeightPx = dvh; 
    const viewportScale = clamp(dvh / 800, 0.85, 1.20);

    // Marker padding
    const markerPadding = 30;

    // Zoom sensitivity
    const zoom = zoomLevel || STATE.map.getZoom() || 14;
    const zoomReductionSteps = clamp(15 - zoom, 0, 4); 
    const zoomFactor = 1 - zoomReductionSteps * 0.05; 

    // If in iframe single mode, scale offset proportionally
    let iframeScaleBoost = 1;
    if (isIframeSingleMode) {
        iframeScaleBoost = clamp(viewportHeightPx / 700, 0.95, 1.30);
    }

    let offsetPx = baseOffset * cardScale * viewportScale * zoomFactor * iframeScaleBoost + markerPadding;

    // Add a small fixed boost in single/iframe mode
    if (isIframeSingleMode) {
        offsetPx += 24; 
    }

    // Clamp to sane bounds
    offsetPx = clamp(offsetPx, 120, 250);
    return offsetPx;
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

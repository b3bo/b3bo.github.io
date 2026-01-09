/**
 * @file map/centering.js
 * @description Map centering and offset calculations using Mercator projection.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { createAnimation, Easing } from '../utils.js';
import { eventBus, Events } from '../core/eventBus.js';

// Track active fly animation for cleanup
let activeFlyAnimation = null;

// ============================================
// CENTERING CONSTANTS - SINGLE SOURCE OF TRUTH
// ============================================
export const TAIL_HEIGHT = 78; // Measured tail height (card tip to marker)
export const MARKER_RADIUS = 10; // Visual marker dot radius

// Card height estimates for Phase 1 pre-offset
// These are tuned to minimize visible shift before Phase 2 measurement
// Values represent typical rendered heights at different viewport widths
export const CARD_HEIGHT_ESTIMATES = {
    MINI: 150, // Mini info window (nav page hover-to-fly)
    FULL_MOBILE: 450, // < 640px: Mobile, taller due to single-column layout
    FULL_TABLET: 380, // 640-1024px: Tablet, medium height
    FULL_DESKTOP: 295 // >= 1024px: Desktop, compact 2-column layout
};

// Area markers have additional content rows (+70px)
export const AREA_MARKER_HEIGHT_DELTA = 70;

/**
 * Convert latitude to Mercator Y coordinate.
 * Helper function for accurate positioning calculations.
 *
 * @param {number} lat - Latitude in degrees
 * @returns {number} Mercator Y coordinate
 */
export function latToMercatorY(lat) {
    const latRad = (lat * Math.PI) / 180;
    return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

/**
 * Convert pixel offset to latitude offset using Mercator projection.
 * Used for pre-calculating map positions before Google Maps is loaded.
 *
 * @param {number} lat - Latitude
 * @param {number} offsetPixels - Pixel offset (positive = south)
 * @param {number} zoom - Zoom level
 * @returns {number} New latitude
 */
export function preCalculateOffsetLat(lat, offsetPixels, zoom) {
    const TILE_SIZE = 256;
    const scale = Math.pow(2, zoom);
    const mercY = latToMercatorY(lat);
    const pixelsPerRadian = (TILE_SIZE * scale) / (2 * Math.PI);
    const newMercY = mercY + offsetPixels / pixelsPerRadian;
    const newLatRad = 2 * Math.atan(Math.exp(newMercY)) - Math.PI / 2;
    return (newLatRad * 180) / Math.PI;
}

/**
 * Compute pixel offset for centering card+marker combo.
 * Accounts for viewport size and card height variations.
 *
 * @param {number} zoomLevel - Current zoom level (unused, kept for API consistency)
 * @param {boolean} isAreaMarker - Whether this is an area marker (taller card)
 * @param {boolean} isMiniCard - Whether this is a mini info window (smaller card)
 * @returns {number} Pixel offset for panBy
 */
export function computeOffsetPx(zoomLevel, isAreaMarker = false, isMiniCard = false) {
    const mapDiv = document.getElementById('map');
    const w = mapDiv?.offsetWidth || window.innerWidth;
    const dvh = mapDiv?.offsetHeight || window.innerHeight;

    // Card height estimates - tuned to avoid visible post-flight shifts
    // Content varies (1-line vs 2-line names), so estimates are approximate
    // Goal: Get close enough that no visible correction is needed
    let baseCardHeight;
    if (isMiniCard) {
        // Mini info window - get close, then applyMicroCenteringCorrection for 1-2px accuracy
        baseCardHeight = CARD_HEIGHT_ESTIMATES.MINI;
        console.log('[computeOffsetPx] Using MINI card height estimate:', baseCardHeight);
    } else {
        // Full info window - varies by viewport and content
        baseCardHeight =
            w < 640
                ? CARD_HEIGHT_ESTIMATES.FULL_MOBILE
                : w < 1024
                  ? CARD_HEIGHT_ESTIMATES.FULL_TABLET
                  : CARD_HEIGHT_ESTIMATES.FULL_DESKTOP;
        console.log('[computeOffsetPx] Using FULL card height estimate:', baseCardHeight, '(viewport:', w, 'px)');
    }
    const cardHeight = isAreaMarker ? baseCardHeight + AREA_MARKER_HEIGHT_DELTA : baseCardHeight;
    const comboHeight = cardHeight + TAIL_HEIGHT + MARKER_RADIUS;
    const canCenter = dvh >= 450 && comboHeight < dvh - 40;

    if (canCenter) {
        return Math.round((cardHeight + TAIL_HEIGHT - MARKER_RADIUS) / 2);
    } else {
        const markerY = 20 + cardHeight + TAIL_HEIGHT + MARKER_RADIUS;
        return Math.round(Math.max(0, markerY - dvh / 2));
    }
}

/**
 * Calculate initial offset (alias for computeOffsetPx).
 *
 * @param {number} zoomLevel - Current zoom level
 * @param {boolean} isAreaMarker - Whether this is an area marker
 * @returns {number} Pixel offset
 */
export function calculateInitialOffset(zoomLevel, isAreaMarker = false) {
    return computeOffsetPx(zoomLevel, isAreaMarker);
}

/**
 * Calculate centered offset accounting for disclaimer bar.
 *
 * @param {number} zoomLevel - Current map zoom
 * @param {number} disclaimerHeight - Bottom bar height (0 for single mode, 40 for full mode)
 * @param {boolean} isMiniCard - Whether this is a mini info window (smaller card)
 * @returns {number} Pixel offset for panBy
 */
export function calculateCenteredOffset(zoomLevel, disclaimerHeight = 0, isMiniCard = false) {
    const baseOffset = computeOffsetPx(zoomLevel, false, isMiniCard);
    return Math.round(baseOffset + disclaimerHeight / 2);
}

/**
 * Convert a lat/lng position by a pixel offset using map projection.
 * Requires Google Maps to be loaded.
 *
 * @param {Object} latLng - {lat, lng} position
 * @param {number} offsetPixels - Pixel offset (positive = south)
 * @param {number} zoomLevel - Zoom level for scale calculation
 * @returns {Object} {lat, lng} New position
 */
export function offsetLatLng(latLng, offsetPixels, zoomLevel) {
    const map = window.map;
    if (!map || !map.getProjection()) {
        console.warn('offsetLatLng called before map projection ready');
        return latLng;
    }

    const scale = Math.pow(2, zoomLevel || map.getZoom());
    const worldCoordinate = map.getProjection().fromLatLngToPoint(new google.maps.LatLng(latLng));
    const pixelOffset = new google.maps.Point(0, -offsetPixels / scale);
    const newWorldCoordinate = new google.maps.Point(worldCoordinate.x, worldCoordinate.y + pixelOffset.y);
    const newLatLng = map.getProjection().fromPointToLatLng(newWorldCoordinate);

    return { lat: newLatLng.lat(), lng: latLng.lng };
}

/**
 * Get the height of the currently open info window card.
 *
 * @returns {number} Height in pixels, or 0 if not found
 */
export function getOpenInfoWindowCardHeightPx() {
    const iw = document.querySelector('.gm-style-iw-c');
    if (iw) return iw.getBoundingClientRect().height;
    const fallback = document.querySelector('.info-window');
    return fallback ? fallback.getBoundingClientRect().height : 0;
}

/**
 * Apply centering correction from rendered card with RAF retry logic.
 * Unified function that combines RAF retry with actual height measurement.
 *
 * @param {Object} markerLatLng - Google Maps LatLng or {lat, lng} of the marker
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum RAF retry attempts (default 30)
 * @param {boolean} options.usePaddingMethod - Use padding-based correction vs. full recalc (default false)
 * @param {number} options.maxCorrection - Maximum pixel correction for padding method (default 30)
 * @param {Function} options.onComplete - Callback when centering applied
 * @param {number} options.attempt - Internal: current retry attempt
 * @returns {boolean|void} True if correction was applied (padding method only)
 */
export function applyCenteringFromRenderedCard(markerLatLng, options = {}) {
    const {
        maxRetries = 30,
        usePaddingMethod = false,
        maxCorrection = 30,
        onComplete = null,
        attempt = 0
    } = options;

    const map = window.map;
    if (!map || !markerLatLng) return false;

    const mapDiv = document.getElementById('map');
    if (!mapDiv) return false;

    // Wait for InfoWindow DOM to render
    const iwContainer = document.querySelector('.gm-style-iw-c');
    if (!iwContainer) {
        if (attempt < maxRetries) {
            requestAnimationFrame(() =>
                applyCenteringFromRenderedCard(markerLatLng, { ...options, attempt: attempt + 1 })
            );
        }
        return false;
    }

    if (usePaddingMethod) {
        // Method 1: Measure padding difference and apply micro-correction
        const infoWindow = document.querySelector('.gm-style-iw');
        if (!infoWindow) return false;

        const mapRect = mapDiv.getBoundingClientRect();
        const cardRect = infoWindow.getBoundingClientRect();
        const viewportHeight = mapRect.height;
        const cardTop = cardRect.top - mapRect.top;

        // Get marker Y position from DOM or calculate
        let markerBottom;
        const markerRadius = MARKER_RADIUS;
        const activeMarker = window.activeMarker;

        if (activeMarker && activeMarker.content) {
            const markerRect = activeMarker.content.getBoundingClientRect();
            const markerCenterY = markerRect.top + markerRect.height / 2 - mapRect.top;
            markerBottom = markerCenterY + markerRadius;
        } else {
            const bounds = map.getBounds();
            if (!bounds) return false;
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const markerLat = typeof markerLatLng.lat === 'function' ? markerLatLng.lat() : markerLatLng.lat;
            const neMercY = latToMercatorY(ne.lat());
            const swMercY = latToMercatorY(sw.lat());
            const markerMercY = latToMercatorY(markerLat);
            const mercRange = neMercY - swMercY;
            const markerY = ((neMercY - markerMercY) / mercRange) * viewportHeight;
            markerBottom = markerY + markerRadius;
        }

        const topPadding = cardTop;
        const bottomPadding = viewportHeight - markerBottom;
        const paddingDiff = topPadding - bottomPadding;

        if (Math.abs(paddingDiff) < 5) {
            if (onComplete) onComplete();
            return false;
        }

        const correction = Math.max(-maxCorrection, Math.min(maxCorrection, -paddingDiff / 2));
        const zoom = map.getZoom();
        const markerLat = typeof markerLatLng.lat === 'function' ? markerLatLng.lat() : markerLatLng.lat;
        const correctedLat = preCalculateOffsetLat(markerLat, correction, zoom);
        const center = map.getCenter();
        const newCenterLat = center.lat() + (correctedLat - markerLat);
        map.setCenter({ lat: newCenterLat, lng: center.lng() });

        console.log(`Centering micro-correction: ${Math.round(paddingDiff)}px diff, applied ${Math.round(correction)}px`);
        if (onComplete) onComplete();
        return true;
    } else {
        // Method 2: Recalculate full offset from actual rendered card height
        const cardH = iwContainer.getBoundingClientRect().height;
        const mapEl = mapDiv || map.getDiv();
        const dvh = mapEl?.getBoundingClientRect?.().height || mapEl?.offsetHeight || window.innerHeight;
        const comboH = cardH + TAIL_HEIGHT + MARKER_RADIUS;
        const canCenter = dvh >= 450 && comboH < dvh - 40;

        const actualOffsetPx = canCenter
            ? Math.round((cardH + TAIL_HEIGHT - MARKER_RADIUS) / 2)
            : Math.round(Math.max(0, 20 + cardH + TAIL_HEIGHT + MARKER_RADIUS - dvh / 2));

        const zoom = map.getZoom();
        const markerLat = typeof markerLatLng.lat === 'function' ? markerLatLng.lat() : markerLatLng.lat;
        const markerLng = typeof markerLatLng.lng === 'function' ? markerLatLng.lng() : markerLatLng.lng;
        const adjustedLat = preCalculateOffsetLat(markerLat, actualOffsetPx, zoom);
        map.setCenter({ lat: adjustedLat, lng: markerLng });

        console.log('Centering: applied with actual card height, offset:', actualOffsetPx, 'px');
        if (onComplete) onComplete();
        return true;
    }
}

/**
 * Measure actual centering padding and apply micro-correction if needed.
 * Called after info window renders to perfect the centering.
 *
 * @deprecated Use applyCenteringFromRenderedCard() with usePaddingMethod: true instead
 * @param {Object} markerLatLng - Google Maps LatLng of the marker
 * @param {number} maxCorrection - Maximum correction in pixels (default 30)
 * @returns {boolean} True if correction was applied
 */
export function applyMicroCenteringCorrection(markerLatLng, maxCorrection = 30) {
    // Backward compatibility wrapper
    return applyCenteringFromRenderedCard(markerLatLng, { usePaddingMethod: true, maxCorrection });
}

/**
 * Log centering diagnostics for manual measurement comparison.
 * Call after info window renders to see actual spacing values.
 *
 * @param {Object} markerLatLng - Google Maps LatLng or {lat, lng} of the marker
 */
export function logCenteringDiagnostics(markerLatLng) {
    const map = window.map;
    if (!map || !markerLatLng) {
        console.log('=== CENTERING DIAGNOSTICS: No map or marker ===');
        return;
    }

    const mapDiv = document.getElementById('map');
    if (!mapDiv) {
        console.log('=== CENTERING DIAGNOSTICS: No map div ===');
        return;
    }

    const infoWindow = document.querySelector('.gm-style-iw');
    if (!infoWindow) {
        console.log('=== CENTERING DIAGNOSTICS: No info window found ===');
        return;
    }

    const mapRect = mapDiv.getBoundingClientRect();
    const cardRect = infoWindow.getBoundingClientRect();
    const viewportHeight = mapRect.height;

    // Card measurements
    const cardTop = cardRect.top - mapRect.top;
    const cardHeight = cardRect.height;
    const cardBottom = cardTop + cardHeight;

    // Get marker Y position from DOM element (accurate) or fall back to lat/lng calculation
    let markerY, markerBottom;
    const markerRadius = 10; // Visual dot radius

    // Try to get actual marker DOM position (most accurate)
    const activeMarker = window.activeMarker;
    if (activeMarker && activeMarker.content) {
        const markerRect = activeMarker.content.getBoundingClientRect();
        // SVG is 44x44 when active, dot center is at middle
        const markerCenterY = markerRect.top + markerRect.height / 2 - mapRect.top;
        markerY = markerCenterY;
        markerBottom = markerCenterY + markerRadius;
        console.log(
            `(Using DOM position: marker element at ${Math.round(markerRect.top - mapRect.top)}px, center at ${Math.round(markerCenterY)}px)`
        );
    } else {
        // Fallback: calculate from lat/lng using Mercator projection
        const bounds = map.getBounds();
        if (!bounds) {
            console.log('=== CENTERING DIAGNOSTICS: No bounds ===');
            return;
        }
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const markerLat = typeof markerLatLng.lat === 'function' ? markerLatLng.lat() : markerLatLng.lat;

        // Use Mercator projection for accurate Y position calculation
        const neMercY = latToMercatorY(ne.lat());
        const swMercY = latToMercatorY(sw.lat());
        const markerMercY = latToMercatorY(markerLat);
        const mercRange = neMercY - swMercY;
        markerY = ((neMercY - markerMercY) / mercRange) * viewportHeight;
        markerBottom = markerY + markerRadius;
        console.log('(Using lat/lng calculation with Mercator projection)');
    }

    // Calculate padding
    const topPadding = cardTop;
    const bottomPadding = viewportHeight - markerBottom;
    const paddingDiff = topPadding - bottomPadding;

    console.log('=== CENTERING DIAGNOSTICS ===');
    console.log(`Viewport height: ${Math.round(viewportHeight)}px`);
    console.log(`Card top: ${Math.round(cardTop)}px`);
    console.log(`Card height: ${Math.round(cardHeight)}px (bottom at ${Math.round(cardBottom)}px)`);
    console.log(`Marker Y: ${Math.round(markerY)}px (bottom at ${Math.round(markerBottom)}px)`);
    console.log('---');
    console.log(`Space ABOVE card: ${Math.round(topPadding)}px`);
    console.log(`Space BELOW marker: ${Math.round(bottomPadding)}px`);
    console.log(
        `Difference: ${Math.round(paddingDiff)}px (${paddingDiff < 0 ? 'more space below' : paddingDiff > 0 ? 'more space above' : 'centered'})`
    );
    console.log('=============================');

    // Send diagnostic to parent window (for iframe-test.html)
    if (window.parent && window.parent !== window) {
        const absDiff = Math.abs(Math.round(paddingDiff));
        const status = absDiff <= 5 ? 'good' : absDiff <= 20 ? 'warn' : 'bad';
        const direction = paddingDiff < 0 ? 'more space below' : paddingDiff > 0 ? 'more space above' : 'centered';
        window.parent.postMessage(
            {
                type: 'centeringDiagnostic',
                difference: `Difference: ${Math.round(paddingDiff)}px (${direction})`,
                status: status
            },
            '*'
        );
    }
}

/**
 * Smooth animated flight to a target position with zoom arc.
 * Cancels any in-progress animation.
 *
 * @param {Object} targetPosition - {lat, lng} target
 * @param {number} targetZoom - Target zoom level
 * @param {boolean} skipOffset - Skip offset calculation (for test page where no info window opens)
 * @param {boolean} isMiniCard - Use mini info window offset (smaller card)
 */
export function smoothFlyTo(targetPosition, targetZoom, skipOffset = false, isMiniCard = false) {
    const map = window.map;
    if (!map) {
        console.error('[smoothFlyTo] No map available');
        return;
    }

    console.log('[smoothFlyTo] Starting flight to:', targetPosition, 'zoom:', targetZoom);

    // Cancel any in-progress fly animation
    if (activeFlyAnimation) {
        console.log('[smoothFlyTo] Canceling previous animation');
        activeFlyAnimation.cancel();
        activeFlyAnimation = null;
    }

    // Use CONFIG for default zoom
    const cfg = window.CONFIG?.map || {};
    if (targetZoom === undefined) {
        targetZoom = cfg.defaultZoom || 14;
    }

    const startPos = map.getCenter();
    const startZoom = map.getZoom();
    const targetLatLng = new google.maps.LatLng(targetPosition);

    console.log('[smoothFlyTo] Start:', { lat: startPos.lat(), lng: startPos.lng(), zoom: startZoom });
    console.log('[smoothFlyTo] Target:', { lat: targetPosition.lat, lng: targetPosition.lng, zoom: targetZoom });
    console.log('[smoothFlyTo] Mode:', window.isSingleMode ? 'SINGLE' : 'FULL', 'skipOffset:', skipOffset, 'isMiniCard:', isMiniCard);

    // Calculate offset for visual centering (marker + info card)
    // Single mode has no disclaimer bar (0), full mode has 40px
    const disclaimerHeight = window.isSingleMode ? 0 : 40;

    // Skip offset for test page where no info window opens at target
    let offsetTarget, offsetPixels;
    if (skipOffset) {
        offsetTarget = targetPosition;
        offsetPixels = 0;
        console.log('[smoothFlyTo] Skipping offset, flying directly to target');
    } else {
        offsetPixels = calculateCenteredOffset(targetZoom, disclaimerHeight, isMiniCard);
        offsetTarget = offsetLatLng(targetPosition, offsetPixels, targetZoom);

        console.log('[smoothFlyTo] Offset calculation:', {
            disclaimerHeight,
            isMiniCard,
            offsetPixels,
            offsetTarget: { lat: offsetTarget.lat.toFixed(6), lng: offsetTarget.lng.toFixed(6) }
        });
    }

    // Calculate distance from marker-to-marker
    const startOffsetPixels = skipOffset ? 0 : calculateCenteredOffset(startZoom, disclaimerHeight, isMiniCard);
    const startMarkerPos = skipOffset
        ? { lat: startPos.lat(), lng: startPos.lng() }
        : offsetLatLng({ lat: startPos.lat(), lng: startPos.lng() }, -startOffsetPixels, startZoom);
    const startMarkerLatLng = new google.maps.LatLng(startMarkerPos);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(startMarkerLatLng, targetLatLng);

    // Get flight settings from CONFIG
    const arc = cfg.flightZoomArc || {};
    const dur = cfg.flightDuration || {};

    // Calculate duration based on distance
    let duration;
    if (distance < 1000) {
        duration = dur.micro || 800;
    } else if (distance < 2000) {
        duration = dur.short || 1200;
    } else {
        duration = dur.medium || 2000;
    }

    // Calculate min zoom for arc
    let minZoom, jumpType;
    if (distance < (arc.micro?.maxDistance || 2000)) {
        minZoom = arc.micro?.minZoom || 13;
        jumpType = 'micro';
    } else if (distance < (arc.short?.maxDistance || 5000)) {
        minZoom = arc.short?.minZoom || 13;
        jumpType = 'short';
    } else if (distance < (arc.medium?.maxDistance || 20000)) {
        minZoom = arc.medium?.minZoom || 12;
        jumpType = 'med';
    } else {
        minZoom = arc.long?.minZoom || 10;
        jumpType = 'long';
    }

    // Smart arc: only zoom out when starting from a zoomed-in view
    if (startZoom >= targetZoom) {
        minZoom = Math.min(minZoom, startZoom - 1, targetZoom - 1);
    } else {
        minZoom = startZoom;
    }

    console.log(`Flight: ${jumpType} | ${(distance / 1000).toFixed(2)}km | minZoom=${minZoom}`);

    eventBus.emit(Events.FLY_TO_STARTED, { targetPosition, targetZoom });

    const startTime = performance.now();

    activeFlyAnimation = createAnimation(currentTime => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // EaseInOutCubic
        const ease = Easing.easeInOutCubic(progress);

        // Interpolate position to offset target
        const curLat = startPos.lat() + (offsetTarget.lat - startPos.lat()) * ease;
        const curLng = startPos.lng() + (offsetTarget.lng - startPos.lng()) * ease;

        // Parabolic zoom arc
        let curZoom;
        if (progress < 0.5) {
            const zoomProgress = progress * 2;
            const zoomEase = 1 - Math.pow(1 - zoomProgress, 2);
            curZoom = startZoom + (minZoom - startZoom) * zoomEase;
        } else {
            const zoomProgress = (progress - 0.5) * 2;
            const zoomEase = zoomProgress * zoomProgress;
            curZoom = minZoom + (targetZoom - minZoom) * zoomEase;
        }

        map.moveCamera({
            center: { lat: curLat, lng: curLng },
            zoom: curZoom
        });

        if (progress >= 1) {
            activeFlyAnimation = null;
            eventBus.emit(Events.FLY_TO_COMPLETED, { targetPosition, targetZoom });
            return false; // Stop animation
        }

        return true; // Continue animation
    });
}

/**
 * Cancel any active fly animation.
 */
export function cancelFlyAnimation() {
    if (activeFlyAnimation) {
        activeFlyAnimation.cancel();
        activeFlyAnimation = null;
        eventBus.emit(Events.ANIMATION_CANCELLED, { type: 'flyTo' });
    }
}

// Expose on window for legacy code during transition
if (typeof window !== 'undefined') {
    // Constants - SINGLE SOURCE OF TRUTH
    window.TAIL_HEIGHT = TAIL_HEIGHT;
    window.MARKER_RADIUS = MARKER_RADIUS;
    window.CARD_HEIGHT_ESTIMATES = CARD_HEIGHT_ESTIMATES;
    window.AREA_MARKER_HEIGHT_DELTA = AREA_MARKER_HEIGHT_DELTA;
    // Functions
    window.smoothFlyTo = smoothFlyTo;
    window.computeOffsetPx = computeOffsetPx;
    window.calculateCenteredOffset = calculateCenteredOffset;
    window.offsetLatLng = offsetLatLng;
    window.preCalculateOffsetLat = preCalculateOffsetLat;
    window.latToMercatorY = latToMercatorY;
    window.getOpenInfoWindowCardHeightPx = getOpenInfoWindowCardHeightPx;
    window.applyCenteringFromRenderedCard = applyCenteringFromRenderedCard;
    window.applyMicroCenteringCorrection = applyMicroCenteringCorrection;
    window.logCenteringDiagnostics = logCenteringDiagnostics;
}

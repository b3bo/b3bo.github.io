/**
 * @file animations/index.js
 * @description Animation utilities with proper RAF cleanup.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { createAnimation, Easing } from '../utils.js';
import { eventBus, Events } from '../core/eventBus.js';

// Track active animations for cleanup
let activeCountAnimation = null;
let activeFlyAnimation = null;

// Store last displayed count for smooth transitions
let lastDisplayedCount = null;

/**
 * Animate a count element from current to target value.
 * Cancels any in-progress animation on the same element.
 *
 * @param {HTMLElement} element - Container element with .count-number span
 * @param {number} targetCount - Target number to animate to
 * @param {number} duration - Animation duration in ms (default 700)
 */
export function animateCount(element, targetCount, duration = 700) {
    // Cancel any pending animation
    if (activeCountAnimation) {
        activeCountAnimation.cancel();
        activeCountAnimation = null;
    }

    // Get current displayed value
    const countSpan = element.querySelector('.count-number');
    const currentDisplayed = countSpan ? parseInt(countSpan.textContent, 10) : null;
    const start = (currentDisplayed !== null && !isNaN(currentDisplayed))
        ? currentDisplayed
        : (lastDisplayedCount !== null ? lastDisplayedCount : targetCount);
    const diff = targetCount - start;

    // Skip animation if no change or first load
    if (diff === 0 || lastDisplayedCount === null) {
        lastDisplayedCount = targetCount;
        if (countSpan) countSpan.textContent = targetCount;
        return;
    }

    const startTime = performance.now();

    activeCountAnimation = createAnimation((currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const eased = Easing.easeOutCubic(progress);
        const current = Math.round(start + diff * eased);

        // Update just the number part
        if (countSpan) {
            countSpan.textContent = current;
        }

        if (progress >= 1) {
            activeCountAnimation = null;
            lastDisplayedCount = targetCount;
            return false; // Stop animation
        }

        return true; // Continue animation
    });
}

/**
 * Cancel all active animations (for cleanup)
 */
export function cancelAllAnimations() {
    if (activeCountAnimation) {
        activeCountAnimation.cancel();
        activeCountAnimation = null;
    }
    if (activeFlyAnimation) {
        activeFlyAnimation.cancel();
        activeFlyAnimation = null;
    }
}

/**
 * Get the last displayed count (for state recovery)
 */
export function getLastDisplayedCount() {
    return lastDisplayedCount;
}

/**
 * Reset the last displayed count (e.g., on data reload)
 */
export function resetLastDisplayedCount() {
    lastDisplayedCount = null;
}

// Expose on window for legacy code during transition
if (typeof window !== 'undefined') {
    window.animateCount = animateCount;
    window.cancelAllAnimations = cancelAllAnimations;
}

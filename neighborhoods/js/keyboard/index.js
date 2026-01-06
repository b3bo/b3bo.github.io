/**
 * @file keyboard/index.js
 * @description WCAG-compliant keyboard navigation and focus management.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { eventBus, Events } from '../core/eventBus.js';

// ==========================================
// FOCUS MANAGEMENT
// ==========================================

/**
 * Get all focusable elements within a container.
 * Filters out hidden, disabled, and off-screen elements.
 * @param {HTMLElement} container - Container to search within
 * @returns {HTMLElement[]} Array of focusable elements
 */
export function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            'button:not([disabled]):not([tabindex="-1"]), ' +
                '[href]:not([tabindex="-1"]), ' +
                'input:not([disabled]):not([tabindex="-1"]), ' +
                'select:not([disabled]):not([tabindex="-1"]), ' +
                'textarea:not([disabled]):not([tabindex="-1"]), ' +
                '[tabindex="0"]'
        )
    ).filter(el => {
        // Must be visible
        if (el.offsetParent === null || getComputedStyle(el).visibility === 'hidden') return false;
        // Exclude elements inside translated-off panels (off-screen)
        const translatedPanel = el.closest('.translate-x-full');
        if (translatedPanel) return false;
        return true;
    });
}

/**
 * Handle Tab key trapping within sidebar.
 * Wraps focus at boundaries for WCAG compliance.
 * @param {KeyboardEvent} e - Keyboard event
 * @param {HTMLElement} sidebar - Sidebar container
 */
export function handleTabTrap(e, sidebar) {
    const drawerToggle = document.getElementById('drawer-toggle');
    if (!sidebar || !drawerToggle || !drawerToggle.checked) return;

    const focusable = getFocusableElements(sidebar);
    if (focusable.length === 0) {
        e.preventDefault();
        return;
    }

    // Always prevent default - we manage Tab navigation manually
    e.preventDefault();

    const current = document.activeElement;
    let currentIndex = focusable.indexOf(current);

    // If current element not in our list, start from appropriate end
    if (currentIndex === -1) {
        currentIndex = e.shiftKey ? 0 : focusable.length - 1;
    }

    // Calculate next index with wrap-around
    let nextIndex;
    if (e.shiftKey) {
        nextIndex = currentIndex === 0 ? focusable.length - 1 : currentIndex - 1;
    } else {
        nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
    }

    focusable[nextIndex].focus();
}

// ==========================================
// ESCAPE KEY HANDLER
// ==========================================

/**
 * Handle Escape key - close dropdowns, panels, info windows.
 */
export function handleEscapeKey() {
    const searchDropdown = document.getElementById('search-dropdown');
    const sortMenu = document.getElementById('sort-menu');
    const mainMenu = document.getElementById('main-menu');

    // Close dropdowns first
    if (searchDropdown) searchDropdown.classList.add('hidden');
    if (sortMenu) sortMenu.classList.add('hidden');

    // Close info window
    if (window.infoWindow && window.infoWindow.getMap()) {
        window.infoWindow.close();
    }

    // Close any open sliding panel
    const openPanel = document.querySelector('.sliding-panel:not(.translate-x-full)');
    if (openPanel) {
        openPanel.classList.add('translate-x-full');
        if (mainMenu) {
            mainMenu.style.removeProperty('display');
            mainMenu.scrollTop = 0;
            // Return focus to the menu item that opened this panel
            if (window.lastFocusedMenuItem) {
                setTimeout(() => window.lastFocusedMenuItem.focus(), 50);
            }
        }
        return; // Don't close sidebar if we just closed a panel
    }

    // Close sidebar if open
    const drawerToggle = document.getElementById('drawer-toggle');
    if (drawerToggle && drawerToggle.checked) {
        drawerToggle.checked = false;
        drawerToggle.dispatchEvent(new Event('change', { bubbles: true }));
        // Clear stored menu item and focus the toggle tab for reopening
        window.lastFocusedMenuItem = null;
        const toggleTab = document.getElementById('sidebar-toggle-tab');
        if (toggleTab) {
            setTimeout(() => toggleTab.focus(), 50);
        }
    }
}

// ==========================================
// ARROW KEY NAVIGATION
// ==========================================

/**
 * Handle arrow key navigation for menu items.
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
export function handleMenuArrowNav(e) {
    const focusedMenuItem = document.activeElement?.closest('.menu-item');
    if (!focusedMenuItem) return false;

    e.preventDefault();
    const allMenuItems = Array.from(document.querySelectorAll('.menu-item'));
    const currentIndex = allMenuItems.indexOf(focusedMenuItem);
    let nextIndex;
    if (e.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % allMenuItems.length;
    } else {
        nextIndex = currentIndex === 0 ? allMenuItems.length - 1 : currentIndex - 1;
    }
    allMenuItems[nextIndex].focus();
    return true;
}

/**
 * Handle arrow key navigation for sort options.
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
export function handleSortArrowNav(e) {
    const focusedSortOption = document.activeElement?.closest('.sort-option');
    if (!focusedSortOption) return false;

    e.preventDefault();
    const allSortOptions = Array.from(document.querySelectorAll('.sort-option'));
    const currentIndex = allSortOptions.indexOf(focusedSortOption);
    let nextIndex;
    if (e.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % allSortOptions.length;
    } else {
        nextIndex = currentIndex === 0 ? allSortOptions.length - 1 : currentIndex - 1;
    }
    allSortOptions[nextIndex].focus();
    return true;
}

/**
 * Handle left/right arrow navigation within control groups.
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
export function handleControlGroupHorizontalNav(e) {
    const group = document.activeElement?.closest('[role="group"]');
    if (!group) return false;

    e.preventDefault();
    const controls = Array.from(group.querySelectorAll('button:not([disabled])'));
    const currentIndex = controls.indexOf(document.activeElement);
    if (currentIndex === -1) return false;

    let nextIndex;
    if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % controls.length;
    } else {
        nextIndex = currentIndex === 0 ? controls.length - 1 : currentIndex - 1;
    }
    controls[nextIndex].focus();
    return true;
}

/**
 * Handle up/down arrow navigation within control groups (visual grid).
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
export function handleControlGroupVerticalNav(e) {
    const group = document.activeElement?.closest('[role="group"]');
    if (!group) return false;

    e.preventDefault();
    const controls = Array.from(group.querySelectorAll('button:not([disabled])'));
    const current = document.activeElement;
    const currentRect = current.getBoundingClientRect();
    const currentCenterX = currentRect.left + currentRect.width / 2;

    // Find buttons in other rows
    let candidates = controls.filter(btn => {
        if (btn === current) return false;
        const rect = btn.getBoundingClientRect();
        if (e.key === 'ArrowDown') {
            return rect.top > currentRect.bottom - 5;
        } else {
            return rect.bottom < currentRect.top + 5;
        }
    });

    if (candidates.length > 0) {
        // Find closest horizontally aligned button
        candidates.sort((a, b) => {
            const aRect = a.getBoundingClientRect();
            const bRect = b.getBoundingClientRect();
            const aCenterX = aRect.left + aRect.width / 2;
            const bCenterX = bRect.left + bRect.width / 2;
            const aDistX = Math.abs(aCenterX - currentCenterX);
            const bDistX = Math.abs(bCenterX - currentCenterX);
            const aDistY = e.key === 'ArrowDown' ? aRect.top : -aRect.bottom;
            const bDistY = e.key === 'ArrowDown' ? bRect.top : -bRect.bottom;
            if (Math.abs(aDistY - bDistY) > 10) return aDistY - bDistY;
            return aDistX - bDistX;
        });
        candidates[0].focus();
    }
    return true;
}

/**
 * Handle Enter/Space on sort option to select it.
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
export function handleSortOptionSelect(e) {
    const focusedSortOption = document.activeElement?.closest('.sort-option');
    if (!focusedSortOption) return false;

    e.preventDefault();
    const radio = focusedSortOption.querySelector('input[type="radio"]');
    if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
}

/**
 * Handle info window navigation with arrow keys.
 * @param {KeyboardEvent} e - Keyboard event
 */
export function handleInfoWindowArrowNav(e) {
    if (!window.infoWindow || !window.infoWindow.getMap()) return;
    if (!window.navigateNeighborhood) return;

    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        window.navigateNeighborhood(-1);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        window.navigateNeighborhood(1);
    }
}

// Expose on window for legacy code during transition
if (typeof window !== 'undefined') {
    window.getFocusableElements = getFocusableElements;
    window.handleTabTrap = handleTabTrap;
    window.handleEscapeKey = handleEscapeKey;
}

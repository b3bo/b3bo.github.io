/**
 * @file keyboard.js
 * @description WCAG-compliant keyboard navigation manager
 *
 * Features:
 * - Focus trapping within sidebar when open
 * - Escape key to close panels/sidebar
 * - Tab wrapping within containers
 */

let focusTrapActive = false;
let focusTrapContainer = null;
let previouslyFocused = null;

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(
        'button:not([disabled]):not([tabindex="-1"]), ' +
        '[href]:not([tabindex="-1"]), ' +
        'input:not([disabled]):not([tabindex="-1"]), ' +
        'select:not([disabled]):not([tabindex="-1"]), ' +
        'textarea:not([disabled]):not([tabindex="-1"]), ' +
        '[tabindex="0"]'
    )).filter(el => {
        // Element must be visible
        if (el.offsetParent === null || getComputedStyle(el).visibility === 'hidden') return false;
        // Exclude elements inside translated-off panels (off-screen)
        if (el.closest('.translate-x-full')) return false;
        return true;
    });
}

/**
 * Trap focus within a container (e.g., sidebar)
 */
export function trapFocus(container) {
    focusTrapActive = true;
    focusTrapContainer = container;
    previouslyFocused = document.activeElement;

    const focusable = getFocusableElements(container);
    if (focusable.length) {
        focusable[0].focus();
    }
}

/**
 * Release focus trap and return to previous element
 */
export function releaseFocus() {
    focusTrapActive = false;
    focusTrapContainer = null;
    if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
    }
    previouslyFocused = null;
}

/**
 * Handle Tab key within focus trap - fully manage Tab navigation
 */
function handleTabTrap(e) {
    if (!focusTrapContainer) return;

    const focusable = getFocusableElements(focusTrapContainer);
    if (focusable.length === 0) {
        e.preventDefault(); // No focusable elements, block Tab entirely
        return;
    }

    // ALWAYS prevent default - we manage Tab navigation manually
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

/**
 * Handle Escape key to close panels/sidebar
 */
function handleEscape() {
    // First: Close any open sliding panel (check multiple possible selectors)
    const openPanel = document.querySelector('.sliding-panel:not(.translate-x-full)') ||
                      document.querySelector('[class*="sliding-panel"]:not([class*="translate-x-full"])');
    if (openPanel) {
        const backBtn = openPanel.querySelector('.panel-back-btn') ||
                        openPanel.querySelector('[class*="back"]') ||
                        openPanel.querySelector('button');
        if (backBtn) {
            backBtn.click();
            return true;
        }
    }

    // Second: Close sidebar if open
    const drawerToggle = document.getElementById('drawer-toggle');
    if (drawerToggle && drawerToggle.checked) {
        drawerToggle.checked = false;
        drawerToggle.dispatchEvent(new Event('change', { bubbles: true }));
        releaseFocus();
        return true;
    }

    return false;
}

/**
 * Global keydown handler
 * Note: Tab focus trapping is handled in index.html inline script
 * to properly coordinate with search dropdown state
 */
function handleGlobalKeydown(e) {
    // Handle Escape
    if (e.key === 'Escape') {
        handleEscape();
    }
}

/**
 * Initialize keyboard navigation
 */
export function initKeyboardNavigation() {
    document.addEventListener('keydown', handleGlobalKeydown);

    // Set up focus trap for sidebar when it opens
    const drawerToggle = document.getElementById('drawer-toggle');
    const sidebar = document.getElementById('sidebar');

    if (drawerToggle && sidebar) {
        drawerToggle.addEventListener('change', () => {
            if (drawerToggle.checked) {
                // Sidebar opened - enable focus trap but don't auto-focus
                focusTrapActive = true;
                focusTrapContainer = sidebar;
            } else {
                // Sidebar closed - release focus trap
                releaseFocus();
            }
        });

        // If sidebar is already open on page load, enable focus trap
        // (but don't auto-focus - let user initiate with Tab)
        if (drawerToggle.checked) {
            focusTrapActive = true;
            focusTrapContainer = sidebar;
        }
    }
}

export default { initKeyboardNavigation, trapFocus, releaseFocus };

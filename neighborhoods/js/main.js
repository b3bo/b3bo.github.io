/**
 * @file main.js
 * @description Main application logic for Neighborhood Finder
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 *
 * This file was extracted from inline scripts in index.html
 * for better maintainability and caching.
 */

// ============================================================
// SECURITY: UI Hardening (disable dev tools unless ?debug=true)
// ============================================================
(function () {
    const urlParams = new URLSearchParams(window.location.search.replace(/&amp;/g, '&'));
    const debugMode = urlParams.get('debug') === 'true';

    if (debugMode) {
        console.log('🔓 Debug mode: Developer tools enabled');
        return; // Skip all security restrictions
    }

    // Block right-click context menu
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        return false;
    });

    // Block developer tools keyboard shortcuts
    document.addEventListener('keydown', e => {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Dev Tools)
        if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }

        // Ctrl+S (Save Page)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });

    console.log('🔒 Security: UI hardening active');
})();

// Helper: Parse URL params with HTML entity decoding (handles &amp; from WYSIWYG editors)
function getUrlParams() {
    const search = window.location.search.replace(/&amp;/g, '&');
    return new URLSearchParams(search);
}

// Panel navigation - wait for both DOM and data
function initApp() {
    // Guard against double initialization
    if (window.appInitialized) return;
    window.appInitialized = true;

    // Parse URL parameters for single mode
    const urlParams = getUrlParams();
    const isSingleMode = urlParams.get('mode') === 'single';
    const neighborhoodSlug = urlParams.get('neighborhood') || urlParams.get('marker');
    window.isSingleMode = isSingleMode;
    const isInIframe = window.self !== window.top;

    // Single mode: CSS in <head> handles hiding sidebar/drawer/disclaimer
    if (isSingleMode) {
        console.log('Single mode active:', neighborhoodSlug);
        // Show overlay IMMEDIATELY - before map even starts loading
        const overlay = document.getElementById('single-mode-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
            console.log('Single mode: overlay shown (early, in initApp)');
        }
    }

    // Also hide disclaimer when in iframe (even if not single mode)
    if (isInIframe) {
        const disclaimer = document.querySelector('.disclaimer-bar');
        const mapLayout = document.getElementById('map-layout');
        if (disclaimer) disclaimer.style.display = 'none';
        if (mapLayout) mapLayout.style.height = '100dvh';
    }

    // Open sidebar on desktop in full mode (mobile stays closed to show animation)
    if (!isSingleMode && window.innerWidth >= 768) {
        const drawerToggle = document.getElementById('drawer-toggle');
        if (drawerToggle) drawerToggle.checked = true;
    }

    // Use global variables set by ES module
    const neighborhoods = window.neighborhoods || [];
    const filteredNeighborhoods = window.filteredNeighborhoods || [];
    let sortOrder = window.sortOrder || 'listings-desc';
    const formatPrice = window.formatPrice || (p => '$' + (p / 1000).toFixed(0) + 'K');
    const menuItems = document.querySelectorAll('.menu-item');
    const backButtons = document.querySelectorAll('.panel-back-btn');
    const mainMenu = document.getElementById('main-menu');

    // Open panel on menu item click
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            const panelName = this.getAttribute('data-panel');
            const panel = document.getElementById(panelName + '-panel');

            if (panel) {
                // Close all other panels
                document.querySelectorAll('.sliding-panel').forEach(p => {
                    if (p.id !== panel.id) {
                        p.classList.add('translate-x-full');
                    }
                });

                // Hide main menu
                if (mainMenu) mainMenu.style.display = 'none';

                // Open target panel
                panel.classList.remove('translate-x-full');

                // Focus the back button after panel opens (for keyboard users)
                const backBtn = panel.querySelector('.panel-back-btn');
                if (backBtn) {
                    setTimeout(() => backBtn.focus(), 100);
                }
            }
        });

        // Keyboard support: Enter/Space opens panel
        item.addEventListener('keydown', function (e) {
            // Only respond if sidebar is open
            const toggle = document.getElementById('drawer-toggle');
            if (!toggle || !toggle.checked) return;

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.lastFocusedMenuItem = this; // Store for focus return
                this.click();
            }
        });
    });

    // Close panel on back button click
    backButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const panelName = this.getAttribute('data-close-panel');
            const panel = document.getElementById(panelName + '-panel');

            if (panel) {
                panel.classList.add('translate-x-full');

                // Hide any open dropdowns when navigating back
                const searchDropdown = document.getElementById('search-dropdown');
                const sortMenu = document.getElementById('sort-menu');
                if (searchDropdown) searchDropdown.classList.add('hidden');
                if (sortMenu) sortMenu.classList.add('hidden');

                // Show main menu and return focus
                if (mainMenu) {
                    mainMenu.style.removeProperty('display');
                    mainMenu.scrollTop = 0;
                    // Return focus to the menu item that opened this panel
                    if (window.lastFocusedMenuItem) {
                        setTimeout(() => window.lastFocusedMenuItem.focus(), 50);
                    }
                }
            }
        });
    });

    // Sidebar toggle keyboard support (Enter/Space to open/close)
    const sidebarToggleTab = document.getElementById('sidebar-toggle-tab');
    if (sidebarToggleTab) {
        sidebarToggleTab.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });

        // Toggle tabindex based on sidebar state - focusable only when closed
        const updateToggleTabindex = () => {
            const toggle = document.getElementById('drawer-toggle');
            sidebarToggleTab.tabIndex = toggle && toggle.checked ? -1 : 0;
        };
        document.getElementById('drawer-toggle')?.addEventListener('change', updateToggleTabindex);
        updateToggleTabindex(); // Set initial state
    }

    // Theme toggle - also updates map colorScheme
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');

            // Recreate map with new colorScheme (Google Maps requires this)
            if (window.map && typeof google !== 'undefined') {
                const currentCenter = window.map.getCenter();
                const currentZoom = window.map.getZoom();

                // Store current markers
                const existingMarkers = window.markers || [];

                // Recreate map
                window.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: currentZoom,
                    center: currentCenter,
                    mapId: '92b2f4ea8b2fce54a50ed2e9',
                    colorScheme: isDark ? 'DARK' : 'LIGHT',
                    mapTypeControl: true,
                    mapTypeControlOptions: {
                        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                        position: google.maps.ControlPosition.TOP_RIGHT
                    },
                    streetViewControl: true,
                    fullscreenControl: true,
                    zoomControl: true,
                    clickableIcons: false
                });

                // Recreate info windows
                window.infoWindow = new google.maps.InfoWindow({ maxWidth: 320 });
                window.hoverInfoWindow = new google.maps.InfoWindow({ maxWidth: 320 });

                // Re-add close button removal listeners
                function removeInfoWindowCloseButton() {
                    const closeBtn = document.querySelector('.gm-style-iw-chr');
                    if (closeBtn) closeBtn.remove();
                }
                window.infoWindow.addListener('domready', removeInfoWindowCloseButton);
                window.hoverInfoWindow.addListener('domready', removeInfoWindowCloseButton);

                // Re-add markers
                window.addMarkers();

                // Re-show GeoJSON boundaries if any selected
                if (window.customBoundaries && window.customBoundaries.size > 0) {
                    // Clear and re-add boundaries since map was recreated
                    const savedBoundaries = new Set(window.customBoundaries);
                    window.customBoundaries.clear();
                    savedBoundaries.forEach(zip => {
                        window.showCustomBoundary(zip);
                    });
                }
            }

            // Track theme change
            if (typeof gtag !== 'undefined') {
                gtag('event', 'theme_toggle', { theme: isDark ? 'dark' : 'light' });
            }
        });
    }

    // ==========================================
    // PORTAL DROPDOWNS (same logic as production)
    // ==========================================
    const searchBtn = document.getElementById('search-button');
    const searchDropdown = document.getElementById('search-dropdown');
    const searchInput = document.getElementById('search-input');
    const sortBtn = document.getElementById('sort-button');
    const sortMenu = document.getElementById('sort-menu');

    // Portal dropdowns to body for proper z-index and no content shift
    if (searchDropdown) document.body.appendChild(searchDropdown);
    if (sortMenu) document.body.appendChild(sortMenu);

    // Position dropdown centered under button (handles iOS viewport)
    function positionDropdown(dropdown, button) {
        if (!dropdown || !button) return;
        const rect = button.getBoundingClientRect();
        const offsetY = 10;
        const viewportPadding = 12;
        const dropdownWidth = 280;

        // Account for iOS visual viewport shifts
        const vv = window.visualViewport;
        const viewportWidth = vv ? vv.width : window.innerWidth;
        const viewportLeft = vv ? vv.offsetLeft : 0;
        const viewportTop = vv ? vv.offsetTop : 0;

        // Center on button
        const buttonCenter = viewportLeft + rect.left + rect.width / 2;
        let left = buttonCenter - dropdownWidth / 2;

        // Viewport constraints
        if (left + dropdownWidth > viewportLeft + viewportWidth - viewportPadding) {
            left = viewportLeft + viewportWidth - dropdownWidth - viewportPadding;
        }
        if (left < viewportLeft + viewportPadding) {
            left = viewportLeft + viewportPadding;
        }

        dropdown.style.position = 'fixed';
        dropdown.style.top = viewportTop + rect.bottom + offsetY + 'px';
        dropdown.style.left = left + 'px';
        dropdown.style.zIndex = '2147483647';
    }

    // Render "Most Listings" in search dropdown
    function renderMostListings() {
        const results = document.getElementById('search-results');
        const neighborhoods = window.neighborhoods || [];
        if (!results || !neighborhoods.length) return;

        const topListings = [...neighborhoods]
            .sort((a, b) => (b.stats?.listingCount || 0) - (a.stats?.listingCount || 0))
            .slice(0, 5);
        results.innerHTML = `
                    <div class="px-4 py-2 text-xs font-medium text-neutral-400 dark:text-dark-text-secondary uppercase">Most Listings</div>
                    ${topListings
                        .map(
                            n => `
                        <button class="search-result w-full text-left px-4 py-2 text-sm hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors cursor-pointer" data-name="${n.name}" data-type="${n.propertyType}">
                            ${n.name} - ${n.propertyType}
                        </button>
                    `
                        )
                        .join('')}
                `;
    }

    // Search dropdown toggle
    if (searchBtn && searchDropdown) {
        searchBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (sortMenu) sortMenu.classList.add('hidden');
            searchDropdown.classList.toggle('hidden');
            if (!searchDropdown.classList.contains('hidden')) {
                positionDropdown(searchDropdown, searchBtn);
                if (searchInput) {
                    searchInput.value = ''; // Clear any previous input
                    searchInput.focus();
                }
                // Render initial "Most Listings" results
                renderMostListings();
                // Detect initial overflow and apply stationary fade
                const searchResultsEl = document.getElementById('search-results');
                if (searchResultsEl) {
                    if (searchResultsEl.scrollHeight > searchResultsEl.clientHeight + 4) {
                        searchResultsEl.classList.add('has-overflow');
                    } else {
                        searchResultsEl.classList.remove('has-overflow');
                    }
                }
            }
        });
    }

    // Sort dropdown toggle
    if (sortBtn && sortMenu) {
        sortBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (searchDropdown) searchDropdown.classList.add('hidden');
            sortMenu.classList.toggle('hidden');
            if (!sortMenu.classList.contains('hidden')) {
                positionDropdown(sortMenu, sortBtn);
                // Focus the checked option or first option
                const checkedRadio = sortMenu.querySelector('input[type="radio"]:checked');
                const checkedOption = checkedRadio
                    ? checkedRadio.closest('.sort-option')
                    : sortMenu.querySelector('.sort-option');
                if (checkedOption) {
                    setTimeout(() => checkedOption.focus(), 50);
                }
            }
        });

        // Keyboard support for sort button
        sortBtn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (e) {
        if (
            searchDropdown &&
            !searchDropdown.contains(e.target) &&
            e.target !== searchBtn &&
            !searchBtn.contains(e.target)
        ) {
            searchDropdown.classList.add('hidden');
        }
        if (sortMenu && !sortMenu.contains(e.target) && e.target !== sortBtn && !sortBtn.contains(e.target)) {
            sortMenu.classList.add('hidden');
        }
    });

    // ========================================
    // WCAG Focus Trap for Sidebar
    // ========================================
    const sidebar = document.getElementById('sidebar');
    const drawerToggle = document.getElementById('drawer-toggle');

    function getFocusableElements(container) {
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

    function handleTabTrap(e) {
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

    // Global keyboard handlers
    document.addEventListener('keydown', function (e) {
        // Don't intercept if user is typing in an input/textarea
        const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

        // Handle Tab within sidebar focus trap
        if (e.key === 'Tab' && drawerToggle && drawerToggle.checked) {
            // Skip if search dropdown is open (search.js handles its Tab behavior)
            const searchDropdownOpen = searchDropdown && !searchDropdown.classList.contains('hidden');
            if (searchDropdownOpen) return;

            // Close sort menu if open (focus is on sortButton which is in sidebar)
            if (sortMenu && !sortMenu.classList.contains('hidden')) {
                sortMenu.classList.add('hidden');
                const sortButton = document.getElementById('sort-button');
                if (sortButton) {
                    sortButton.setAttribute('aria-expanded', 'false');
                    sortButton.removeAttribute('aria-activedescendant');
                }
            }

            handleTabTrap(e);
            return; // Don't process other handlers
        }

        if (e.key === 'Escape') {
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

        // Up/Down arrows for menu item and sort option navigation
        if (!isTyping && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            // Menu items
            const focusedMenuItem = document.activeElement?.closest('.menu-item');
            if (focusedMenuItem) {
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
                return;
            }

            // Sort options
            const focusedSortOption = document.activeElement?.closest('.sort-option');
            if (focusedSortOption) {
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
                return;
            }
        }

        // Enter/Space on sort option selects it
        if (!isTyping && (e.key === 'Enter' || e.key === ' ')) {
            const focusedSortOption = document.activeElement?.closest('.sort-option');
            if (focusedSortOption) {
                e.preventDefault();
                const radio = focusedSortOption.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }

        // Left/Right arrows for control group navigation (role="group")
        if (!isTyping && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            const group = document.activeElement?.closest('[role="group"]');
            if (group) {
                e.preventDefault();
                const controls = Array.from(group.querySelectorAll('button:not([disabled])'));
                const currentIndex = controls.indexOf(document.activeElement);
                if (currentIndex !== -1) {
                    let nextIndex;
                    if (e.key === 'ArrowRight') {
                        nextIndex = (currentIndex + 1) % controls.length;
                    } else {
                        nextIndex = currentIndex === 0 ? controls.length - 1 : currentIndex - 1;
                    }
                    controls[nextIndex].focus();
                }
                return;
            }
        }

        // Up/Down arrows for control group grid navigation (visual rows)
        if (!isTyping && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            const group = document.activeElement?.closest('[role="group"]');
            if (group) {
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
                        return rect.top > currentRect.bottom - 5; // Below current row
                    } else {
                        return rect.bottom < currentRect.top + 5; // Above current row
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
                        // Primary: closest row, Secondary: closest horizontal
                        const aDistY = e.key === 'ArrowDown' ? aRect.top : -aRect.bottom;
                        const bDistY = e.key === 'ArrowDown' ? bRect.top : -bRect.bottom;
                        if (Math.abs(aDistY - bDistY) > 10) return aDistY - bDistY;
                        return aDistX - bDistX;
                    });
                    candidates[0].focus();
                }
                return;
            }
        }

        // Arrow keys for info window navigation (only when not typing and not in control group)
        if (!isTyping && window.infoWindow && window.infoWindow.getMap()) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                window.navigateNeighborhood(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                window.navigateNeighborhood(1);
            }
        }
    });

    // Search input keyboard handling
    if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Just close dropdown - filter is already applied from input handler
                searchDropdown.classList.add('hidden');
                searchInput.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                searchDropdown.classList.add('hidden');
                searchInput.blur();
            }
        });
    }

    // Reposition on resize/scroll (handles iOS keyboard/zoom)
    ['resize', 'orientationchange'].forEach(evt => {
        window.addEventListener(evt, () => {
            if (searchDropdown && !searchDropdown.classList.contains('hidden')) {
                positionDropdown(searchDropdown, searchBtn);
            }
            if (sortMenu && !sortMenu.classList.contains('hidden')) {
                positionDropdown(sortMenu, sortBtn);
            }
        });
    });

    window.addEventListener(
        'scroll',
        () => {
            if (searchDropdown && !searchDropdown.classList.contains('hidden')) {
                positionDropdown(searchDropdown, searchBtn);
            }
            if (sortMenu && !sortMenu.classList.contains('hidden')) {
                positionDropdown(sortMenu, sortBtn);
            }
        },
        true
    );

    // Handle iOS visual viewport changes
    if (window.visualViewport) {
        ['resize', 'scroll'].forEach(evt => {
            window.visualViewport.addEventListener(evt, () => {
                if (searchDropdown && !searchDropdown.classList.contains('hidden')) {
                    positionDropdown(searchDropdown, searchBtn);
                }
                if (sortMenu && !sortMenu.classList.contains('hidden')) {
                    positionDropdown(sortMenu, sortBtn);
                }
            });
        });
    }

    // iOS viewport reset on search input blur
    if (searchInput) {
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                window.scrollTo(0, 0);
                document.documentElement.scrollLeft = 0;
                document.body.scrollLeft = 0;
            }, 100);
        });
    }

    // ==========================================
    // RESULTS LIST RENDERING
    // ==========================================
    function formatAmenitiesWithSelection(amenitiesArr) {
        if (!amenitiesArr || amenitiesArr.length === 0) return 'No amenities listed';
        const selected = window.filterState?.amenities || new Set();
        return amenitiesArr.map(a => (selected.has(a) ? `<strong>${a}</strong>` : a)).join(', ') + '.';
    }

    function listingLabelForType(typeString) {
        const t = (typeString || '').toLowerCase();
        if (t.includes('townhome')) return 'Active T/H Listings';
        if (t.includes('condo')) return 'Active Condo Listings';
        if (t.includes('home')) return 'Active Home Listings';
        return 'Active Listings';
    }

    function aggregateListingLabel(count, neighborhoods = []) {
        // Show neighborhood/community count, not listing count
        return `${count} ${count === 1 ? 'Community' : 'Communities'}`;
    }

    // Animated counter - spins numbers up/down
    let lastDisplayedCount = null;
    let countAnimationFrame = null;
    function animateCount(element, targetCount, duration = 700) {
        // Cancel any pending animation
        if (countAnimationFrame) {
            cancelAnimationFrame(countAnimationFrame);
            countAnimationFrame = null;
        }

        // Get current displayed value (in case animation was interrupted)
        const countSpan = element.querySelector('.count-number');
        const currentDisplayed = countSpan ? parseInt(countSpan.textContent, 10) : null;
        const start =
            currentDisplayed !== null && !isNaN(currentDisplayed)
                ? currentDisplayed
                : lastDisplayedCount !== null
                  ? lastDisplayedCount
                  : targetCount;
        const diff = targetCount - start;

        // Skip animation if no change or first load
        if (diff === 0 || lastDisplayedCount === null) {
            lastDisplayedCount = targetCount;
            if (countSpan) countSpan.textContent = targetCount;
            return;
        }

        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + diff * eased);

            // Update just the number part
            if (countSpan) {
                countSpan.textContent = current;
            }

            if (progress < 1) {
                countAnimationFrame = requestAnimationFrame(update);
            } else {
                countAnimationFrame = null;
                lastDisplayedCount = targetCount;
            }
        }

        countAnimationFrame = requestAnimationFrame(update);
    }

    // Check if any filters are active (non-default values)
    function hasActiveFilters() {
        const fs = window.filterState || {};
        const totalNeighborhoods = (window.neighborhoods || []).length;
        const filteredCount = (window.filteredNeighborhoods || []).length;

        // If filtered count differs from total, filters are active
        if (filteredCount < totalNeighborhoods) return true;

        // Also check explicit filter states
        if (window.searchQuery) return true;
        if (fs.propertyType) return true;
        if (fs.areas && fs.areas.size > 0) return true;
        if (fs.amenities && fs.amenities.size > 0) return true;
        if (fs.priceMin > 0 || fs.priceMax < 41) return true;
        if (fs.bedsMin > 1 || fs.bathsMin > 1) return true;

        return false;
    }

    // Reset all filters to defaults
    function clearAllFilters() {
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

        const bedsSlider = document.getElementById('beds-slider');
        const bathsSlider = document.getElementById('baths-slider');
        if (bedsSlider) bedsSlider.value = 1;
        if (bathsSlider) bathsSlider.value = 1;

        // Reset property type buttons
        document.querySelectorAll('[data-filter-type]').forEach(btn => {
            btn.classList.remove('bg-brand-600', 'text-white');
            btn.classList.add('bg-white', 'text-neutral-700');
        });

        // Reset area tag buttons (remove selected class)
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
        renderResults();
        if (window.addMarkers) window.addMarkers();

        // Update price display
        const priceDisplay = document.getElementById('price-display');
        if (priceDisplay) priceDisplay.textContent = '$250K - $35M+';

        // Update beds/baths displays
        const bedsDisplay = document.getElementById('beds-display');
        const bathsDisplay = document.getElementById('baths-display');
        if (bedsDisplay) bedsDisplay.textContent = '1+';
        if (bathsDisplay) bathsDisplay.textContent = '1+';

        // Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'clear_filters');
        }
    }

    function renderResults() {
        const list = document.getElementById('neighborhoodList');
        const resultsCount = document.getElementById('resultsCount');

        if (!list) return;

        // Sort neighborhoods (read from window for current state)
        const currentFiltered = window.filteredNeighborhoods || [];
        const currentSort = window.sortOrder || 'listings-desc';
        const sorted = [...currentFiltered].sort((a, b) => {
            const aPrice = a.stats?.medianPrice || a.stats?.avgPrice || 0;
            const bPrice = b.stats?.medianPrice || b.stats?.avgPrice || 0;
            const aListings = a.stats?.listingCount || 0;
            const bListings = b.stats?.listingCount || 0;
            switch (currentSort) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'price-asc':
                    return aPrice - bPrice;
                case 'price-desc':
                    return bPrice - aPrice;
                case 'listings-desc':
                    return bListings - aListings;
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        // Update count with optional Clear pill (animated number)
        if (resultsCount) {
            const count = sorted.length;
            const suffix = count === 1 ? ' Community' : ' Communities';
            const clearBtn = hasActiveFilters()
                ? ` <button id="clear-filters" class="ml-2 px-3 py-1 text-sm font-medium rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg-elevated text-neutral-700 dark:text-dark-text-primary hover:bg-brand-100 dark:hover:bg-brand-dark/20 hover:text-brand-700 dark:hover:text-brand-dark transition-colors">Clear</button>`
                : '';

            // Use span for animated number
            resultsCount.innerHTML = `<span class="count-number">${lastDisplayedCount !== null ? lastDisplayedCount : count}</span>${suffix}${clearBtn}`;

            // Animate the count change
            animateCount(resultsCount, count);

            // Add click handler for Clear button
            if (hasActiveFilters()) {
                const clearBtnEl = document.getElementById('clear-filters');
                if (clearBtnEl) {
                    clearBtnEl.addEventListener('click', e => {
                        e.stopPropagation();
                        clearAllFilters();
                    });
                }
            }
        }

        // Render list - use buttons for WCAG keyboard navigation
        const fmt = window.formatPrice || (p => '$' + (p / 1000000).toFixed(1) + 'M');
        list.innerHTML = sorted
            .map(
                n => `
                    <button type="button" class="neighborhood-item w-full text-left bg-white dark:bg-dark-bg-elevated px-4 py-3 rounded-xl border border-neutral-200 dark:border-dark-border cursor-pointer overflow-hidden transition-colors hover:bg-brand-100 dark:hover:bg-brand-dark/20 active:bg-brand-200 dark:active:bg-brand-dark/30"
                         data-name="${n.name}" data-type="${n.propertyType}">
                        <div class="flex justify-between items-start gap-2 mb-1">
                            <h3 class="text-base font-semibold text-neutral-800 dark:text-dark-text-primary break-words">${n.name}</h3>
                            <span class="text-sm font-semibold text-neutral-800 dark:text-dark-text-primary whitespace-nowrap">${fmt(n.stats?.medianPrice || n.stats?.avgPrice || 0)}</span>
                        </div>
                        <div class="text-xs text-neutral-600 dark:text-dark-text-secondary mb-3">${n.stats?.listingCount || 0} ${listingLabelForType(n.propertyType)}</div>
                        <div class="text-xs text-neutral-600 dark:text-dark-text-secondary leading-relaxed break-words">${formatAmenitiesWithSelection(n.amenities || [])}</div>
                    </button>
                `
            )
            .join('');

        // Add click handlers
        list.querySelectorAll('.neighborhood-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                const type = item.dataset.type;
                const n = (window.filteredNeighborhoods || []).find(x => x.name === name && x.propertyType === type);
                if (n && window.map) {
                    // Analytics
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'select_neighborhood', {
                            neighborhood_name: n.name,
                            listing_count: n.stats?.listingCount || 0,
                            price: fmt(n.stats?.medianPrice || n.stats?.avgPrice || 0)
                        });
                    }

                    // Smooth fly animation
                    window.smoothFlyTo(n.position);

                    // Find and click marker after flight
                    const marker = (window.markers || []).find(
                        m => m.neighborhood.name === name && m.neighborhood.propertyType === type
                    );
                    if (marker) {
                        // Calculate distance to determine delay
                        const startPos = window.map.getCenter();
                        const targetLatLng = new google.maps.LatLng(n.position);
                        const distance = google.maps.geometry.spherical.computeDistanceBetween(startPos, targetLatLng);
                        const delay = distance < 2000 ? 450 : 2200;

                        setTimeout(() => {
                            google.maps.event.trigger(marker.marker, 'click');
                        }, delay);
                    }

                    // Keep drawer open so users can browse multiple results
                    // They can manually close it to focus on the map
                }
            });
        });
    }

    // ==========================================
    // FILTER STATE & PRICE STEPS
    // ==========================================
    // PRICE_STEPS is set by init.js from CONFIG.ui.priceSteps
    // Fallback only if init.js hasn't loaded yet
    window.PRICE_STEPS = window.PRICE_STEPS || [
        250000, 300000, 350000, 400000, 450000, 500000, 550000, 600000, 650000, 700000, 750000, 800000, 850000, 900000,
        950000, 1000000, 1250000, 1500000, 1750000, 2000000, 2250000, 2500000, 2750000, 3000000, 3250000, 3500000,
        3750000, 4000000, 4250000, 4500000, 4750000, 5000000, 6000000, 7000000, 8000000, 9000000, 10000000, 15000000,
        20000000, 25000000, 30000000, 35000000
    ];
    const PRICE_STEPS = window.PRICE_STEPS; // Local reference

    window.filterState = {
        propertyType: null, // null = all, 'Homes', 'Condos'
        areas: new Set(), // selected zip codes
        amenities: new Set(), // selected amenities
        priceMin: 0, // min price index
        priceMax: 41 // max price index
    };

    // ==========================================
    // PRICE SLIDER SETUP
    // ==========================================
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    const priceDisplay = document.getElementById('price-display');
    const priceFill = document.getElementById('price-fill');

    function formatSliderPrice(price) {
        if (price >= 1000000) {
            return '$' + (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1) + 'M';
        }
        return '$' + (price / 1000).toFixed(0) + 'K';
    }

    function updatePriceSlider() {
        if (!priceMinInput || !priceMaxInput) return;

        let minVal = parseInt(priceMinInput.value) || 0;
        let maxVal = parseInt(priceMaxInput.value) || 41;
        const totalSteps = 41;

        // Push behavior
        if (minVal > maxVal) {
            if (this === priceMaxInput) {
                priceMinInput.value = maxVal;
                minVal = maxVal;
            } else {
                priceMaxInput.value = minVal;
                maxVal = minVal;
            }
        }

        // Update filter state
        window.filterState.priceMin = minVal;
        window.filterState.priceMax = maxVal;

        // Update display
        if (priceDisplay) {
            if (minVal === 0 && maxVal === 0) {
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

    if (priceMinInput) priceMinInput.addEventListener('input', updatePriceSlider);
    if (priceMaxInput) priceMaxInput.addEventListener('input', updatePriceSlider);

    // ==========================================
    // BEDS/BATHS SLIDER SETUP
    // ==========================================
    const bedsInput = document.getElementById('beds-min');
    const bedsDisplay = document.getElementById('beds-display');
    const bedsFill = document.getElementById('beds-fill');
    const bathsInput = document.getElementById('baths-min');
    const bathsDisplay = document.getElementById('baths-display');
    const bathsFill = document.getElementById('baths-fill');

    // Initialize filter state for beds/baths
    window.filterState.bedsMin = 1;
    window.filterState.bathsMin = 1;

    function updateBedsSlider() {
        if (!bedsInput) return;
        const val = parseInt(bedsInput.value) || 1;
        window.filterState.bedsMin = val;

        // Update display
        if (bedsDisplay) {
            bedsDisplay.textContent = val >= 6 ? '6+' : `${val}+`;
        }

        // Update track fill (1-6 range)
        if (bedsFill) {
            const pct = ((val - 1) / 5) * 100;
            bedsFill.style.width = `${pct}%`;
        }

        applyFilters();
    }

    function updateBathsSlider() {
        if (!bathsInput) return;
        const val = parseInt(bathsInput.value) || 1;
        window.filterState.bathsMin = val;

        // Update display
        if (bathsDisplay) {
            bathsDisplay.textContent = val >= 6 ? '6+' : `${val}+`;
        }

        // Update track fill (1-6 range)
        if (bathsFill) {
            const pct = ((val - 1) / 5) * 100;
            bathsFill.style.width = `${pct}%`;
        }

        applyFilters();
    }

    if (bedsInput) bedsInput.addEventListener('input', updateBedsSlider);
    if (bathsInput) bathsInput.addEventListener('input', updateBathsSlider);

    // ==========================================
    // PROPERTY TYPE TOGGLE (Homes/Condos)
    // ==========================================
    const homesBtn = document.getElementById('btn-homes');
    const condosBtn = document.getElementById('btn-condos');

    if (homesBtn) {
        homesBtn.addEventListener('click', function () {
            this.classList.toggle('active');
            applyFilters();
        });
    }

    if (condosBtn) {
        condosBtn.addEventListener('click', function () {
            this.classList.toggle('active');
            applyFilters();
        });
    }

    // ==========================================
    // AREA FILTER BUTTONS
    // ==========================================
    document.querySelectorAll('.area-tag').forEach(tag => {
        tag.addEventListener('click', function () {
            this.classList.toggle('selected');
            const zipCode = this.getAttribute('data-zipcode');
            const subarea = this.getAttribute('data-subarea');
            const isSelected = this.classList.contains('selected');

            if (zipCode) {
                if (isSelected) {
                    window.filterState.areas.add(zipCode);
                    window.showCustomBoundary(zipCode);
                } else {
                    window.filterState.areas.delete(zipCode);
                    window.hideCustomBoundary(zipCode);
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

            // Show/hide area marker
            const presetData = window.areaPresets?.presets?.find(
                p => (zipCode && p.filterValue === zipCode) || (subarea && p.filterValue === subarea)
            );
            if (presetData && window.showAreaMarker && window.hideAreaMarker) {
                if (isSelected) {
                    window.showAreaMarker(presetData);
                } else {
                    window.hideAreaMarker(presetData.slug);
                }
            }
        });
    });

    // ==========================================
    // AMENITY FILTER BUTTONS
    // ==========================================
    document.querySelectorAll('.amenity-tag').forEach(tag => {
        tag.addEventListener('click', function () {
            this.classList.toggle('selected');
            const amenity = this.getAttribute('data-amenity');
            const isSelected = this.classList.contains('selected');
            if (amenity) {
                if (isSelected) {
                    window.filterState.amenities.add(amenity);

                    // Mutual exclusivity: Short-Term and No Short-Term can't both be selected
                    if (amenity === 'Short-Term') {
                        window.filterState.amenities.delete('No Short-Term');
                        document
                            .querySelector('.amenity-tag[data-amenity="No Short-Term"]')
                            ?.classList.remove('selected');
                    } else if (amenity === 'No Short-Term') {
                        window.filterState.amenities.delete('Short-Term');
                        document.querySelector('.amenity-tag[data-amenity="Short-Term"]')?.classList.remove('selected');
                    }
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
            }
            applyFilters();
        });
    });

    // ==========================================
    // URL PARAM: AUTO-SELECT SUBAREA FILTER
    // ==========================================
    const urlSubarea = getUrlParams().get('subarea');
    if (urlSubarea) {
        // Find and click the matching area-tag button
        const matchingTag = Array.from(document.querySelectorAll('.area-tag')).find(tag => {
            const tagSubarea = tag.getAttribute('data-subarea');
            return tagSubarea === urlSubarea;
        });
        if (matchingTag) {
            matchingTag.click();
        }
    }

    // ==========================================
    // DEBOUNCE HELPER
    // ==========================================
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // ==========================================
    // FIND AREA BUTTON HELPER
    // ==========================================
    // Find area filter button by preset data (uses filterField to select correct attribute)
    // Exposed on window for access from map initialization code
    window.findAreaButton = function (presetData) {
        if (!presetData) return null;
        const { filterField, filterValue } = presetData;
        if (filterField === 'zipCode') {
            return document.querySelector(`.area-tag[data-zipcode="${filterValue}"]`);
        }
        return document.querySelector(`.area-tag[data-subarea="${filterValue}"]`);
    };

    // ==========================================
    // UNIFIED AREA SELECTION (ALL 8 AREAS USE THIS)
    // ==========================================
    // Helper: Create area marker data from preset (exposed on window for map script)
    window.createAreaMarkerData = function (presetData) {
        return {
            name: presetData.name,
            position: presetData.position,
            stats: presetData.stats,
            neighborhoods: presetData.neighborhoods,
            filterField: presetData.filterField,
            filterValue: presetData.filterValue,
            isAreaMarker: true
        };
    };

    // ==========================================
    // APPLY FILTERS FUNCTION
    // ==========================================
    function applyFilters() {
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
        // priceMinIdx=0 means "no minimum" (show all), priceMaxIdx=41 means "no maximum"
        let minPrice = priceMinIdx === 0 ? 0 : PRICE_STEPS[priceMinIdx] || 0;
        let maxPrice =
            priceMaxIdx >= 41 ? Number.MAX_SAFE_INTEGER : PRICE_STEPS[priceMaxIdx] || Number.MAX_SAFE_INTEGER;

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
                // Check exact matches first
                // Direct matching - buttons use correct filter values (zipCode, area code, or subArea code)
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
                // Check for overlap: UserMax >= NbMin && UserMin <= NbMax
                inPriceRange = maxPrice >= nbMinPrice && minPrice <= nbMaxPrice;
            } else if (stats.avgPrice > 0) {
                // Fallback to avgPrice
                inPriceRange = stats.avgPrice >= minPrice && stats.avgPrice <= maxPrice;
            }

            // Beds filter - check if neighborhood has listings >= minBeds
            let inBedsRange = true;
            if (minBeds > 1) {
                const nbMaxBeds = stats.maxBeds !== undefined ? parseFloat(stats.maxBeds) : null;
                if (nbMaxBeds !== null && !isNaN(nbMaxBeds)) {
                    inBedsRange = nbMaxBeds >= minBeds;
                }
            }

            // Baths filter - check if neighborhood has listings >= minBaths
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
        renderResults();
        window.addMarkers();
        // Skip fitBounds when marker param present - centering handled by showAreaMarker
        const markerParam = getUrlParams().get('marker');
        if (!markerParam) {
            window.fitBoundsToNeighborhoods();
        }
    }

    // ==========================================
    // SORT HANDLER
    // ==========================================
    const sortRadios = document.querySelectorAll('input[name="sort"]');
    sortRadios.forEach(radio => {
        radio.addEventListener('change', e => {
            window.sortOrder = e.target.value;
            renderResults();
            if (sortMenu) sortMenu.classList.add('hidden');
        });
    });

    // ==========================================
    // SEARCH HANDLER
    // ==========================================
    let searchDebounceTimer = null;
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const queryRaw = e.target.value.trim();
            const query = queryRaw.toLowerCase();
            const results = document.getElementById('search-results');

            // Highlight matching text within a label (case-insensitive, HTML-safe)
            const highlightMatch = text => {
                if (!queryRaw) return text;
                const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const pattern = queryRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${pattern})`, 'ig');
                return safeText.replace(regex, '<strong>$1</strong>');
            };

            // Track search input (debounced)
            if (query && typeof gtag !== 'undefined') {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    gtag('event', 'search_filter', { search_term: query });
                }, 500);
            }

            if (!query) {
                // Show default "Most Listings" results
                const topListings = [...neighborhoods]
                    .sort((a, b) => (b.stats?.listingCount || 0) - (a.stats?.listingCount || 0))
                    .slice(0, 5);
                results.innerHTML = `
                            <div class="px-4 py-2 text-xs font-medium text-neutral-400 dark:text-dark-text-secondary uppercase">Most Listings</div>
                            ${topListings
                                .map(
                                    n => `
                                <button class="search-result w-full text-left px-4 py-2 text-sm hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors cursor-pointer" data-name="${n.name}" data-type="${n.propertyType}">
                                    ${n.name} - ${n.propertyType}
                                </button>
                            `
                                )
                                .join('')}
                        `;
            } else {
                // Filter by query - prioritize name matches, all scrollable
                const matches = neighborhoods
                    .filter(
                        n =>
                            n.name.toLowerCase().includes(query) ||
                            (n.location?.city || '').toLowerCase().includes(query) ||
                            (n.zipCode || '').includes(query)
                    )
                    .sort((a, b) => {
                        const aNameMatch = a.name.toLowerCase().includes(query) ? 0 : 1;
                        const bNameMatch = b.name.toLowerCase().includes(query) ? 0 : 1;
                        if (aNameMatch !== bNameMatch) return aNameMatch - bNameMatch;
                        return a.name.localeCompare(b.name);
                    });

                if (matches.length) {
                    results.innerHTML = matches
                        .map(
                            n => `
                                <button class="search-result w-full text-left px-4 py-2 text-sm hover:bg-brand-100 dark:hover:bg-brand-dark/20 transition-colors cursor-pointer" data-name="${n.name}" data-type="${n.propertyType}">
                                    ${highlightMatch(n.name)} - ${highlightMatch(n.propertyType)}
                                </button>
                            `
                        )
                        .join('');
                } else {
                    results.innerHTML = '<div class="px-4 py-3 text-sm text-neutral-400">No matches found</div>';
                }
            }

            // Detect search results overflow and add fade class if needed
            const searchResultsEl = document.getElementById('search-results');
            if (searchResultsEl && searchResultsEl.scrollHeight > searchResultsEl.clientHeight + 4) {
                searchResultsEl.classList.add('has-overflow');
            } else if (searchResultsEl) {
                searchResultsEl.classList.remove('has-overflow');
            }

            // Live filter the main results list AND markers
            window.searchQuery = query;
            if (query) {
                // Filter neighborhoods by search query
                window.filteredNeighborhoods = (window.neighborhoods || []).filter(n =>
                    n.name.toLowerCase().includes(query)
                );
            } else {
                // Reset to all neighborhoods when search is cleared
                window.filteredNeighborhoods = [...(window.neighborhoods || [])];
            }
            renderResults();
            // Update markers on map to match filtered list
            if (window.addMarkers) window.addMarkers();
        });
    }

    // Event delegation for search result clicks (handles both "Most Listings" and search results)
    const searchResultsContainer = document.getElementById('search-results');
    if (searchResultsContainer) {
        searchResultsContainer.addEventListener('click', function (e) {
            const btn = e.target.closest('.search-result');
            if (!btn) return;

            const name = btn.dataset.name;
            const type = btn.dataset.type;
            const n = (window.neighborhoods || []).find(x => x.name === name && x.propertyType === type);

            if (n && window.map) {
                // Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'search_select', {
                        neighborhood_name: n.name,
                        search_query: searchInput?.value || ''
                    });
                }

                // Smooth fly animation
                window.smoothFlyTo(n.position);

                const marker = (window.markers || []).find(
                    m => m.neighborhood.name === name && m.neighborhood.propertyType === type
                );
                if (marker) {
                    // Calculate distance to determine delay
                    const startPos = window.map.getCenter();
                    const targetLatLng = new google.maps.LatLng(n.position);
                    const distance = google.maps.geometry.spherical.computeDistanceBetween(startPos, targetLatLng);
                    const delay = distance < 2000 ? 450 : 2200;

                    setTimeout(() => {
                        google.maps.event.trigger(marker.marker, 'click');
                    }, delay);
                }

                // Keep drawer open so users can browse multiple results
            }

            // Close dropdown and clear search
            if (searchDropdown) searchDropdown.classList.add('hidden');
            if (searchInput) searchInput.value = '';

            // Clear search filter and reset list + markers
            window.searchQuery = '';
            window.filteredNeighborhoods = [...(window.neighborhoods || [])];
            renderResults();
            if (window.addMarkers) window.addMarkers();
        });
    }

    // Initial render
    renderResults();

    // iOS viewport handling - reposition dropdowns when keyboard appears/disappears
    if (window.visualViewport) {
        const repositionDropdowns = () => {
            const sortMenu = document.getElementById('sort-menu');
            const searchDropdown = document.getElementById('search-dropdown');
            if (sortMenu && !sortMenu.classList.contains('hidden')) {
                // Trigger reposition by toggling visibility
                sortMenu.classList.add('hidden');
                setTimeout(() => sortMenu.classList.remove('hidden'), 10);
            }
            if (searchDropdown && !searchDropdown.classList.contains('hidden')) {
                const searchInput = document.getElementById('search-input');
                // Don't close if search input is focused (iOS keyboard appearing)
                if (document.activeElement !== searchInput) {
                    searchDropdown.classList.add('hidden');
                }
            }
        };
        window.visualViewport.addEventListener('resize', repositionDropdowns);
        window.visualViewport.addEventListener('scroll', repositionDropdowns);
    }
}

// Run when data is loaded (from ES module)
window.addEventListener('dataLoaded', initApp);
// Also run on DOMContentLoaded if data already loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.neighborhoods && window.neighborhoods.length > 0) {
        initApp();
    }
});

// ==========================================
// MAP INITIALIZATION AND MARKERS
// ==========================================

// Convert pixel offset to latitude offset using Mercator projection
function preCalculateOffsetLat(lat, offsetPixels, zoom) {
    const TILE_SIZE = 256;
    const scale = Math.pow(2, zoom);
    const latRad = (lat * Math.PI) / 180;
    const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const pixelsPerRadian = (TILE_SIZE * scale) / (2 * Math.PI);
    const newMercY = mercY + offsetPixels / pixelsPerRadian;
    const newLatRad = 2 * Math.atan(Math.exp(newMercY)) - Math.PI / 2;
    return (newLatRad * 180) / Math.PI;
}

// Centering offset for card+marker combo (see DOCUMENTATION.md for details)
function computeOffsetPx(zoomLevel, isAreaMarker = false) {
    const mapDiv = document.getElementById('map');
    const w = mapDiv?.offsetWidth || window.innerWidth;
    const dvh = mapDiv?.offsetHeight || window.innerHeight;

    const baseCardHeight = w < 640 ? 450 : w < 1024 ? 380 : 340;
    const cardHeight = isAreaMarker ? baseCardHeight + 70 : baseCardHeight;
    // Use constants from centering.js (single source of truth)
    const tailHeight = window.TAIL_HEIGHT || 78;
    const markerRadius = window.MARKER_RADIUS || 10;
    const comboHeight = cardHeight + tailHeight + markerRadius;
    const canCenter = dvh >= 450 && comboHeight < dvh - 40;

    if (canCenter) {
        return Math.round((cardHeight + tailHeight - markerRadius) / 2);
    } else {
        const markerY = 20 + cardHeight + tailHeight + markerRadius;
        return Math.round(Math.max(0, markerY - dvh / 2));
    }
}

function calculateInitialOffset(zoomLevel, isAreaMarker = false) {
    return computeOffsetPx(zoomLevel, isAreaMarker);
}

function getOpenInfoWindowCardHeightPx() {
    const iw = document.querySelector('.gm-style-iw-c');
    if (iw) return iw.getBoundingClientRect().height;
    const fallback = document.querySelector('.info-window');
    return fallback ? fallback.getBoundingClientRect().height : 0;
}

let singleModeResizeObserver = null;
let initialCenteringComplete = false;
let diagnosticsLogged = false;

// Fade out the loading overlay
function fadeOutOverlay() {
    const overlay = document.getElementById('single-mode-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            console.log('Single mode: overlay hidden');
        }, 300); // Match CSS transition duration
    }
}

function applySingleModeCenteringFromRenderedCard(markerLatLng, attempt = 0, isInitialCentering = false) {
    const map = window.map;
    if (!map || !markerLatLng) return;

    const iwContainer = document.querySelector('.gm-style-iw-c');
    if (!iwContainer) {
        if (attempt < 20) {
            return requestAnimationFrame(() =>
                applySingleModeCenteringFromRenderedCard(markerLatLng, attempt + 1, isInitialCentering)
            );
        }
        return;
    }

    const cardH = iwContainer.getBoundingClientRect().height;
    const mapEl = document.getElementById('map') || map.getDiv();
    const dvh = mapEl?.getBoundingClientRect?.().height || mapEl?.offsetHeight || window.innerHeight;
    // Use constants from centering.js (single source of truth)
    const tailHeight = window.TAIL_HEIGHT || 78;
    const markerRadius = window.MARKER_RADIUS || 10;
    const comboH = cardH + tailHeight + markerRadius;
    const canCenter = dvh >= 450 && comboH < dvh - 40;

    // Calculate actual offset from rendered card
    const actualOffsetPx = canCenter
        ? Math.round((cardH + tailHeight - markerRadius) / 2)
        : Math.round(Math.max(0, 20 + cardH + tailHeight + markerRadius - dvh / 2));

    // Always apply correction based on actual rendered card height (more accurate than heuristic)
    const zoom = map.getZoom();
    const adjustedLat = preCalculateOffsetLat(markerLatLng.lat(), actualOffsetPx, zoom);
    map.setCenter({ lat: adjustedLat, lng: markerLatLng.lng() });
    console.log('Single mode: applied centering with actual card height, offset:', actualOffsetPx, 'px');
    window.singleModeOffsetApplied = true;

    // Log diagnostics once
    if (!diagnosticsLogged) {
        diagnosticsLogged = true;
        setTimeout(() => {
            window.logCenteringDiagnostics?.(markerLatLng);
        }, 500);
    }
}

function initMap() {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;

    // Clear placeholder
    mapDiv.innerHTML = '';

    // Check for single mode
    const urlParams = getUrlParams();
    const isSingleMode = urlParams.get('mode') === 'single';
    const neighborhoodSlug = urlParams.get('neighborhood') || urlParams.get('marker');
    window.isSingleMode = isSingleMode; // Set early to prevent race condition with center_changed listener

    // Determine initial center and zoom
    let initialCenter = { lat: 30.32, lng: -86.05 }; // Default: Emerald Coast
    let initialZoom = 11; // Default: zoomed out

    // In single mode, center on target neighborhood or area (offset applied after map ready)
    // Use synchronous position objects first - no race condition
    let singleModeTarget = null;
    const areaSlug = urlParams.get('area');

    if (isSingleMode && neighborhoodSlug) {
        // Check NEIGHBORHOOD_POSITIONS first (synchronous, race-free)
        const neighborhoodPosition = window.NEIGHBORHOOD_POSITIONS?.[neighborhoodSlug];
        if (neighborhoodPosition) {
            initialZoom = parseInt(urlParams.get('zoom')) || 13;
            initialCenter = neighborhoodPosition;
            singleModeTarget = neighborhoodPosition;
            console.log('Single mode: using NEIGHBORHOOD_POSITIONS for', neighborhoodSlug);
        } else if (window.neighborhoods) {
            // Fallback to async neighborhoods data
            const target = window.neighborhoods.find(n => window.toSlug && window.toSlug(n.name) === neighborhoodSlug);
            if (target && target.position) {
                initialZoom = parseInt(urlParams.get('zoom')) || 13;
                initialCenter = target.position;
                singleModeTarget = target.position;
            }
        }
        // If still no match, check AREA_POSITIONS (might be area slug in neighborhood param)
        if (!singleModeTarget) {
            const areaPosition = window.AREA_POSITIONS?.[neighborhoodSlug];
            if (areaPosition) {
                initialZoom = parseInt(urlParams.get('zoom')) || 13;
                initialCenter = areaPosition;
                singleModeTarget = areaPosition;
                window.singleModeIsArea = true;
                console.log('Single mode: using AREA_POSITIONS for', neighborhoodSlug);
            }
        }
    } else if (isSingleMode && areaSlug) {
        // Area single mode via ?area= param - use AREA_POSITIONS first (synchronous)
        const areaPosition = window.AREA_POSITIONS?.[areaSlug];
        if (areaPosition) {
            initialZoom = parseInt(urlParams.get('zoom')) || 13;
            initialCenter = areaPosition;
            singleModeTarget = areaPosition;
            window.singleModeIsArea = true;
            console.log('Single mode: using AREA_POSITIONS for', areaSlug);
        } else {
            // Fallback to async areaPresets
            const presetData = window.areaPresets?.presets?.find(s => s.slug === areaSlug);
            if (presetData && presetData.position) {
                initialZoom = parseInt(urlParams.get('zoom')) || 13;
                initialCenter = presetData.position;
                singleModeTarget = presetData.position;
                window.singleModeIsArea = true;
            }
        }
    }

    // Single mode: Show loading overlay, initialize at PRE-OFFSET position
    // Pre-offset uses estimated card height; micro-correction applied after InfoWindow renders if needed
    let mapCenter = initialCenter;
    window.singleModeOffsetApplied = false;
    window.singleModeTarget = singleModeTarget; // Store for later centering

    if (isSingleMode && singleModeTarget) {
        // Show loading overlay immediately
        const overlay = document.getElementById('single-mode-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
        }
        // Pre-calculate offset so map starts at correct position (no shift when card renders)
        const isAreaMarker = window.singleModeIsArea || false;
        const estimatedOffsetPx = computeOffsetPx(initialZoom, isAreaMarker);
        const preOffsetLat = preCalculateOffsetLat(initialCenter.lat, estimatedOffsetPx, initialZoom);
        mapCenter = { lat: preOffsetLat, lng: initialCenter.lng };
        console.log('Single mode: pre-offset applied, estimated offset:', estimatedOffsetPx, 'px');

        // Fallback: fade overlay after 5s even if something goes wrong
        setTimeout(() => {
            if (!initialCenteringComplete) {
                console.warn('Single mode: fallback timeout - fading overlay');
                fadeOutOverlay();
                initialCenteringComplete = true;
            }
        }, 5000);
    }

    // Map center - pre-offset position in single mode (micro-correction after InfoWindow renders if needed)
    window.map = new google.maps.Map(mapDiv, {
        zoom: initialZoom,
        center: mapCenter,
        mapId: '92b2f4ea8b2fce54a50ed2e9',
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        clickableIcons: false
    });

    // Trigger resize to ensure map renders properly
    google.maps.event.trigger(window.map, 'resize');

    // Create info windows (click and hover)
    // disableAutoPan prevents Google Maps from moving the map when info window opens
    window.infoWindow = new google.maps.InfoWindow({ maxWidth: 320, disableAutoPan: true });
    window.hoverInfoWindow = new google.maps.InfoWindow({ maxWidth: 320, disableAutoPan: true });

    // Remove close button from info windows when they open
    // Using MutationObserver to actually remove element, not just hide
    function removeInfoWindowCloseButton() {
        const closeBtn = document.querySelector('.gm-style-iw-chr');
        if (closeBtn) {
            closeBtn.remove();
        }
    }

    window.infoWindow.addListener('domready', removeInfoWindowCloseButton);
    window.hoverInfoWindow.addListener('domready', removeInfoWindowCloseButton);

    // ==========================================
    // PRELOAD GEOJSON BOUNDARIES (for instant button clicks)
    // Delete this block if preloading causes issues
    // ==========================================
    const zipCodesToPreload = ['32541', '32459', '32550', '32461', '32413'];
    zipCodesToPreload.forEach(zip => {
        fetch(`./neighborhoods/jsons/${zip}.geojson`)
            .then(r => r.json())
            .catch(() => {}); // Silent fail - will load on-demand if preload fails
    });

    // Rendezvous: whoever finishes second (data or map) triggers markers
    window.tryInitializeMarkers = function () {
        if (window.markersInitialized) return;
        const neighborhoods = window.neighborhoods || [];
        if (!neighborhoods.length || !window.map || !window.addMarkers) return;

        window.markersInitialized = true;

        const urlParams = getUrlParams();
        const isSingleMode = urlParams.get('mode') === 'single';
        const neighborhoodSlug = urlParams.get('neighborhood') || urlParams.get('marker');
        const areaSlug = urlParams.get('area');

        // UNIFIED single mode handler for BOTH neighborhoods AND areas
        if (isSingleMode) {
            let target = null;

            // Find target - neighborhood or area
            if (neighborhoodSlug && !areaSlug && neighborhoods.length > 0) {
                const matching = neighborhoods.filter(n => window.toSlug(n.name) === neighborhoodSlug);
                if (matching.length > 0) {
                    const homes = matching.find(n => n.propertyType === 'Homes');
                    target = homes || matching[0];
                    window.neighborhoods = [target];
                    window.filteredNeighborhoods = [target];
                    console.log('Single mode: neighborhood', target.name);
                }
            } else if (areaSlug) {
                const presetData = window.areaPresets?.presets?.find(s => s.slug === areaSlug);
                if (presetData) {
                    target = window.createAreaMarkerData(presetData);
                    window.filteredNeighborhoods = [target];
                    console.log('Single mode: area', presetData.name);
                }
            }

            // No pre-offset here. We center precisely after the InfoWindow DOM is ready.
        }

        function openSingleModeMarker() {
            if (!window.markers || window.markers.length === 0) return false;
            const markerObj = window.markers[0];
            if (markerObj && markerObj.marker && markerObj.neighborhood) {
                console.log('Single mode: opening', markerObj.neighborhood.name);
                // Use correct info window function based on marker type
                if (markerObj.neighborhood.isAreaMarker) {
                    showAreaInfoWindowContent(markerObj.marker, markerObj.neighborhood, window.infoWindow);
                } else {
                    showInfoWindowContent(markerObj.marker, markerObj.neighborhood, window.infoWindow, true);
                }

                // After the card renders, re-apply centering using the real rendered height.
                // This corrects mismatches from heuristic card-height guesses across iframe sizes.
                google.maps.event.addListenerOnce(window.infoWindow, 'domready', () => {
                    requestAnimationFrame(() => {
                        const rawPos =
                            markerObj.neighborhood?.position ||
                            markerObj.marker?.position ||
                            (markerObj.marker?.getPosition && markerObj.marker.getPosition());
                        if (!rawPos) return;
                        const markerLatLng =
                            rawPos instanceof google.maps.LatLng ? rawPos : new google.maps.LatLng(rawPos);
                        // Apply centering and fade overlay immediately
                        applySingleModeCenteringFromRenderedCard(markerLatLng, 0, true); // true to trigger diagnostics
                        fadeOutOverlay();
                        // Set up ResizeObserver with debounce for subsequent changes
                        if (!window.singleModeResizeObserver) {
                            let resizeTimeout = null;
                            window.singleModeResizeObserver = new ResizeObserver(() => {
                                if (resizeTimeout) clearTimeout(resizeTimeout);
                                resizeTimeout = setTimeout(() => {
                                    applySingleModeCenteringFromRenderedCard(markerLatLng, 999, false);
                                }, 150);
                            });
                            const iwContainer = document.querySelector('.gm-style-iw-c');
                            if (iwContainer) {
                                window.singleModeResizeObserver.observe(iwContainer);
                            }
                        }
                    });
                });

                markerObj.marker.content.innerHTML = createMarkerSVG(markerObj.marker.markerColor, true);
                window.activeMarker = markerObj.marker;
                return true;
            }
            return false;
        }

        function afterMarkersAdded() {
            // Single mode (both area and neighborhood) - just poll and open marker, no centering
            if (isSingleMode && (areaSlug || neighborhoodSlug)) {
                setTimeout(() => {
                    let attempts = 0;
                    const pollMarker = () => {
                        attempts++;
                        if (openSingleModeMarker()) return;
                        if (attempts < 30) setTimeout(pollMarker, 100);
                        else console.warn('Single mode: marker not found after 3 seconds');
                    };
                    pollMarker();
                }, 300);
                return;
            }

            // Full mode
            const markerSlug = urlParams.get('marker');

            // Only fit to all neighborhoods if no marker param - otherwise we center on the marker
            if (!markerSlug) {
                window.fitBoundsToNeighborhoods();
            }

            if (markerSlug) {
                const presetData = window.areaPresets?.presets?.find(s => s.slug === markerSlug);
                if (presetData) {
                    // Wait for tiles to render, then click the button
                    // Button click handler triggers showAreaMarker
                    google.maps.event.addListenerOnce(window.map, 'tilesloaded', () => {
                        setTimeout(() => {
                            const btn = window.findAreaButton(presetData);
                            if (btn) btn.click();
                        }, 400);
                    });
                } else {
                    // Not an area preset - try to find a regular neighborhood
                    const propertyType = urlParams.get('propertyType') || 'Homes';
                    const matching = neighborhoods.filter(n => window.toSlug(n.name) === markerSlug);
                    if (matching.length > 0) {
                        // Prefer the specified propertyType, fallback to first match
                        const target = matching.find(n => n.propertyType === propertyType) || matching[0];

                        google.maps.event.addListenerOnce(window.map, 'tilesloaded', () => {
                            setTimeout(() => {
                                // Find the marker for this neighborhood
                                const markerObj = (window.markers || []).find(
                                    m =>
                                        m.neighborhood.name === target.name &&
                                        m.neighborhood.propertyType === target.propertyType
                                );
                                if (markerObj) {
                                    // Pan to pre-offset position for proper centering
                                    const targetZoom = 14;
                                    const offsetPx = computeOffsetPx(targetZoom, false); // false = not area marker
                                    const offsetLat = preCalculateOffsetLat(target.position.lat, offsetPx, targetZoom);
                                    const centeredPosition = { lat: offsetLat, lng: target.position.lng };
                                    window.map.setZoom(targetZoom);
                                    window.map.panTo(centeredPosition);
                                    setTimeout(() => {
                                        showInfoWindowContent(markerObj.marker, target, window.infoWindow, true);
                                        window.activeMarker = markerObj.marker;
                                        markerObj.marker.content.innerHTML = createMarkerSVG(
                                            markerObj.marker.markerColor,
                                            true
                                        );

                                        // Apply centering after card renders
                                        setTimeout(() => {
                                            requestAnimationFrame(() => {
                                                const markerLatLng = new google.maps.LatLng(target.position);
                                                applySingleModeCenteringFromRenderedCard(markerLatLng, 0, false);
                                            });
                                        }, 100);
                                    }, 800);
                                }
                            }, 400);
                        });
                    }
                }
            }
        }

        if (!window.filteredNeighborhoods || !window.filteredNeighborhoods.length) {
            window.filteredNeighborhoods = [...neighborhoods];
        }
        window.addMarkers();
        console.log('Map initialized with', window.filteredNeighborhoods.length, 'neighborhoods');
        afterMarkersAdded();
    };
    window.tryInitializeMarkers();

    // Log zoom level changes (only when integer zoom changes, not during animation)
    let lastLoggedZoom = null;
    window.map.addListener('idle', () => {
        if (window.map) {
            const currentZoom = Math.round(window.map.getZoom());
            if (currentZoom !== lastLoggedZoom) {
                console.log('Zoom:', currentZoom);
                lastLoggedZoom = currentZoom;
            }
        }
    });

    // Close info windows when clicking on the map background
    window.map.addListener('click', () => {
        if (window.infoWindow && window.infoWindow.getMap()) {
            window.infoWindow.close();
        }
        if (window.hoverInfoWindow && window.hoverInfoWindow.getMap()) {
            window.hoverInfoWindow.close();
        }
        // Deactivate ripple on active marker
        if (window.activeMarker && window.activeMarker.content) {
            window.activeMarker.content.innerHTML = createMarkerSVG(window.activeMarker.markerColor, false);
            window.activeMarker = null;
        }
    });

    // Re-anchor InfoWindow during pan (workaround for AdvancedMarkerElement)
    // Skip in single mode - interferes with offset centering timing
    if (!window.isSingleMode) {
        window.map.addListener('center_changed', () => {
            if (window.infoWindow && window.infoWindow.getMap() && window.activeMarker) {
                window.infoWindow.open({ map: window.map, anchor: window.activeMarker });
            }
        });
    }
}

// ==========================================
// GEOJSON BOUNDARY DISPLAY
// ==========================================
window.customBoundaries = new Set();

// Expose showCustomBoundary globally for theme toggle and filters
window.showCustomBoundary = function showCustomBoundary(zipCode) {
    if (!window.map || window.customBoundaries.has(zipCode)) return;
    window.customBoundaries.add(zipCode);

    window.map.data.loadGeoJson(
        `./neighborhoods/jsons/${zipCode}.geojson`,
        { idPropertyName: 'ZCTA5CE20' },
        function (features) {
            window.map.data.setStyle(function (feature) {
                const featureZip = feature.getProperty('ZCTA5CE20') || feature.getProperty('ZCTA5CE10');
                if (window.customBoundaries.has(featureZip)) {
                    const isDark = document.documentElement.classList.contains('dark');
                    const primaryColor = isDark ? '#5ba3ab' : '#4c8f96';
                    return {
                        strokeColor: primaryColor,
                        strokeWeight: 1.5,
                        strokeOpacity: 0.35,
                        fillColor: primaryColor,
                        fillOpacity: 0.15,
                        clickable: false
                    };
                }
                return { visible: false };
            });
        }
    );
};

// Expose hideCustomBoundary globally for filters
window.hideCustomBoundary = function hideCustomBoundary(zipCode) {
    if (!window.map || !window.customBoundaries.has(zipCode)) return;
    window.customBoundaries.delete(zipCode);

    window.map.data.forEach(function (feature) {
        const featureZip = feature.getProperty('ZCTA5CE20') || feature.getProperty('ZCTA5CE10');
        if (featureZip === zipCode) {
            window.map.data.remove(feature);
        }
    });
};

// ==========================================
// FIT BOUNDS TO FILTERED NEIGHBORHOODS
// ==========================================
window.fitBoundsToNeighborhoods = function fitBoundsToNeighborhoods(minZoom = 0) {
    const map = window.map;
    const filtered = window.filteredNeighborhoods || [];
    if (!map || filtered.length === 0) return;

    // Create bounds from all filtered neighborhoods
    const bounds = new google.maps.LatLngBounds();
    filtered.forEach(n => {
        if (n.position) {
            bounds.extend(new google.maps.LatLng(n.position));
        }
    });

    // Only fit if we have valid bounds
    if (!bounds.isEmpty()) {
        // Responsive padding: more breathing room on desktop
        const isMobile = window.innerWidth < 768;
        const sidePadding = isMobile ? 50 : 150;

        // Set maxZoom constraint BEFORE fitBounds so animation respects it
        map.setOptions({ maxZoom: 15 });

        // Use smooth animation via fitBounds with padding
        map.fitBounds(bounds, {
            top: 50,
            right: sidePadding,
            bottom: 60, // Account for disclaimer bar
            left: sidePadding
        });

        // After animation completes, reset maxZoom and apply minZoom if needed
        const listener = google.maps.event.addListener(map, 'idle', () => {
            // Reset maxZoom so user can manually zoom closer if desired
            map.setOptions({ maxZoom: 22 });

            if (!window.skipZoomAdjust) {
                const currentZoom = map.getZoom();
                // Apply minZoom (for single area selections, want more detail)
                if (minZoom > 0 && currentZoom < minZoom) {
                    map.setZoom(minZoom);
                }
            }
            google.maps.event.removeListener(listener);
        });
    }
};

/**
 * Calculate vertical pixel offset to center (card + marker) combo in viewport.
 *
 * SINGLE MODE (550px dvh, NO disclaimer):
 * ┌─────────────────────────┐ ← 0px
 * │     75px padding        │
 * ├─────────────────────────┤ ← 75px
 * │                         │
 * │     360px info card     │
 * │                         │
 * ├─────────────────────────┤ ← 435px
 * │  40px tail + marker     │  ← marker anchor at 475px
 * ├─────────────────────────┤ ← 475px
 * │     75px padding        │
 * └─────────────────────────┘ ← 550px (dvh)
 *
 * padding = (550 - 400) / 2 = 75px
 * markerAnchorFromTop = 75 + 400 = 475px
 * offset = 475 - 275 + 16 = 216px
 *
 * FULL MODE (550px dvh, 40px disclaimer):
 * ┌─────────────────────────┐ ← 0px
 * │     55px padding        │
 * ├─────────────────────────┤ ← 55px
 * │                         │
 * │     360px info card     │  effectiveViewport = 510px
 * │                         │
 * ├─────────────────────────┤ ← 415px
 * │  40px tail + marker     │  ← marker anchor at 455px
 * ├─────────────────────────┤ ← 455px
 * │     55px padding        │
 * ├─────────────────────────┤ ← 510px
 * │  40px disclaimer bar    │
 * └─────────────────────────┘ ← 550px (dvh)
 *
 * padding = (510 - 400) / 2 = 55px
 * markerAnchorFromTop = 55 + 400 = 455px
 * offset = 455 - 275 + 16 = 196px
 *
 * @param {number} zoomLevel - Current map zoom (unused, kept for API consistency)
 * @param {number} disclaimerHeight - Bottom bar height (0 for single mode, 40 for full mode)
 * @returns {number} Pixel offset for panBy()
 */
function calculateCenteredOffset(zoomLevel, disclaimerHeight = 0) {
    // Use computeOffsetPx as base, then adjust for disclaimer bar
    const baseOffset = computeOffsetPx(zoomLevel, false);
    return Math.round(baseOffset + disclaimerHeight / 2);
}

function offsetLatLng(latLng, offsetPixels, zoomLevel) {
    const map = window.map;
    const scale = Math.pow(2, zoomLevel || map.getZoom());
    const worldCoordinate = map.getProjection().fromLatLngToPoint(new google.maps.LatLng(latLng));
    const pixelOffset = new google.maps.Point(0, -offsetPixels / scale);
    const newWorldCoordinate = new google.maps.Point(worldCoordinate.x, worldCoordinate.y + pixelOffset.y);
    const newLatLng = map.getProjection().fromPointToLatLng(newWorldCoordinate);
    console.log('offsetLatLng:', {
        inputLat: latLng.lat,
        offsetPx: offsetPixels,
        zoom: zoomLevel,
        scale,
        outputLat: newLatLng.lat(),
        latDiff: newLatLng.lat() - latLng.lat
    });
    return { lat: newLatLng.lat(), lng: latLng.lng };
}

// ==========================================
// SMOOTH FLY ANIMATION
// ==========================================
window.smoothFlyTo = function smoothFlyTo(targetPosition, targetZoom) {
    const map = window.map;
    if (!map) return;

    // Use CONFIG for default zoom
    const cfg = window.CONFIG?.map || {};
    if (targetZoom === undefined) {
        targetZoom = cfg.defaultZoom || 14;
    }

    const startPos = map.getCenter();
    const startZoom = map.getZoom();
    const targetLatLng = new google.maps.LatLng(targetPosition);

    // Calculate offset for visual centering (marker + info card)
    // Full mode has 40px disclaimer bar
    const disclaimerHeight = 40;
    const offsetPixels = calculateCenteredOffset(targetZoom, disclaimerHeight);
    const offsetTarget = offsetLatLng(targetPosition, offsetPixels, targetZoom);

    // Calculate distance from marker-to-marker (not center-to-marker)
    // Reverse the offset on startPos to get approximate marker position
    const startOffsetPixels = calculateCenteredOffset(startZoom, disclaimerHeight);
    const startMarkerPos = offsetLatLng({ lat: startPos.lat(), lng: startPos.lng() }, -startOffsetPixels, startZoom);
    const startMarkerLatLng = new google.maps.LatLng(startMarkerPos);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(startMarkerLatLng, targetLatLng);

    // Get flight settings from CONFIG
    const arc = cfg.flightZoomArc || {};
    const dur = cfg.flightDuration || {};

    // Animated flight with zoom arc (all distances get arc now)
    const startTime = performance.now();

    // Duration from CONFIG.map.flightDuration
    let duration;
    if (distance < 1000) {
        duration = dur.micro || 800;
    } else if (distance < 2000) {
        duration = dur.short || 1200;
    } else {
        duration = dur.medium || 2000;
    }

    // minZoom from CONFIG.map.flightZoomArc
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
    // When at fitBounds (zoomed out), pan at current level then zoom in
    if (startZoom >= targetZoom) {
        // Starting zoomed in - apply arc (zoom out, then back in)
        minZoom = Math.min(minZoom, startZoom - 1, targetZoom - 1);
    } else {
        // Starting zoomed out (fitBounds view) - no arc, pan then zoom in
        minZoom = startZoom;
    }

    console.log(`Flight: ${jumpType} | ${(distance / 1000).toFixed(2)}km | minZoom=${minZoom}`);

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // EaseInOutCubic
        const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

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

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
};

// Navigate between neighborhoods (Prev/Next buttons in info window)
window.navigateNeighborhood = function (direction) {
    const filtered = window.filteredNeighborhoods || [];
    if (filtered.length < 1) return;

    console.log(
        '[Nav Debug] filteredNeighborhoods count:',
        filtered.length,
        'first 3:',
        filtered.slice(0, 3).map(n => n.name)
    );

    // Sort by current sort order (matches sidebar list order)
    const currentSort = window.sortOrder || 'listings-desc';
    const sorted = [...filtered].sort((a, b) => {
        const aPrice = a.stats?.medianPrice || a.stats?.avgPrice || 0;
        const bPrice = b.stats?.medianPrice || b.stats?.avgPrice || 0;
        const aListings = a.stats?.listingCount || 0;
        const bListings = b.stats?.listingCount || 0;
        switch (currentSort) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'price-asc':
                return aPrice - bPrice;
            case 'price-desc':
                return bPrice - aPrice;
            case 'listings-desc':
                return bListings - aListings;
            default:
                return a.name.localeCompare(b.name);
        }
    });

    // Find current index - if no current neighborhood (e.g., from area marker), start from beginning/end
    const current = window.currentNeighborhood;
    let currentIndex = -1;
    if (current && !current.isAreaMarker) {
        currentIndex = sorted.findIndex(n => n.name === current.name && n.propertyType === current.propertyType);
    }

    // Calculate next index
    let nextIndex;
    if (currentIndex === -1) {
        // No current neighborhood (area marker or first navigation) - go to first or last
        nextIndex = direction === 1 ? 0 : sorted.length - 1;
    } else {
        // Normal navigation with wrap around
        nextIndex = currentIndex + direction;
        if (nextIndex < 0) nextIndex = sorted.length - 1;
        if (nextIndex >= sorted.length) nextIndex = 0;
    }

    const nextN = sorted[nextIndex];
    if (!nextN) return;

    console.log(
        '[Nav Debug] navigating to:',
        nextN.name,
        'position:',
        nextN.position,
        'index:',
        nextIndex,
        'of',
        sorted.length
    );

    // Find marker and trigger flight animation
    const markerData = (window.markers || []).find(
        m => m.neighborhood.name === nextN.name && m.neighborhood.propertyType === nextN.propertyType
    );
    if (markerData && markerData.marker) {
        // Highlight the clicked nav button
        const btnId = direction === -1 ? 'nav-prev' : 'nav-next';
        const navBtn = document.getElementById(btnId);
        if (navBtn) {
            navBtn.classList.add('bg-brand-100', 'dark:bg-brand-dark/20');
        }

        // Delay to show highlight, then close and animate
        setTimeout(() => {
            // Close current info window
            if (window.infoWindow && window.infoWindow.getMap()) {
                window.infoWindow.close();
            }
            // Deactivate current marker ripple
            if (window.activeMarker && window.activeMarker.content) {
                window.activeMarker.content.innerHTML = createMarkerSVG(window.activeMarker.markerColor, false);
                window.activeMarker = null;
            }

            // Fly to new location (maintain current zoom to preserve sub-area context)
            window.smoothFlyTo(nextN.position, window.map.getZoom());

            // Open info window after flight completes
            const startPos = window.map.getCenter();
            const targetLatLng = new google.maps.LatLng(nextN.position);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(startPos, targetLatLng);
            const delay = distance < 2000 ? 450 : 2200;

            setTimeout(() => {
                google.maps.event.trigger(markerData.marker, 'click');
            }, delay);
        }, 150); // Show highlight for 150ms before closing
    }
};

// Marker colors (matches production markers.js)
const MARKER_COLORS = {
    urlSlug: '#4c8f96', // Teal - has URL slug (SEO page)
    listingsLink: '#4a5462', // Dark gray - has dynamic listings link (via subdivision)
    noData: '#9ca3af' // Light gray - no data
};

// Track active marker for ripple animation
window.activeMarker = null;

// Create marker SVG (matches production createMarkerIcon)
function createMarkerSVG(color, isActive = false) {
    const size = isActive ? 44 : 32;
    const dotSize = isActive ? 10 : 6;
    const strokeWidth = isActive ? 3 : 2;

    return `
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                    ${
                        isActive
                            ? `
                        <circle cx="${size / 2}" cy="${size / 2}" r="${dotSize}"
                            fill="none"
                            stroke="${color}"
                            stroke-width="4"
                            opacity="0.7">
                            <animate attributeName="r"
                                from="${dotSize}"
                                to="${size / 2 - 2}"
                                dur="1.5s"
                                repeatCount="indefinite"/>
                            <animate attributeName="opacity"
                                from="0.7"
                                to="0"
                                dur="1.5s"
                                repeatCount="indefinite"/>
                        </circle>
                    `
                            : ''
                    }
                    <circle cx="${size / 2}" cy="${size / 2}" r="${dotSize}"
                        fill="${color}"
                        stroke="white"
                        stroke-opacity="0.75"
                        stroke-width="${strokeWidth}"/>
                </svg>
            `;
}

// Show info window content for area markers
function showAreaInfoWindowContent(marker, area, targetInfoWindow) {
    const stats = area.stats || {};
    const formatPrice = window.formatPrice || (p => '$' + (p / 1000000).toFixed(1) + 'M');
    const neighborhoodsList = (area.neighborhoods || [])
        .slice(0, 10)
        .map(n => n.name)
        .join(', ');

    const content = `
                <div class="info-window p-2 sm:p-3 max-w-sm bg-white dark:bg-dark-bg-elevated">
                    <h3 class="text-base sm:text-lg font-semibold text-neutral-800 dark:text-dark-text-primary mb-2 text-center">${area.name}</h3>
                    <div class="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                        <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                            <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">${stats.listingCount || 0}</div>
                            <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Active Listings</div>
                        </div>
                        <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                            <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">${formatPrice(stats.medianPrice || 0)}</div>
                            <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Median Price</div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                        <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                            <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">$${(stats.avgPricePerSqFt || 0).toLocaleString()}</div>
                            <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Avg $/Sq Ft</div>
                        </div>
                        <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                            <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary">${stats.avgDom || 0}</div>
                            <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Avg DOM</div>
                        </div>
                    </div>
                    <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 p-2 sm:p-3 rounded-lg border border-neutral-200 dark:border-dark-border mb-2 sm:mb-3">
                        <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-1">Top Communities</div>
                        <div class="communities-scroll text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">${neighborhoodsList}</div>
                    </div>
                    <hr class="divider mb-2 sm:mb-3">
                    <div class="pt-2 sm:pt-3 flex items-center gap-1.5 sm:gap-2">
                        ${(() => {
                            const filtered = window.filteredNeighborhoods || [];
                            const hasNav = filtered.length > 1;
                            const prevBtn = hasNav
                                ? '<button id="nav-prev" onclick="window.navigateNeighborhood(-1)" class="p-2 rounded-full border border-neutral-300 dark:border-dark-border hover:bg-brand-100 dark:hover:bg-brand-dark/20 text-neutral-600 dark:text-dark-text-secondary transition-colors flex-shrink-0 focus-ring" title="Previous Community"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>'
                                : '';
                            const nextBtn = hasNav
                                ? '<button id="nav-next" onclick="window.navigateNeighborhood(1)" class="p-2 rounded-full border border-neutral-300 dark:border-dark-border hover:bg-brand-100 dark:hover:bg-brand-dark/20 text-neutral-600 dark:text-dark-text-secondary transition-colors flex-shrink-0 focus-ring" title="Next Community"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>'
                                : '';

                            if (window.isSingleMode) {
                                // Single mode: Neighborhood Finder button with popout icon
                                const baseUrl =
                                    window.location.hostname === 'localhost'
                                        ? window.location.origin
                                        : 'https://neighborhoods.truesouthcoastalhomes.com';
                                const areaSlug = area.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                const finderUrl = baseUrl + '?marker=' + areaSlug;
                                return (
                                    prevBtn +
                                    '<a href="' +
                                    finderUrl +
                                    '" target="_blank" class="flex-1 text-center bg-brand-500 dark:bg-brand-dark hover:bg-brand-600 dark:hover:bg-brand-dark-hover text-white py-2.5 px-4 rounded-lg font-medium transition-colors" title="Open ' +
                                    area.name +
                                    ' in Neighborhood Finder">Neighborhood Finder&trade; <svg style="display:inline;width:1.1em;height:1.1em;vertical-align:middle;margin-left:2px" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>' +
                                    nextBtn
                                );
                            } else {
                                // Full mode: Matching Listings button
                                // Look up listingsParam from area_mappings.json (loaded as areaPresets)
                                const areaConfig = (window.areaPresets?.presets || []).find(p => p.name === area.name);
                                const areaParam =
                                    areaConfig?.listingsParam || 'area_' + encodeURIComponent(area.name) + '/';
                                const listingsUrl =
                                    'https://www.truesouthcoastalhomes.com/property-search/results/?searchtype=3#listtype_1/' +
                                    areaParam;
                                return (
                                    prevBtn +
                                    '<a href="' +
                                    listingsUrl +
                                    '" target="_blank" class="flex-1 text-center bg-brand-500 dark:bg-brand-dark hover:bg-brand-600 dark:hover:bg-brand-dark-hover text-white py-2.5 px-4 rounded-lg font-medium transition-colors" onclick="event.stopPropagation();" title="View all ' +
                                    area.name +
                                    ' listings">Matching Listings</a>' +
                                    nextBtn
                                );
                            }
                        })()}
                    </div>
                </div>
            `;

    targetInfoWindow.setContent(content);
    targetInfoWindow.open(window.map, marker);

    // After info window renders: detect overflow AND fine-tune centering based on actual height
    google.maps.event.addListenerOnce(targetInfoWindow, 'domready', () => {
        // Detect communities overflow and add fade class
        const communitiesEl = document.querySelector('.communities-scroll');
        if (communitiesEl && communitiesEl.scrollHeight > communitiesEl.clientHeight + 4) {
            communitiesEl.classList.add('has-overflow');
        }
        // Apply centering correction and log diagnostics (skip for single mode - handled separately)
        if (!window.isSingleMode) {
            setTimeout(() => {
                if (marker?.position) {
                    if (window.applyMicroCenteringCorrection) {
                        window.applyMicroCenteringCorrection(marker.position, 100);
                    }
                    if (window.logCenteringDiagnostics) {
                        window.logCenteringDiagnostics(marker.position);
                    }
                }
            }, 300);
        }
    });
}

// Show info window content (matches production markers.js)
// Called by both click and hover handlers
function showInfoWindowContent(marker, n, targetInfoWindow, storeAsActive = true) {
    // Handle area markers
    if (n.isAreaMarker) {
        return showAreaInfoWindowContent(marker, n, targetInfoWindow);
    }

    // Only store as current neighborhood for primary (click) window
    if (storeAsActive && targetInfoWindow === window.infoWindow) {
        window.currentNeighborhood = n;
    }

    const formatPrice = window.formatPrice || (p => '$' + (p / 1000000).toFixed(1) + 'M');
    const stats = n.stats || {};
    const medianPrice = stats.medianPrice || stats.avgPrice || 0;
    const medianPriceDisplay = formatPrice(medianPrice);
    const pricePerSqFt =
        stats.avgPricePerSqFt || (stats.avgSqft > 0 ? Math.round((stats.avgPrice || 0) / stats.avgSqft) : 0);
    const listingLabel = (() => {
        const t = (n.propertyType || '').toLowerCase();
        if (t.includes('townhome')) return 'Active T/H Listings';
        if (t.includes('condo')) return 'Active Condo Listings';
        if (t.includes('home')) return 'Active Home Listings';
        return 'Active Listings';
    })();
    const selectedAmenities =
        window.filterState && window.filterState.amenities ? window.filterState.amenities : new Set();
    const formatAmenitiesList = (list = []) => {
        const escape = str => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return (
            list
                .map(a => {
                    const safe = escape(a);
                    return selectedAmenities.has(a) ? `<strong>${safe}</strong>` : safe;
                })
                .join(', ') + '.'
        );
    };

    // Build listings URL with filter slugs (dynamic subdivision linking)
    const propertyType = (n.propertyType || 'homes').toLowerCase();

    // Dynamic filter slugs from filterState
    const fs = window.filterState || {};
    const bedsMin = fs.bedsMin || 1;
    const bathsMin = fs.bathsMin || 1;
    const priceMin = fs.priceMin > 0 ? window.PRICE_STEPS[fs.priceMin] : null;
    const priceMax = fs.priceMax < 41 ? window.PRICE_STEPS[fs.priceMax] : null;

    const bedsSlug = bedsMin > 1 ? `beds_${bedsMin}/` : '';
    const bathsSlug = bathsMin > 1 ? `baths_${bathsMin}/` : '';
    const priceMinSlug = priceMin ? `lprice_${priceMin}/` : '';
    const priceMaxSlug = priceMax && priceMax < 35000000 ? `uprice_${priceMax}/` : '';

    // Determine property type descrip
    let typeDescrip = '';
    if (propertyType.includes('townhome')) {
        typeDescrip = 'listtypedescrip_attached%20single%20unit/';
    } else if (propertyType.includes('condo')) {
        typeDescrip = 'listtypedescrip_condominium/';
    } else if (propertyType.includes('lot') || propertyType.includes('land') || propertyType.includes('vacant')) {
        typeDescrip = '';
    } else {
        typeDescrip = 'listtypedescrip_detached%20single%20family/';
    }

    // Determine listtype based on property type
    let listType = 'listtype_1';
    if (propertyType.includes('lot') || propertyType.includes('land') || propertyType.includes('vacant')) {
        listType = 'listtype_4';
    }

    const slugPart = `#${listType}/${priceMinSlug}${priceMaxSlug}${bedsSlug}${bathsSlug}${typeDescrip}`;

    // Build search parameter using subdivision names (dynamic linking)
    // Priority: 1) mlsSubdivisions (comma-separated MLS names), 2) n.name (canonical)
    let searchParam;
    if (n.mlsSubdivisions && n.mlsSubdivisions.length > 0) {
        const subdivisions = n.mlsSubdivisions.map(s => s.replace(/ /g, '+')).join(',');
        searchParam = `subdivision=${subdivisions}`;
    } else {
        const subdivisionName = n.name.replace(/ /g, '+');
        searchParam = `subdivision=${subdivisionName}`;
    }

    const listingsUrl = `https://www.truesouthcoastalhomes.com/property-search/results/?searchtype=3&${searchParam}${slugPart}`;

    const filtered = window.filteredNeighborhoods || [];
    const hasNav = filtered.length > 1;

    const content = `
                <div class="info-window p-2 sm:p-3 max-w-sm bg-white dark:bg-dark-bg-elevated" style="cursor: pointer;" tabindex="-1">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <h3 class="text-base sm:text-lg font-semibold text-neutral-800 dark:text-dark-text-primary">${n.name}</h3>
                        ${
                            n.urlSlug
                                ? `
                        <a href="https://www.truesouthcoastalhomes.com${n.urlSlug}"
                           target="_blank"
                           class="text-brand-500 dark:text-brand-dark hover:text-brand-600 dark:hover:text-brand-dark-hover transition-colors focus-ring rounded"
                           onclick="event.stopPropagation();"
                           title="${n.name} ${n.propertyType} for Sale">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                        </a>
                        `
                                : ''
                        }
                    </div>
                    <div class="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                        <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                            <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">${stats.listingCount || 0}</div>
                            <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">${listingLabel}</div>
                        </div>
                        <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                            <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">${medianPriceDisplay}</div>
                            <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Med List Price</div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                        <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                            <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">$${pricePerSqFt.toLocaleString()}</div>
                            <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Avg $/Sq Ft</div>
                        </div>
                        <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                            <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-0.5">${stats.avgDom || 0}</div>
                            <div class="text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary">Avg DOM</div>
                        </div>
                    </div>
                    ${
                        (n.amenities || []).length > 0
                            ? `
                    <div class="mb-2 sm:mb-3">
                        <div class="bg-neutral-50 dark:bg-dark-bg-elevated-2 p-2 sm:p-3 rounded-lg border border-neutral-200 dark:border-dark-border">
                            <div class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-dark-text-primary mb-1">Amenities</div>
                            <div class="amenities-scroll text-[10px] sm:text-xs text-neutral-600 dark:text-dark-text-secondary leading-tight">${formatAmenitiesList(n.amenities || [])}</div>
                        </div>
                    </div>
                    `
                            : ''
                    }
                    <hr class="divider mb-2 sm:mb-3">
                    <div class="pt-2 sm:pt-3 flex items-center gap-1.5 sm:gap-2">
                        ${
                            hasNav
                                ? `
                        <button id="nav-prev" onclick="window.navigateNeighborhood(-1)" class="p-2 rounded-full border border-neutral-300 dark:border-dark-border hover:bg-brand-100 dark:hover:bg-brand-dark/20 text-neutral-600 dark:text-dark-text-secondary transition-colors flex-shrink-0 focus-ring" title="Previous Community">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        `
                                : ''
                        }
                        ${(() => {
                            const isSingleMode = window.isSingleMode;
                            if (isSingleMode) {
                                // Single mode: link to Community Finder with marker parameter
                                const neighborhoodSlug = window.toSlug(n.name);
                                const propertyTypeParam = n.propertyType
                                    ? '&propertyType=' + encodeURIComponent(n.propertyType)
                                    : '';
                                const baseUrl =
                                    window.location.hostname === 'localhost'
                                        ? window.location.origin
                                        : 'https://neighborhoods.truesouthcoastalhomes.com';
                                const finderUrl = baseUrl + '?marker=' + neighborhoodSlug + propertyTypeParam;
                                return (
                                    '<a href="' +
                                    finderUrl +
                                    '" target="_blank" class="flex-1 text-center bg-brand-500 dark:bg-brand-dark hover:bg-brand-600 dark:hover:bg-brand-dark-hover text-white py-2.5 px-4 rounded-lg font-medium transition-colors" title="Open ' +
                                    n.name +
                                    ' in Neighborhood Finder">Neighborhood Finder&trade; <svg style="display:inline;width:1.1em;height:1.1em;vertical-align:middle;margin-left:2px" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>'
                                );
                            } else if (listingsUrl) {
                                return (
                                    '<a href="' +
                                    listingsUrl +
                                    "\" target=\"_blank\" class=\"flex-1 text-center bg-brand-500 dark:bg-brand-dark hover:bg-brand-600 dark:hover:bg-brand-dark-hover text-white py-2.5 px-4 rounded-lg font-medium transition-colors\" onclick=\"event.stopPropagation(); if(typeof gtag!=='undefined')gtag('event','view_listings',{neighborhood_name:'" +
                                    n.name +
                                    "',listing_count:" +
                                    (stats.listingCount || 0) +
                                    ",property_type:'" +
                                    n.propertyType +
                                    '\'});" title="View all ' +
                                    n.name +
                                    ' ' +
                                    n.propertyType +
                                    ' for sale">Matching Listings</a>'
                                );
                            } else {
                                return (
                                    '<button class="flex-1 bg-neutral-300 dark:bg-dark-bg-elevated-2 text-neutral-500 dark:text-dark-text-secondary py-2.5 px-4 rounded-lg font-medium opacity-50 cursor-not-allowed" disabled title="MLS listings coming soon for ' +
                                    n.name +
                                    '">Coming Soon!</button>'
                                );
                            }
                        })()}
                        ${
                            hasNav
                                ? `
                        <button id="nav-next" onclick="window.navigateNeighborhood(1)" class="p-2 rounded-full border border-neutral-300 dark:border-dark-border hover:bg-brand-100 dark:hover:bg-brand-dark/20 text-neutral-600 dark:text-dark-text-secondary transition-colors flex-shrink-0 focus-ring" title="Next Community">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                        `
                                : ''
                        }
                    </div>
                </div>
            `;

    targetInfoWindow.setContent(content);
    targetInfoWindow.open({ map: window.map, anchor: marker });

    // Detect amenities overflow and add fade class if needed (4px tolerance for rounding)
    google.maps.event.addListenerOnce(targetInfoWindow, 'domready', () => {
        const amenitiesEl = document.querySelector('.amenities-scroll');
        if (amenitiesEl && amenitiesEl.scrollHeight > amenitiesEl.clientHeight + 4) {
            amenitiesEl.classList.add('has-overflow');
        }
        // Apply centering correction and log diagnostics (skip for single mode - handled separately)
        if (!window.isSingleMode) {
            setTimeout(() => {
                if (marker?.position) {
                    if (window.applyMicroCenteringCorrection) {
                        window.applyMicroCenteringCorrection(marker.position, 100);
                    }
                    if (window.logCenteringDiagnostics) {
                        window.logCenteringDiagnostics(marker.position);
                    }
                }
            }, 300);
        }
    });

    // Handle close events for primary window only
    if (targetInfoWindow === window.infoWindow) {
        google.maps.event.clearListeners(window.infoWindow, 'closeclick');
        window.infoWindow.addListener('closeclick', () => {
            if (window.activeMarker && window.activeMarker.content) {
                window.activeMarker.content.innerHTML = createMarkerSVG(window.activeMarker.markerColor, false);
            }
            window.activeMarker = null;
        });
    }
}

// Toggle marker ripple animation (from production markers.js)
function toggleMarker(marker, neighborhood, showInfoFn) {
    const color = marker.markerColor;

    // If clicking same marker, toggle info window
    if (window.activeMarker === marker) {
        if (window.infoWindow && window.infoWindow.getMap()) {
            window.infoWindow.close();
            marker.content.innerHTML = createMarkerSVG(color, false);
            window.activeMarker = null;
        } else {
            showInfoFn();
            marker.content.innerHTML = createMarkerSVG(color, true);
        }
    } else {
        // Deactivate previous marker ripple
        if (window.activeMarker && window.activeMarker.content) {
            window.activeMarker.content.innerHTML = createMarkerSVG(window.activeMarker.markerColor, false);
        }

        // Clicking different marker - open with ripple
        showInfoFn();
        marker.content.innerHTML = createMarkerSVG(color, true);
        window.activeMarker = marker;
    }
}

// ==========================================
// AREA MARKER MANAGEMENT
// ==========================================
window.areaMarkers = new Map(); // slug -> marker
window.activeAreaSlug = null; // Track which area is currently being viewed

// Show area marker and info window (called from button click handler)
window.showAreaMarker = function (presetData) {
    const markerPosition = presetData.position;
    const targetZoom = 13;

    // Track this as the active area
    window.activeAreaSlug = presetData.slug;

    // Create marker data and DOM element first (so it exists during flight)
    const areaData = window.createAreaMarkerData(presetData);
    areaData.position = markerPosition;

    const markerContent = document.createElement('div');
    markerContent.className = 'marker-pin area-marker';
    markerContent.innerHTML = createMarkerSVG('#4c8f96', true);
    markerContent.style.cursor = 'pointer';
    markerContent.style.zIndex = '1000';

    const marker = new google.maps.marker.AdvancedMarkerElement({
        map: window.map,
        position: markerPosition,
        content: markerContent,
        title: areaData.name + ' (Area)',
        zIndex: 1000
    });
    marker.markerColor = '#4c8f96';
    marker.areaSlug = presetData.slug; // Store slug on marker for lookup

    marker.addListener('click', () => {
        showAreaInfoWindowContent(marker, areaData, window.infoWindow);
        window.activeMarker = marker;
        window.activeAreaSlug = presetData.slug;
    });

    // Store marker data for info window access, but DON'T add to window.markers
    // (addMarkers clears window.markers, which would wipe out our area markers)
    marker.areaData = areaData;
    window.areaMarkers.set(presetData.slug, marker);

    // Smooth fly to the marker (smoothFlyTo handles offset calculation)
    window.smoothFlyTo(markerPosition, targetZoom);

    // Open info window after flight completes
    const onFlyComplete = () => {
        // Only open if this is still the active area (user may have clicked another)
        if (window.activeAreaSlug === presetData.slug) {
            showAreaInfoWindowContent(marker, areaData, window.infoWindow);
            window.activeMarker = marker;

            // Apply micro-correction after card renders
            setTimeout(() => {
                requestAnimationFrame(() => {
                    const markerLatLng = new google.maps.LatLng(markerPosition);
                    applySingleModeCenteringFromRenderedCard(markerLatLng, 0, false);
                });
            }, 100);

            // Log centering diagnostics
            setTimeout(() => {
                if (window.logCenteringDiagnostics) {
                    window.logCenteringDiagnostics(markerPosition);
                }
            }, 500);
        }
        // Remove listener after handling
        window.eventBus?.off(window.Events?.FLY_TO_COMPLETED, onFlyComplete);
    };
    window.eventBus?.on(window.Events?.FLY_TO_COMPLETED, onFlyComplete);
};

// Hide area marker (called when filter is deselected)
window.hideAreaMarker = function (slug) {
    const marker = window.areaMarkers.get(slug);
    if (!marker) return;

    // Remove the marker from map
    marker.map = null;
    window.areaMarkers.delete(slug);

    // Check if this was the active (currently viewed) area
    const wasActiveArea = window.activeAreaSlug === slug;

    if (wasActiveArea) {
        window.infoWindow?.close();
        window.activeMarker = null;
        window.activeAreaSlug = null;

        // Find the last remaining selected area and fly to it
        const remainingAreas = Array.from(window.areaMarkers.keys());
        if (remainingAreas.length > 0) {
            // Get the last one (most recently selected)
            const lastSlug = remainingAreas[remainingAreas.length - 1];
            const lastMarker = window.areaMarkers.get(lastSlug);
            if (lastMarker && lastMarker.position) {
                // Set as active and fly to it
                window.activeAreaSlug = lastSlug;
                window.smoothFlyTo(lastMarker.position, 13);

                // Open info window after flight (use marker.areaData)
                const onFlyComplete = () => {
                    if (window.activeAreaSlug === lastSlug && lastMarker.areaData) {
                        showAreaInfoWindowContent(lastMarker, lastMarker.areaData, window.infoWindow);
                        window.activeMarker = lastMarker;
                    }
                    window.eventBus?.off(window.Events?.FLY_TO_COMPLETED, onFlyComplete);
                };
                window.eventBus?.on(window.Events?.FLY_TO_COMPLETED, onFlyComplete);
            }
        }
    }
    // If not the active area, just remove it - don't close info window or fly anywhere
};

// Expose addMarkers globally for theme toggle
window.addMarkers = function addMarkers() {
    if (!window.map) return;

    // Clear existing markers
    (window.markers || []).forEach(m => m.marker.setMap(null));
    window.markers = [];

    const filteredNeighborhoods = window.filteredNeighborhoods || [];
    const formatPrice = window.formatPrice || (p => '$' + (p / 1000000).toFixed(1) + 'M');
    let areaMarkerToOpen = null;

    filteredNeighborhoods.forEach(n => {
        // Special handling for area markers (preset markers)
        if (n.isAreaMarker) {
            const areaMarkerColor = '#4c8f96'; // Teal color for area markers
            const markerContent = document.createElement('div');
            markerContent.className = 'marker-pin area-marker';
            markerContent.innerHTML = createMarkerSVG(areaMarkerColor, true); // Selected state
            markerContent.style.cursor = 'pointer';
            markerContent.style.zIndex = '1000';

            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: window.map,
                position: n.position,
                content: markerContent,
                title: n.name + ' (Area)',
                zIndex: 1000
            });

            marker.markerColor = areaMarkerColor;

            // Click handler for area marker
            marker.addListener('click', () => {
                showInfoWindowContent(marker, n, window.infoWindow, true);
                window.activeMarker = marker;
            });

            window.markers.push({ marker, neighborhood: n });
            areaMarkerToOpen = { marker, neighborhood: n };
            return; // Skip regular marker creation
        }

        // Regular neighborhood markers
        const hasUrlSlug = n.urlSlug && n.urlSlug !== '';
        const hasListingsLink = (n.mlsSubdivisions && n.mlsSubdivisions.length > 0) || (n.name && n.name !== '');

        const markerColor = hasUrlSlug
            ? MARKER_COLORS.urlSlug
            : hasListingsLink
              ? MARKER_COLORS.listingsLink
              : MARKER_COLORS.noData;

        // Create marker with colored dot (matches production style)
        const markerContent = document.createElement('div');
        markerContent.className = 'marker-pin';
        markerContent.innerHTML = createMarkerSVG(markerColor, false);
        markerContent.style.cursor = 'pointer';

        const marker = new google.maps.marker.AdvancedMarkerElement({
            map: window.map,
            position: n.position,
            content: markerContent,
            title: n.name
        });

        // Store marker color for reference
        marker.markerColor = markerColor;

        // Click handler - uses toggleMarker for ripple animation
        marker.addListener('click', () => {
            const showInfoWindow = () => {
                showInfoWindowContent(marker, n, window.infoWindow, true);
            };
            toggleMarker(marker, n, showInfoWindow);
        });

        // Hover handler - AdvancedMarkerElement requires DOM events on content
        // Shows full info window card (matches production behavior)
        markerContent.addEventListener('mouseenter', () => {
            // Don't show hover if click info window is open for this marker
            if (window.activeMarker === marker) return;

            // Show the same full info window content as click (storeAsActive=false for hover)
            showInfoWindowContent(marker, n, window.hoverInfoWindow, false);
        });

        markerContent.addEventListener('mouseleave', () => {
            if (window.hoverInfoWindow) {
                window.hoverInfoWindow.close();
            }
        });

        window.markers.push({ marker, neighborhood: n });
    });

    // Auto-open area marker info window and center it (for full mode only)
    // Skip if: single mode (handled by openSingleModeMarker), or already in fly animation
    if (areaMarkerToOpen && !window.skipAreaAnimation && !window.isSingleMode) {
        setTimeout(() => {
            // Center the area marker in viewport with smooth animation
            if (window.smoothFlyTo && areaMarkerToOpen.neighborhood.position) {
                window.smoothFlyTo(areaMarkerToOpen.neighborhood.position, 13);
            }
            // Open info window after centering starts
            setTimeout(() => {
                showAreaInfoWindowContent(areaMarkerToOpen.marker, areaMarkerToOpen.neighborhood, window.infoWindow);
                window.activeMarker = areaMarkerToOpen.marker;

                // Apply proper centering after card renders (fixes offset issue)
                // Use setTimeout since domready may have already fired
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        const markerLatLng = new google.maps.LatLng(areaMarkerToOpen.neighborhood.position);
                        applySingleModeCenteringFromRenderedCard(markerLatLng, 0, false);
                    });
                }, 100);
            }, 200);
        }, 300);
    }
};

// Check if Google Maps is ready
if (typeof google !== 'undefined' && google.maps) {
    initMap();
}

// Handle Google Maps API errors (e.g., RefererNotAllowedMapError)
window.gm_authFailure = function () {
    const placeholder = document.getElementById('map-placeholder');
    if (placeholder) {
        placeholder.innerHTML = `
                    <div class="text-center">
                        <svg class="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <p class="text-neutral-500 dark:text-neutral-400 font-medium mb-2">Map requires local server</p>
                        <p class="text-neutral-400 dark:text-neutral-500 text-sm mb-3">Google Maps API key is restricted to specific domains.</p>
                        <div class="bg-neutral-200 dark:bg-neutral-800 rounded-lg p-3 text-left text-xs">
                            <p class="text-neutral-600 dark:text-neutral-300 mb-1">To test with map, run:</p>
                            <code class="text-brand-700 dark:text-brand-dark">cd NeighborhoodFinder && npx serve .</code>
                            <p class="text-neutral-500 dark:text-neutral-400 mt-2">Then open: <span class="text-brand-700 dark:text-brand-dark">http://localhost:3000/tests/drawer-prototype.html</span></p>
                        </div>
                    </div>
                `;
    }
    console.warn('Google Maps API auth failed - likely running from file:// URL');
};

// Timeout fallback if map doesn't load
setTimeout(() => {
    if (!window.map) {
        const placeholder = document.getElementById('map-placeholder');
        if (placeholder && placeholder.querySelector('p').textContent.includes('Loading')) {
            window.gm_authFailure();
        }
    }
}, 5000);

// Expose initMap globally for Google Maps API callback
window.initMap = initMap;

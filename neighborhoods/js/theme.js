/**
 * Theme Manager - Light/Dark Mode
 *
 * Handles theme switching with localStorage persistence
 * and system preference detection
 *
 * Last Updated: December 3, 2025
 */

export const ThemeManager = {
  /**
   * Initialize theme system
   * - Check localStorage for saved preference
   * - Fall back to system preference
   * - Listen for system preference changes
   * - Force light mode in single mode (embedded view)
   */
  init() {
    // Check if in single mode (embedded view)
    const urlParams = new URLSearchParams(window.location.search);
    const isSingleMode = urlParams.get('mode') === 'single';

    // Force configured theme in single mode (default: light)
    if (isSingleMode) {
      // Get theme from config, default to 'light' if not set
      const configTheme = window.CONFIG?.theme?.singleModeTheme || 'light';

      // Handle 'system' option - check OS preference
      let theme = configTheme;
      if (configTheme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      // Disable transitions on initial load to prevent flashing
      document.documentElement.classList.add('no-transitions');

      this.setTheme(theme, false);

      // Re-enable transitions after a brief delay
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.documentElement.classList.remove('no-transitions');
        }, 100);
      });

      return; // Exit early, no need to check localStorage or system preference
    }

    // Normal mode: Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    // Disable transitions on initial load to prevent flashing
    document.documentElement.classList.add('no-transitions');

    this.setTheme(theme, false);

    // Re-enable transitions after a brief delay
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.documentElement.classList.remove('no-transitions');
      }, 100);
    });

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  },

  /**
   * Set theme (light or dark)
   * @param {string} theme - 'light' or 'dark'
   * @param {boolean} persist - Whether to save to localStorage (default: true)
   */
  setTheme(theme, persist = true) {
    console.log('setTheme called with:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('Added dark class to html');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class from html');
    }
    console.log('HTML classes now:', document.documentElement.className);

    if (persist) {
      localStorage.setItem('theme', theme);
    }

    this.updateToggleButton(theme);
    this.updateMapTheme(theme);
  },

  /**
   * Toggle between light and dark themes
   */
  toggle() {
    const isDark = document.documentElement.classList.contains('dark');
    this.setTheme(isDark ? 'light' : 'dark');
  },

  /**
   * Update theme toggle button icon and aria-label
   * @param {string} theme - Current theme
   */
  updateToggleButton(theme) {
    const lightIcon = document.querySelector('.theme-icon-light');
    const darkIcon = document.querySelector('.theme-icon-dark');

    if (lightIcon && darkIcon) {
      if (theme === 'dark') {
        lightIcon.classList.remove('hidden');
        darkIcon.classList.add('hidden');
      } else {
        lightIcon.classList.add('hidden');
        darkIcon.classList.remove('hidden');
      }
    }

    const button = document.getElementById('theme-toggle');
    if (button) {
      button.setAttribute(
        'aria-label',
        `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
      );
    }
  },

  /**
   * Update Google Maps theme
   * @param {string} theme - Current theme
   */
  updateMapTheme(theme) {
    // This will be called from map.js after the map is initialized
    // Dispatch custom event for map.js to listen to
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  },

  /**
   * Get current theme
   * @returns {string} 'light' or 'dark'
   */
  getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  },
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
  ThemeManager.init();
}

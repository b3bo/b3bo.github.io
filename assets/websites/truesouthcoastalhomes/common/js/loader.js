/**
 * Shared Loader Component
 * Used by: neighborhoods maps, sierra embed mode
 *
 * Usage:
 *   TrueSouthLoader.injectCSS();  // Add loader CSS to head (only if not already present)
 *   TrueSouthLoader.show();       // Show loader overlay
 *   TrueSouthLoader.hide();       // Hide loader overlay
 */
var TrueSouthLoader = (function() {
  'use strict';

  // Loader CSS - single source of truth
  var CSS = [
    '.loader-dual-shape { position: relative; width: 2.5em; height: 2.5em; transform: rotate(165deg); }',
    '.loader-dual-shape:before, .loader-dual-shape:after { content: ""; position: absolute; top: 50%; left: 50%; display: block; width: 0.5em; height: 0.5em; border-radius: 0.25em; transform: translate(-50%, -50%); }',
    '.loader-dual-shape:before { animation: loader-before 2s infinite; }',
    '.loader-dual-shape:after { animation: loader-after 2s infinite; }',
    '@keyframes loader-before { 0% { width: 0.5em; box-shadow: 1em -0.5em rgba(76, 143, 150, 0.75), -1em 0.5em rgba(163, 163, 163, 0.75); } 35% { width: 2.5em; box-shadow: 0 -0.5em rgba(76, 143, 150, 0.75), 0 0.5em rgba(163, 163, 163, 0.75); } 70% { width: 0.5em; box-shadow: -1em -0.5em rgba(76, 143, 150, 0.75), 1em 0.5em rgba(163, 163, 163, 0.75); } 100% { box-shadow: 1em -0.5em rgba(76, 143, 150, 0.75), -1em 0.5em rgba(163, 163, 163, 0.75); } }',
    '@keyframes loader-after { 0% { height: 0.5em; box-shadow: 0.5em 1em rgba(91, 163, 171, 0.75), -0.5em -1em rgba(115, 115, 115, 0.75); } 35% { height: 2.5em; box-shadow: 0.5em 0 rgba(91, 163, 171, 0.75), -0.5em 0 rgba(115, 115, 115, 0.75); } 70% { height: 0.5em; box-shadow: 0.5em -1em rgba(91, 163, 171, 0.75), -0.5em 1em rgba(115, 115, 115, 0.75); } 100% { box-shadow: 0.5em 1em rgba(91, 163, 171, 0.75), -0.5em -1em rgba(115, 115, 115, 0.75); } }',
    // Overlay styles
    '#truesouth-loader { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #fff; display: flex; align-items: center; justify-content: center; z-index: 9999; transition: opacity 0.3s; }',
    '#truesouth-loader.hidden { opacity: 0; pointer-events: none; }'
  ].join(' ');

  var styleId = 'truesouth-loader-css';
  var loaderId = 'truesouth-loader';

  return {
    // Get the CSS string (for inline injection)
    getCSS: function() {
      return CSS;
    },

    // Inject CSS into head (idempotent - won't duplicate)
    injectCSS: function() {
      if (document.getElementById(styleId)) return;
      var style = document.createElement('style');
      style.id = styleId;
      style.textContent = CSS;
      document.head.appendChild(style);
    },

    // Show loader overlay
    show: function() {
      this.injectCSS();
      var el = document.getElementById(loaderId);
      if (!el) {
        el = document.createElement('div');
        el.id = loaderId;
        el.innerHTML = '<div class="loader-dual-shape"></div>';
        document.body.appendChild(el);
      }
      el.classList.remove('hidden');
    },

    // Hide loader overlay
    hide: function() {
      var el = document.getElementById(loaderId);
      if (el) el.classList.add('hidden');
    },

    // Remove loader from DOM entirely
    remove: function() {
      var el = document.getElementById(loaderId);
      if (el) el.parentNode.removeChild(el);
    }
  };
})();

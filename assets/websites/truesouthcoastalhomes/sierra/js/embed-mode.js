/**
 * Embed Mode for Search Results
 * Hide site chrome, let Sierra cards render naturally
 */
(function() {
  'use strict';

  // Only run on search results pages with embed param
  if (window.location.pathname.indexOf('/property-search/results') === -1) return;
  if (window.location.search.indexOf('embed=true') === -1) return;

  console.log('[EmbedMode] Activated');

  // Add embed-mode class - try multiple approaches
  function addEmbedClass() {
    if (document.body) {
      document.body.classList.add('embed-mode');
      console.log('[EmbedMode] Class added, body classes:', document.body.className);
      return true;
    }
    return false;
  }

  // Try immediately
  if (!addEmbedClass()) {
    console.log('[EmbedMode] Body not ready, will retry');
  }

  // Critical CSS to hide chrome during load
  var critical = document.createElement('style');
  critical.id = 'embed-critical';
  critical.textContent = [
    'body.embed-mode { opacity: 0; }',
    'body.embed-mode.ready { opacity: 1; transition: opacity 0.15s; }',
    'body.embed-mode header, body.embed-mode footer { display: none !important; }',
    'body.embed-mode .si-header, body.embed-mode .si-footer, body.embed-mode .si-header-wrapper, body.embed-mode .si-footer-wrapper { display: none !important; }',
    'body.embed-mode { padding-top: 0 !important; margin-top: 0 !important; }'
  ].join(' ');
  document.head.appendChild(critical);

  // Load CSS from CDN
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://b3bo.github.io/assets/websites/truesouthcoastalhomes/sierra/css/tailwind.css';
  link.onload = function() {
    document.body.classList.add('ready');
  };
  document.head.appendChild(link);

  // Fallback show after 800ms
  setTimeout(function() {
    addEmbedClass();
    if (document.body) {
      document.body.classList.add('ready');
    }
  }, 800);

  // Ensure class on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    addEmbedClass();
  });

  // Also try on load as final fallback
  window.addEventListener('load', function() {
    addEmbedClass();
  });

  // Open listing links in new tab
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href*="/property-search/detail/"]');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      window.open(link.href, '_blank');
    }
  }, true);
})();

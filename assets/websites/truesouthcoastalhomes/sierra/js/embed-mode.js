/**
 * Embed Mode for Search Results
 * Activates embed-mode styles when ?embed=true is in URL
 * Loaded via GTM on /property-search/results/ pages
 */
(function() {
  'use strict';

  // Only run on search results pages with embed param
  if (window.location.pathname.indexOf('/property-search/results/') === -1) return;
  if (window.location.search.indexOf('embed=true') === -1) return;

  console.log('[EmbedMode] Activated');

  // Load listing-cards.css from CDN
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://b3bo.github.io/assets/websites/truesouthcoastalhomes/sierra/css/listing-cards.css';
  document.head.appendChild(link);

  // Add embed-mode class to body to activate CSS styles
  document.body.classList.add('embed-mode');

  // Also add class after DOM loads (in case body isn't ready yet)
  document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('embed-mode');
  });

  // Intercept listing link clicks and open in new tab
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href*="/property-search/detail/"]');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      window.open(link.href, '_blank');
    }
  }, true);
})();

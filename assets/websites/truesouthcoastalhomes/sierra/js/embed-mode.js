/**
 * Embed Mode for Search Results
 * Strips page chrome when embed=true param is present
 * Loaded via GTM on /property-search/results/ pages
 */
(function() {
  'use strict';

  // Only run on search results pages with embed param
  if (window.location.pathname.indexOf('/property-search/results/') === -1) return;
  if (window.location.search.indexOf('embed=true') === -1) return;

  console.log('[EmbedMode] Activated - stripping page chrome');

  // Inject styles immediately
  var style = document.createElement('style');
  style.textContent =
    'header, footer, nav, .site-header, .site-footer, .si-header, .si-footer, .si-nav, ' +
    '.navbar, .nav-wrapper, #header, #footer, #navigation, .breadcrumb, .page-header, ' +
    '[class*="header"], [class*="footer"], [class*="navbar"], [id*="header"], [id*="footer"] ' +
    '{ display: none !important; } ' +
    'body { padding-top: 0 !important; margin-top: 0 !important; } ' +
    '.container, .content-wrapper, main { padding-top: 0 !important; margin-top: 0 !important; } ' +
    '[style*="position: fixed"], [style*="position: sticky"], .sticky, .fixed { position: static !important; } ' +
    '.si-listing-results, .listing-results, .si-results-grid, [class*="listing-results"], [class*="search-results"], [class*="results-grid"] ' +
    '{ margin-top: 0 !important; padding-top: 0 !important; position: relative !important; top: 0 !important; }';
  document.head.appendChild(style);

  // Hide elements after DOM loads (for dynamically added content)
  document.addEventListener('DOMContentLoaded', function() {
    var elementsToHide = document.querySelectorAll('header, footer, nav, .site-header, .site-footer, .navbar');
    for (var i = 0; i < elementsToHide.length; i++) {
      elementsToHide[i].style.display = 'none';
    }

    // Set target="_blank" on listing links
    var listingLinks = document.querySelectorAll('a[href*="/property-search/detail/"]');
    for (var j = 0; j < listingLinks.length; j++) {
      listingLinks[j].target = '_blank';
    }
  });

  // Intercept all listing link clicks and open in new tab
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href*="/property-search/detail/"]');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      window.open(link.href, '_blank');
    }
  }, true);
})();

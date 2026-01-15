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

  // Inject critical styles immediately to prevent FOUC
  var critical = document.createElement('style');
  critical.id = 'embed-critical';
  critical.textContent = [
    'body.embed-mode { opacity: 0; }',
    'body.embed-mode.ready { opacity: 1; transition: opacity 0.1s; }',
    'body.embed-mode header, body.embed-mode footer, body.embed-mode nav { display: none !important; }',
    'body.embed-mode [class*="header"], body.embed-mode [class*="footer"], body.embed-mode [class*="navbar"] { display: none !important; }',
    'body.embed-mode [class*="si-header"], body.embed-mode [class*="si-footer"] { display: none !important; }',
    'body.embed-mode { padding-top: 0 !important; margin-top: 0 !important; }'
  ].join(' ');
  document.head.appendChild(critical);

  // Load listing-cards.css from CDN
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://b3bo.github.io/assets/websites/truesouthcoastalhomes/sierra/css/listing-cards.css';
  link.onload = function() {
    // Show body after CSS loads
    document.body.classList.add('ready');
  };
  document.head.appendChild(link);

  // Add embed-mode class to body to activate CSS styles (hides body initially)
  document.body.classList.add('embed-mode');

  // Fallback: show body after 500ms even if CSS hasn't loaded
  setTimeout(function() {
    document.body.classList.add('ready');
  }, 500);

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

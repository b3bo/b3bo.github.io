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
    'body.embed-mode > header, body.embed-mode > footer, body.embed-mode > nav { display: none !important; }',
    'body.embed-mode .site-header, body.embed-mode .site-footer, body.embed-mode .navbar { display: none !important; }',
    'body.embed-mode [class*="si-header"], body.embed-mode [class*="si-footer"] { display: none !important; }',
    'body.embed-mode { padding-top: 0 !important; margin-top: 0 !important; }'
  ].join(' ');
  document.head.appendChild(critical);

  // Preconnect to Google Fonts for faster loading
  var preconnect1 = document.createElement('link');
  preconnect1.rel = 'preconnect';
  preconnect1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnect1);

  var preconnect2 = document.createElement('link');
  preconnect2.rel = 'preconnect';
  preconnect2.href = 'https://fonts.gstatic.com';
  preconnect2.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect2);

  // Load Google Fonts (Roboto - matching area-cards)
  var fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(fontLink);

  // Load compiled Tailwind CSS from CDN (includes listing-cards.css)
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://b3bo.github.io/assets/websites/truesouthcoastalhomes/sierra/css/tailwind.css';
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

    // Strip Sierra's !important classes from cards for cleaner CSS overrides
    function stripImportantClasses() {
      var cards = document.querySelectorAll('[data-testid="gallery-item"]');
      cards.forEach(function(card) {
        // Remove classes that use !important (start with ! or contain shadow-brand/outline)
        var classes = card.className.split(' ');
        var cleanClasses = classes.filter(function(c) {
          return !c.startsWith('!') &&
                 c.indexOf('shadow-brand') === -1 &&
                 c.indexOf('outline') === -1 ||
                 c.indexOf('outline-none') !== -1;
        });
        card.className = cleanClasses.join(' ');
      });
    }

    // Run initially and observe for dynamic content
    stripImportantClasses();
    var observer = new MutationObserver(stripImportantClasses);
    observer.observe(document.body, { childList: true, subtree: true });
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

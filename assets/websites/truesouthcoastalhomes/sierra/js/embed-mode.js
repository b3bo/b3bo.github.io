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

  // jsDelivr base URL for cached GitHub assets
  var cdnBase = 'https://cdn.jsdelivr.net/gh/b3bo/b3bo.github.io@main/assets/websites/truesouthcoastalhomes';
  var version = 'v3'; // Increment to bust jsDelivr cache

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
    'body.embed-mode.ready { opacity: 1; transition: opacity 0.2s; }',
    'body.embed-mode header, body.embed-mode footer { display: none !important; }',
    'body.embed-mode .si-header, body.embed-mode .si-footer, body.embed-mode .si-header-wrapper, body.embed-mode .si-footer-wrapper { display: none !important; }',
    'body.embed-mode { padding-top: 0 !important; margin-top: 0 !important; }'
  ].join(' ');
  document.head.appendChild(critical);

  // Load shared loader utility, then main CSS
  var loaderScript = document.createElement('script');
  loaderScript.src = cdnBase + '/common/js/loader.js?' + version;
  loaderScript.onload = function() {
    console.log('[EmbedMode] Loader script loaded');
    // Show loader using shared component
    if (typeof TrueSouthLoader !== 'undefined') {
      TrueSouthLoader.show();
    }
    // Now load main CSS
    loadMainCSS();
  };
  loaderScript.onerror = function() {
    console.log('[EmbedMode] Loader script failed, continuing without loader');
    loadMainCSS();
  };
  document.head.appendChild(loaderScript);

  // Load main CSS from jsDelivr
  function loadMainCSS() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', cdnBase + '/sierra/css/tailwind.css?' + version, true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        var style = document.createElement('style');
        style.id = 'embed-styles';
        style.textContent = xhr.responseText;
        document.head.appendChild(style);
        console.log('[EmbedMode] CSS injected, length:', xhr.responseText.length);
      } else {
        console.log('[EmbedMode] CSS load failed:', xhr.status);
      }
      onReady();
    };
    xhr.onerror = function() {
      console.log('[EmbedMode] CSS load error');
      onReady();
    };
    xhr.send();
  }

  // Called when CSS is loaded (or failed)
  function onReady() {
    document.body.classList.add('ready');
    if (typeof TrueSouthLoader !== 'undefined') {
      TrueSouthLoader.hide();
    }
  }

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

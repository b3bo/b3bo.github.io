/**
 * Embed Mode for Sierra Property Search Results
 * Loads external CSS and applies embed-mode class for styled listing cards
 * Used on /property-search/results/?embed=true pages via GTM
 */
(function() {
  'use strict';

  // Only run on search results pages with embed param
  if (window.location.pathname.indexOf('/property-search/results') === -1) return;
  if (window.location.search.indexOf('embed=true') === -1) return;

  // GitHub Pages URL for CSS
  var cssUrl = 'https://b3bo.github.io/assets/websites/truesouthcoastalhomes/sierra/css/tailwind.css';

  // Add embed-mode class to html and body
  function addEmbedClass() {
    document.documentElement.classList.add('embed-mode');
    if (document.body) {
      document.body.classList.add('embed-mode');
      return true;
    }
    return false;
  }

  // Add to html immediately
  document.documentElement.classList.add('embed-mode');
  addEmbedClass();
  createLoader();

  // Critical inline CSS: hide page + loader animation
  var critical = document.createElement('style');
  critical.id = 'embed-critical';
  critical.textContent = [
    'html.embed-mode,body.embed-mode{overflow:hidden!important;background:#fff!important}',
    'html.embed-mode.ready,body.embed-mode.ready{overflow:auto!important}',
    'body.embed-mode:not(.ready){position:relative}',
    'body.embed-mode:not(.ready)>:not(#embed-loader){opacity:0!important;pointer-events:none!important}',
    'body.embed-mode.ready>:not(#embed-loader){opacity:1!important;transition:opacity .2s}',
    'body.embed-mode:not(.ready)::before{content:"";position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;z-index:9990}',
    'body.embed-mode header,body.embed-mode footer,body.embed-mode nav,body.embed-mode .navbar,body.embed-mode .site-header,body.embed-mode .site-footer{display:none!important}',
    '.embed-loader{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:#fff;z-index:9999;transition:opacity .3s}',
    '.embed-loader.hidden{opacity:0;pointer-events:none}',
    '.loader-dual-shape{position:relative;width:2.5em;height:2.5em;transform:rotate(165deg)}',
    '.loader-dual-shape:before,.loader-dual-shape:after{content:"";position:absolute;top:50%;left:50%;display:block;width:.5em;height:.5em;border-radius:.25em;transform:translate(-50%,-50%)}',
    '.loader-dual-shape:before{animation:lb 2s infinite}',
    '.loader-dual-shape:after{animation:la 2s infinite}',
    '@keyframes lb{0%{width:.5em;box-shadow:1em -.5em rgba(76,143,150,.75),-1em .5em rgba(163,163,163,.75)}35%{width:2.5em;box-shadow:0 -.5em rgba(76,143,150,.75),0 .5em rgba(163,163,163,.75)}70%{width:.5em;box-shadow:-1em -.5em rgba(76,143,150,.75),1em .5em rgba(163,163,163,.75)}100%{box-shadow:1em -.5em rgba(76,143,150,.75),-1em .5em rgba(163,163,163,.75)}}',
    '@keyframes la{0%{height:.5em;box-shadow:.5em 1em rgba(91,163,171,.75),-.5em -1em rgba(115,115,115,.75)}35%{height:2.5em;box-shadow:.5em 0 rgba(91,163,171,.75),-.5em 0 rgba(115,115,115,.75)}70%{height:.5em;box-shadow:.5em -1em rgba(91,163,171,.75),-.5em 1em rgba(115,115,115,.75)}100%{box-shadow:.5em 1em rgba(91,163,171,.75),-.5em -1em rgba(115,115,115,.75)}}'
  ].join('');
  document.head.appendChild(critical);

  // Create loader overlay
  function createLoader() {
    if (document.getElementById('embed-loader')) return;
    var loader = document.createElement('div');
    loader.id = 'embed-loader';
    loader.className = 'embed-loader';
    loader.innerHTML = '<div class="loader-dual-shape"></div>';
    if (document.body) {
      document.body.appendChild(loader);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        document.body.appendChild(loader);
      });
    }
  }

  var stickyResizeBound = false;
  var stickyResizeObserver = null;

  // Hide loader when listings appear
  function hideLoader() {
    var loader = document.getElementById('embed-loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(function() {
        loader.remove();
      }, 300);
    }
  }

  // Watch for gallery items to appear
  function checkForListings() {
    var items = document.querySelectorAll('[data-testid="gallery-item"]');
    if (items.length > 0) {
      hideLoader();
      adjustForStickyBar();
      bindStickyObserver();
      if (!stickyResizeBound) {
        stickyResizeBound = true;
        window.addEventListener('resize', adjustForStickyBar);
      }
      return true;
    }
    return false;
  }

  function getStickyTarget() {
    return document.querySelector('.flex.w-full.h-auto.bg-component-bg.flex-col.p-0') ||
      document.querySelector('[class*="sticky"][class*="top-0"]') ||
      document.querySelector('[data-testid="search-container"]');
  }

  function bindStickyObserver() {
    if (typeof ResizeObserver === 'undefined') return;
    if (stickyResizeObserver) return;
    var stickyTarget = getStickyTarget();
    if (!stickyTarget) {
      setTimeout(bindStickyObserver, 300);
      return;
    }
    stickyResizeObserver = new ResizeObserver(function() {
      adjustForStickyBar();
    });
    stickyResizeObserver.observe(stickyTarget);
  }

  // Adjust spacing to account for sticky filter bar
  function adjustForStickyBar() {
    var stickyTarget = getStickyTarget();

    // Find the card grid wrapper
    var gridWrapper = document.querySelector('[data-testid="property-gallery"]');
    var items = document.querySelectorAll('[data-testid="gallery-item"]');
    if (!gridWrapper && items.length) {
      var grid = items[0].parentElement;
      gridWrapper = grid.closest('[data-testid="search-results-grid"]') ||
        grid.closest('div[class*="flex"][class*="gap-4"]') ||
        grid;
    }

    if (!gridWrapper) return;

    if (!stickyTarget) {
      gridWrapper.style.marginTop = '16px';
      gridWrapper.style.scrollMarginTop = '16px';
      return;
    }

    var desiredGap = 16; // px, keeps a little breathing room below the sticky bar
    var offset = (stickyTarget.offsetHeight || 0) + desiredGap;

    gridWrapper.style.marginTop = offset + 'px';
    gridWrapper.style.scrollMarginTop = offset + 'px';
  }

  // Load external CSS via link tag
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  link.onload = function() {
    document.documentElement.classList.add('ready');
    document.body.classList.add('ready');
    // Check immediately, then poll for listings
    if (!checkForListings()) {
      var interval = setInterval(function() {
        if (checkForListings()) {
          clearInterval(interval);
        }
      }, 100);
      // Stop polling after 10 seconds
      setTimeout(function() {
        clearInterval(interval);
        hideLoader();
      }, 10000);
    }
  };
  link.onerror = function() {
    document.documentElement.classList.add('ready');
    document.body.classList.add('ready');
    hideLoader();
  };
  document.head.appendChild(link);

  // Fallback: show page after 800ms regardless
  setTimeout(function() {
    addEmbedClass();
    document.documentElement.classList.add('ready');
    if (document.body) document.body.classList.add('ready');
  }, 800);

  // Ensure class is added on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    addEmbedClass();
    createLoader();
  });

  // Open listing detail links in new tab
  document.addEventListener('click', function(e) {
    var anchor = e.target.closest('a[href*="/property-search/detail/"]');
    if (anchor) {
      e.preventDefault();
      e.stopPropagation();
      window.open(anchor.href, '_blank');
    }
  }, true);
})();

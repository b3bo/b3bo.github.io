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
  var CSS_VERSION = '20260116-2';
  var cssUrl = 'https://b3bo.github.io/assets/websites/truesouthcoastalhomes/sierra/css/tailwind.css?v=' + CSS_VERSION;
  var bodyClassApplied = false;

  function isEmbedModeActive() {
    return document.documentElement.classList.contains('embed-mode') ||
      (document.body && document.body.classList.contains('embed-mode'));
  }

  var CRITICAL_STYLES = window.__tsEmbedCriticalCSS;
  if (!CRITICAL_STYLES) {
    CRITICAL_STYLES = [
      'html.embed-mode,body.embed-mode{overflow:hidden!important;background:#fff!important}',
      'html.embed-mode.ready,html.embed-mode body.ready,body.embed-mode.ready{overflow:auto!important}',
      'body.embed-mode:not(.ready),html.embed-mode body:not(.ready){position:relative}',
      'body.embed-mode:not(.ready)>:not(#embed-loader),html.embed-mode body:not(.ready)>:not(#embed-loader){opacity:0!important;pointer-events:none!important}',
      'body.embed-mode.ready>:not(#embed-loader),html.embed-mode body.ready>:not(#embed-loader){opacity:1!important;transition:opacity .2s}',
      'body.embed-mode:not(.ready)::before,html.embed-mode body:not(.ready)::before{content:"";position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;z-index:9990}',
      'body.embed-mode header,body.embed-mode footer,body.embed-mode nav,body.embed-mode .navbar,body.embed-mode .site-header,body.embed-mode .site-footer,body.embed-mode .nav-wrapper,body.embed-mode #header,body.embed-mode #footer,body.embed-mode .fixed.dark.dynamic,body.embed-mode .dynamic-nav,body.embed-mode [class*="loading"],body.embed-mode [class*="spinner"],body.embed-mode [class*="Loading"],html.embed-mode body header,html.embed-mode body footer,html.embed-mode body nav,html.embed-mode body .navbar,html.embed-mode body .site-header,html.embed-mode body .site-footer,html.embed-mode body .nav-wrapper,html.embed-mode body #header,html.embed-mode body #footer,html.embed-mode body .fixed.dark.dynamic,html.embed-mode body .dynamic-nav,html.embed-mode body [class*="loading"],html.embed-mode body [class*="spinner"],html.embed-mode body [class*="Loading"]{display:none!important}',
      '.embed-loader{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:#fff;z-index:9999;transition:opacity .3s}',
      '.embed-loader.hidden{opacity:0;pointer-events:none}',
      '.loader-dual-shape{position:relative;width:2.5em;height:2.5em;transform:rotate(165deg)}',
      '.loader-dual-shape:before,.loader-dual-shape:after{content:"";position:absolute;top:50%;left:50%;display:block;width:.5em;height:.5em;border-radius:.25em;transform:translate(-50%,-50%)}',
      '.loader-dual-shape:before{animation:lb 2s infinite}',
      '.loader-dual-shape:after{animation:la 2s infinite}',
      '@keyframes lb{0%{width:.5em;box-shadow:1em -.5em rgba(76,143,150,.75),-1em .5em rgba(163,163,163,.75)}35%{width:2.5em;box-shadow:0 -.5em rgba(76,143,150,.75),0 .5em rgba(163,163,163,.75)}70%{width:.5em;box-shadow:-1em -.5em rgba(76,143,150,.75),1em .5em rgba(163,163,163,.75)}100%{box-shadow:1em -.5em rgba(76,143,150,.75),-1em .5em rgba(163,163,163,.75)}}',
      '@keyframes la{0%{height:.5em;box-shadow:.5em 1em rgba(91,163,171,.75),-.5em -1em rgba(115,115,115,.75)}35%{height:2.5em;box-shadow:.5em 0 rgba(91,163,171,.75),-.5em 0 rgba(115,115,115,.75)}70%{height:.5em;box-shadow:.5em -1em rgba(91,163,171,.75),-.5em 1em rgba(115,115,115,.75)}100%{box-shadow:.5em 1em rgba(91,163,171,.75),-.5em -1em rgba(115,115,115,.75)}}'
    ].join('');
  }
  window.__tsEmbedCriticalCSS = CRITICAL_STYLES;

  // Add embed-mode class to html and body
  function addEmbedClass() {
    document.documentElement.classList.add('embed-mode');
    if (bodyClassApplied) return true;
    if (document.body) {
      document.body.classList.add('embed-mode');
      bodyClassApplied = true;
      return true;
    }
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(addEmbedClass);
    } else {
      setTimeout(addEmbedClass, 16);
    }
    return false;
  }

  // Add to html immediately
  document.documentElement.classList.add('embed-mode');
  addEmbedClass();
  createLoader();

  // Critical inline CSS: hide page + loader animation
  var critical = document.getElementById('embed-critical');
  if (!critical) {
    critical = document.createElement('style');
    critical.id = 'embed-critical';
    critical.textContent = CRITICAL_STYLES;
    document.head.appendChild(critical);
  }

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

  function nukeSiteChrome() {
    var selectors = [
      'header', 'footer', 'nav', '.navbar', '.site-header', '.site-footer',
      '#header', '#footer', '.fixed.dark.dynamic', '.dynamic-nav',
      '[class*="loading"]', '[class*="spinner"]', '[class*="Loading"]',
      '.si-header.si-header--sticky', '#userwayAccessibilityIcon'
    ];
    selectors.forEach(function(sel) {
      var els = document.querySelectorAll(sel);
      for(var i=0; i<els.length; i++) {
        if (els[i].id !== 'embed-loader') {
          els[i].style.setProperty('display', 'none', 'important');
        }
      }
    });

    // Also force fix images
    var imgs = document.querySelectorAll('[data-testid="gallery-item"] img');
    for(var j=0; j<imgs.length; j++) {
      imgs[j].style.objectPosition = 'top'; 
    }
  }

  function markReadyState() {
    nukeSiteChrome();
    document.documentElement.classList.add('ready');
    if (document.body) document.body.classList.add('ready');
    if (typeof window.__tsReleaseEmbedPreload === 'function') {
      window.__tsReleaseEmbedPreload();
    }
  }

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
    nukeSiteChrome();
    var items = document.querySelectorAll('[data-testid="gallery-item"]');
    if (items.length > 0) {
      hideLoader();
      adjustForStickyBar();
      if (!isEmbedModeActive()) {
        bindStickyObserver();
        if (!stickyResizeBound) {
          stickyResizeBound = true;
          window.addEventListener('resize', adjustForStickyBar);
        }
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
    if (isEmbedModeActive()) return;
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

  function findGridContainer(items) {
    if (!items || !items.length) return null;
    var node = items[0].parentElement;
    while (node && node !== document.body) {
      try {
        var directItems = node.querySelectorAll(':scope > [data-testid="gallery-item"]');
        if (directItems && directItems.length) return node;
      } catch (err) {
        break;
      }
      node = node.parentElement;
    }
    return items[0].parentElement;
  }

  // Adjust spacing to account for sticky filter bar
  function adjustForStickyBar() {
    // Find the card grid wrapper
    var gridWrapper = document.querySelector('[data-testid="property-gallery"]');
    var items = document.querySelectorAll('[data-testid="gallery-item"]');
    var gridContainer = findGridContainer(items);
    if (!gridWrapper && items.length) {
      var grid = items[0].parentElement;
      gridWrapper = grid.closest('[data-testid="search-results-grid"]') ||
        grid.closest('div[class*="flex"][class*="gap-4"]') ||
        grid;
    }

    if (!gridWrapper) return;

    var stickyTarget = getStickyTarget();

    var desiredGap = 16; // px, keeps a little breathing room below the sticky bar
    if (gridContainer) {
      var gridStyle = window.getComputedStyle(gridContainer);
      var padBottom = parseFloat(gridStyle.paddingBottom) || 24;
      var padTop = parseFloat(gridStyle.paddingTop) || 0;
      if (padTop < padBottom) {
        gridContainer.style.paddingTop = padBottom + 'px';
      }
    }
    if (gridWrapper) {
      var wrapperStyle = window.getComputedStyle(gridWrapper);
      var wrapperPadTop = parseFloat(wrapperStyle.paddingTop) || 0;
      if (wrapperPadTop < 20) {
        gridWrapper.style.paddingTop = '24px';
      }
    }
    if (!stickyTarget) {
      gridWrapper.style.marginTop = desiredGap + 'px';
      gridWrapper.style.scrollMarginTop = desiredGap + 'px';
      return;
    }

    var stickyStyle = window.getComputedStyle(stickyTarget);
    var isSticky = stickyStyle.position === 'sticky' || stickyStyle.position === 'fixed';

    if (!isSticky) {
      gridWrapper.style.marginTop = desiredGap + 'px';
      gridWrapper.style.scrollMarginTop = desiredGap + 'px';
      return;
    }

    var targetHeight = stickyTarget.getBoundingClientRect().height || stickyTarget.offsetHeight || 0;
    var offset = targetHeight + desiredGap;

    gridWrapper.style.marginTop = offset + 'px';
    gridWrapper.style.scrollMarginTop = offset + 'px';
  }

  // Load external CSS via link tag
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  link.onload = function() {
    markReadyState();
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
    markReadyState();
    hideLoader();
  };
  document.head.appendChild(link);

  // Fallback: show page after 800ms regardless
  setTimeout(function() {
    addEmbedClass();
    markReadyState();
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

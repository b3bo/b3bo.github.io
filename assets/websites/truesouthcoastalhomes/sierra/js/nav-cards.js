/**
 * Area Navigation Cards
 * Renders area cards with stats and maps on navigation pages
 *
 * Usage: Add container with data-property-type attribute
 *   <div id="area-cards" data-property-type="homes"></div>
 *   <div id="area-cards" data-property-type="condos"></div>
 *
 * Dependencies:
 * - CSS from nav-cards.css (loaded via Tag 1)
 * - JSON data from neighborhoods.truesouthcoastalhomes.com
 */
(function() {
  'use strict';

  console.log('[NavCards] Initializing area navigation cards...');

  // Container reference and property type - set during init
  var container = null;
  var propertyType = 'homes'; // default, can be overridden by data-property-type

  // ============================================
  // Helper Functions
  // ============================================

  function formatPrice(price) {
    if (!price) return '$0';
    if (price >= 1000000) {
      return '$' + (price / 1000000).toFixed(2) + 'M';
    } else if (price >= 1000) {
      return '$' + (price / 1000).toFixed(0) + 'K';
    }
    return '$' + price.toLocaleString();
  }

  function getAreaStats(area, propType) {
    var pt = (propType || '').toLowerCase();
    return pt === 'homes' ? (area.homeStats || area.stats || {})
         : pt === 'condos' ? (area.condoStats || area.stats || {})
         : (area.stats || {});
  }

  function getAreaNeighborhoods(area, propType) {
    var pt = (propType || '').toLowerCase();
    return pt === 'homes' ? (area.homeNeighborhoods || area.neighborhoods || [])
         : pt === 'condos' ? (area.condoNeighborhoods || area.neighborhoods || [])
         : (area.neighborhoods || []);
  }

  function decodeBase64Json(text) {
    var jsonStr = new TextDecoder().decode(
      Uint8Array.from(atob(text), function(c) { return c.charCodeAt(0); })
    );
    return JSON.parse(jsonStr);
  }

  // ============================================
  // Show Loading State
  // ============================================

  function showLoading() {
    var skeletons = '';
    for (var i = 0; i < 4; i++) {
      skeletons += [
        '<div class="area-card area-card-skeleton">',
        '  <div class="area-card-header" style="height:56px;background:#e5e7eb;"></div>',
        '  <div class="area-card-body">',
        '    <div class="area-card-stats">',
        '      <div style="height:80px;background:#f3f4f6;border-radius:0.5rem;"></div>',
        '      <div style="height:80px;background:#f3f4f6;border-radius:0.5rem;"></div>',
        '    </div>',
        '    <div class="area-card-map">',
        '      <div style="aspect-ratio:16/9;background:#f3f4f6;border-radius:0.5rem;"></div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('');
    }
    container.innerHTML = skeletons;
  }

  function showError(message) {
    container.innerHTML = [
      '<div style="text-align:center;padding:3rem 0;color:#6b7280;">',
      '  <p style="font-size:1.125rem;margin-bottom:0.5rem;">Unable to load areas</p>',
      '  <p style="font-size:0.875rem;">' + (message || 'Please refresh the page to try again.') + '</p>',
      '</div>'
    ].join('');
  }

  // ============================================
  // Card Rendering
  // ============================================

  function createAreaCard(preset, propType, neighborhoodData, urlOverrides) {
    var stats = getAreaStats(preset, propType);
    var topNeighborhoods = getAreaNeighborhoods(preset, propType);

    if (!stats.listingCount) return '';

    var typeLabel = propType === 'homes' ? 'Homes' : 'Condos';
    var areaUrl = '/' + preset.slug + '/';
    urlOverrides = urlOverrides || {};

    // Build neighborhood rows (top 8)
    var neighborhoodRows = '';
    var maxRows = Math.min(topNeighborhoods.length, 8);
    for (var i = 0; i < maxRows; i++) {
      var n = topNeighborhoods[i];
      // Find full data for this neighborhood
      var fullData = null;
      for (var j = 0; j < neighborhoodData.length; j++) {
        var nd = neighborhoodData[j];
        var ndType = (nd.propertyType || '').toLowerCase();
        if (propType === 'homes') {
          if (nd.name === n.name && (ndType === 'homes' || ndType === 'townhomes')) {
            fullData = nd;
            break;
          }
        } else if (nd.name === n.name && ndType === propType) {
          fullData = nd;
          break;
        }
      }
      var nStats = fullData ? (fullData.stats || {}) : {};
      var listingCount = n.listingCount || nStats.listingCount || 0;

      var medianPrice = nStats.medianPrice || 0;
      var pricePerSqFt = nStats.avgPricePerSqFt || 0;
      var avgDom = nStats.avgDom || 0;

      // Get position for hover-to-fly
      var lat = (fullData && fullData.position) ? fullData.position.lat : 0;
      var lng = (fullData && fullData.position) ? fullData.position.lng : 0;

      // Get actual property type label
      var actualType = (fullData && fullData.propertyType) ? fullData.propertyType.toLowerCase() : propType;
      var actualTypeLabel = actualType === 'townhomes' ? 'T/H'
        : actualType === 'condos' ? 'Condos'
        : actualType === 'lots' ? 'Lots'
        : 'Homes';

      // Get URL slug for hyperlink (if exists)
      var override = urlOverrides[n.name] || {};
      var urlSlug = override.urlSlug || '';
      var linkIcon = '<svg class="link-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
      var linkTitle = n.name + ' ' + actualTypeLabel + ' for Sale';
      var nameCell = urlSlug
        ? '<a href="' + urlSlug + '" target="_blank" rel="noopener" title="' + linkTitle + '">' + n.name + ' ' + actualTypeLabel + linkIcon + '</a>'
        : n.name + ' ' + actualTypeLabel;

      neighborhoodRows += [
        '<tr class="neighborhood-row" data-name="' + n.name + '" data-lat="' + lat + '" data-lng="' + lng + '">',
        '  <td>' + nameCell + '</td>',
        '  <td>' + listingCount + '</td>',
        '  <td>' + formatPrice(medianPrice) + '</td>',
        '  <td>$' + pricePerSqFt + '</td>',
        '  <td>' + avgDom + '</td>',
        '</tr>'
      ].join('');
    }

    // Build iframe URL for map
    var mapUrl = 'https://neighborhoods.truesouthcoastalhomes.com/?area=' + preset.slug +
                 '&propertyType=' + propType +
                 '&mode=single&zoom=11&controls=false&infoWindowSize=mini';

    return [
      '<div class="area-card" id="' + preset.slug + '" data-area="' + preset.slug + '" data-type="' + propType + '">',
      '  <div class="area-card-header">',
      '    <h2>' + preset.name + ' Area ' + typeLabel + '</h2>',
      '  </div>',
      '  <div class="area-card-body">',
      '    <div class="area-card-map">',
      '      <iframe data-src="' + mapUrl + '"></iframe>',
      '    </div>',
      '    <div class="area-card-content">',
      '      <div class="stats-grid">',
      '        <a href="' + areaUrl + '" class="stat-button">',
      '          <span class="stat-value">' + (stats.listingCount || 0) + '</span>',
      '          <span class="stat-label">Active</span>',
      '        </a>',
      '        <a href="' + areaUrl + '" class="stat-button">',
      '          <span class="stat-value">' + formatPrice(stats.medianPrice || 0) + '</span>',
      '          <span class="stat-label">Median</span>',
      '        </a>',
      '        <a href="' + areaUrl + '" class="stat-button">',
      '          <span class="stat-value">$' + (stats.avgPricePerSqFt || 0) + '</span>',
      '          <span class="stat-label">$/SF</span>',
      '        </a>',
      '        <a href="' + areaUrl + '" class="stat-button">',
      '          <span class="stat-value">' + (stats.avgDom || 0) + '</span>',
      '          <span class="stat-label">Avg DOM</span>',
      '        </a>',
      '      </div>',
      '      <table class="communities-table">',
      '        <thead>',
      '          <tr>',
      '            <th>Top Neighborhoods</th>',
      '            <th>Listings</th>',
      '            <th>Median</th>',
      '            <th>$/SF</th>',
      '            <th>Avg DOM</th>',
      '          </tr>',
      '        </thead>',
      '        <tbody>',
      neighborhoodRows,
      '        </tbody>',
      '      </table>',
      '    </div>',
      '  </div>',
      '  <a href="' + areaUrl + '" class="area-card-link">',
      '    View All ' + preset.name + ' ' + typeLabel + ' &rarr;',
      '  </a>',
      '</div>'
    ].join('');
  }

  // ============================================
  // Data Loading
  // ============================================

  var mlsBaseUrl = 'https://neighborhoods.truesouthcoastalhomes.com/assets/mls/ecar/';

  var jsonFiles = {
    presets: 'presets/areas.json.b64',
    neighborhoods: [
      'neighborhoods/7ea1bf14d884d192.json.b64',
      'neighborhoods/b762bb338ba328e5.json.b64',
      'neighborhoods/d2ea7fdfc87ff3e7.json.b64',
      'neighborhoods/d897c3d107c48ccc.json.b64',
      'neighborhoods/dcb3d8a92cc6eb54.json.b64',
      'neighborhoods/e0e3b36d8e692892.json.b64',
      'neighborhoods/f7e6349b564cdbb2.json.b64'
    ],
    urlOverrides: 'search_id_overrides.json'
  };

  // Store neighborhood data globally for hover handlers
  var globalNeighborhoodData = [];

  function loadData() {
    showLoading();

    // Load presets and URL overrides in parallel
    var presetsPromise = fetch(mlsBaseUrl + jsonFiles.presets)
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load area presets');
        return response.text();
      })
      .then(function(text) {
        return decodeBase64Json(text);
      });

    var urlOverridesPromise = fetch(mlsBaseUrl + jsonFiles.urlOverrides)
      .then(function(response) {
        if (!response.ok) return {};
        return response.json();
      })
      .catch(function() {
        console.warn('[NavCards] Failed to load URL overrides, continuing without');
        return {};
      });

    Promise.all([presetsPromise, urlOverridesPromise])
      .then(function(results) {
        var areaPresets = results[0];
        var urlOverrides = results[1];
        console.log('[NavCards] Loaded', (areaPresets.presets || []).length, 'area presets');
        console.log('[NavCards] Loaded', Object.keys(urlOverrides).length, 'URL overrides');

        // Load all neighborhood files
        var neighborhoodPromises = jsonFiles.neighborhoods.map(function(file) {
          return fetch(mlsBaseUrl + file)
            .then(function(r) { return r.ok ? r.text() : null; })
            .then(function(text) {
              if (!text) return [];
              try {
                var data = decodeBase64Json(text);
                return data.neighborhoods || [];
              } catch (e) {
                console.warn('[NavCards] Failed to parse', file);
                return [];
              }
            })
            .catch(function() { return []; });
        });

        return Promise.all(neighborhoodPromises).then(function(neighborhoodResults) {
          var allNeighborhoods = [];
          neighborhoodResults.forEach(function(neighborhoods) {
            allNeighborhoods = allNeighborhoods.concat(neighborhoods);
          });
          console.log('[NavCards] Loaded', allNeighborhoods.length, 'neighborhoods');
          return { presets: areaPresets, neighborhoods: allNeighborhoods, urlOverrides: urlOverrides };
        });
      })
      .then(function(data) {
        // Store globally for hover handlers
        globalNeighborhoodData = data.neighborhoods;

        // Render cards for each area using the configured property type
        var html = '';
        var presets = data.presets.presets || [];
        // Custom display order (west to east, 30A areas grouped)
        var order = ['Destin', 'Miramar Beach', 'Sandestin', 'West 30A', 'East 30A', 'Santa Rosa Beach', 'Inlet Beach', 'Panama City Beach'];
        presets.sort(function(a, b) {
          return order.indexOf(a.name) - order.indexOf(b.name);
        });

        // Build tag navigation bar and insert after page H2
        var tagLinks = presets.map(function(p) {
          return '<a href="#' + p.slug + '">' + p.name + '</a>';
        }).join(' ');
        var tagBarHtml = '<div class="flex justify-center items-center mb-8 px-4">';
        tagBarHtml += '<div class="tag-items flex items-center justify-center flex-wrap text-sm font-body text-neutral-700 font-bold">';
        tagBarHtml += '<i class="fa fa-tags text-primary-600 flex-shrink-0" style="width: 1rem; height: 1rem;"></i> ';
        tagBarHtml += tagLinks;
        tagBarHtml += '</div></div>';

        // Insert after page H1 (Home Search heading)
        var pageH1 = document.querySelector('h1');
        if (pageH1) {
          pageH1.insertAdjacentHTML('afterend', tagBarHtml);
        } else {
          html += tagBarHtml;
        }

        for (var i = 0; i < presets.length; i++) {
          html += createAreaCard(presets[i], propertyType, data.neighborhoods, data.urlOverrides);
        }

        if (html) {
          container.innerHTML = html;
          console.log('[NavCards] Rendered', presets.length, 'area cards for', propertyType);
          // Preload maps when 500px from viewport
          setupMapPreloading();
          // Setup hover-to-fly listeners
          setupHoverListeners();
        } else {
          showError('No areas found with active listings.');
        }
      })
      .catch(function(error) {
        console.error('[NavCards] Error:', error);
        showError(error.message);
      });
  }

  // ============================================
  // Map Preloading (500px before viewport)
  // ============================================

  function setupMapPreloading() {
    var iframes = container.querySelectorAll('iframe[data-src]');
    console.log('[NavCards] Setting up preloading for', iframes.length, 'maps');

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var iframe = entry.target;
          var src = iframe.dataset.src;
          if (src && !iframe.src) {
            iframe.src = src;
            console.log('[NavCards] Preloading map:', src.split('?')[1].split('&')[0]);
          }
          observer.unobserve(iframe);
        }
      });
    }, {
      rootMargin: '500px 0px' // Load 500px before entering viewport
    });

    iframes.forEach(function(iframe) {
      observer.observe(iframe);
    });
  }

  // ============================================
  // Hover-to-Fly Functionality
  // ============================================

  function setupHoverListeners() {
    var HOVER_DELAY = 500; // ms before triggering map fly
    var cards = container.querySelectorAll('.area-card');
    console.log('[NavCards] Setting up hover listeners for', cards.length, 'cards');

    cards.forEach(function(card) {
      var iframe = card.querySelector('iframe');
      var rows = card.querySelectorAll('.neighborhood-row');
      var cardPropertyType = card.dataset.type || 'homes';
      var hoverTimeout = null;

      if (!iframe) {
        console.warn('[NavCards] Card missing iframe');
        return;
      }

      rows.forEach(function(row) {
        row.addEventListener('mouseenter', function() {
          // Clear any pending hover
          if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
          }

          // Delay before triggering map navigation
          hoverTimeout = setTimeout(function() {
            var name = row.dataset.name;
            var lat = parseFloat(row.dataset.lat);
            var lng = parseFloat(row.dataset.lng);

            if (!lat || !lng) {
              console.warn('[NavCards] Invalid coordinates for', name);
              return;
            }

            // Find full neighborhood data to send stats
            var fullData = null;
            for (var i = 0; i < globalNeighborhoodData.length; i++) {
              var nd = globalNeighborhoodData[i];
              var ndType = (nd.propertyType || '').toLowerCase();
              if (cardPropertyType === 'homes') {
                if (nd.name === name && (ndType === 'homes' || ndType === 'townhomes')) {
                  fullData = nd;
                  break;
                }
              } else if (nd.name === name && ndType === cardPropertyType) {
                fullData = nd;
                break;
              }
            }

            var message = {
              type: 'flyTo',
              lat: lat,
              lng: lng,
              neighborhoodName: name,
              zoom: 14,
              stats: fullData ? (fullData.stats || {}) : {},
              propertyType: cardPropertyType
            };

            console.log('[NavCards] Sending flyTo:', name);
            iframe.contentWindow.postMessage(message, '*');
          }, HOVER_DELAY);
        });

        row.addEventListener('mouseleave', function() {
          if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
          }
        });
      });
    });
  }

  // ============================================
  // Initialize
  // ============================================

  function applyContainerStyles() {
    container.className = 'max-w-6xl mx-auto py-8';
    container.removeAttribute('style');
  }

  function getPropertyType() {
    var dataAttr = container.getAttribute('data-property-type');
    if (dataAttr) {
      return dataAttr.toLowerCase();
    }
    var path = window.location.pathname;
    return path.indexOf('/condo-search/') !== -1 ? 'condos' : 'homes';
  }

  function init() {
    container = document.getElementById('area-cards');
    if (!container) {
      console.warn('[NavCards] Container #area-cards not found, retrying...');
      var attempts = 0;
      var maxAttempts = 10;
      var retryInterval = setInterval(function() {
        attempts++;
        container = document.getElementById('area-cards');
        if (container) {
          console.log('[NavCards] Container found after', attempts, 'attempt(s)');
          clearInterval(retryInterval);
          applyContainerStyles();
          propertyType = getPropertyType();
          console.log('[NavCards] Property type:', propertyType);
          loadData();
        } else if (attempts >= maxAttempts) {
          console.error('[NavCards] Container #area-cards not found after', maxAttempts, 'attempts');
          clearInterval(retryInterval);
        }
      }, 500);
      return;
    }
    applyContainerStyles();
    propertyType = getPropertyType();
    console.log('[NavCards] Container found, property type:', propertyType);
    loadData();
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

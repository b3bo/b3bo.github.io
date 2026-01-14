/**
 * Area Header Component
 * Renders community page header (H1 through Market Stats H2)
 *
 * Loads data from neighborhood JSONs and matches by URL slug.
 */
(function() {
  'use strict';

  var container = document.getElementById('area-header');
  if (!container) return;

  // Use local files for dev, remote for production
  var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  var mlsBaseUrl = isLocal ? '/assets/mls/ecar/' : 'https://neighborhoods.truesouthcoastalhomes.com/assets/mls/ecar/';

  var jsonFiles = {
    neighborhoods: [
      'neighborhoods/d2ea7fdfc87ff3e7.json.b64',  // 30A East
      'neighborhoods/d897c3d107c48ccc.json.b64',  // 30A West
      'neighborhoods/dcb3d8a92cc6eb54.json.b64',  // Destin
      'neighborhoods/e0e3b36d8e692892.json.b64',  // Miramar Beach
      'neighborhoods/f7e6349b564cdbb2.json.b64',  // PCB
      'neighborhoods/7ea1bf14d884d192.json.b64',  // Sandestin
      'neighborhoods/b762bb338ba328e5.json.b64'   // Santa Rosa Beach
    ],
    urlOverrides: 'search_id_overrides.json'
  };

  function decodeBase64Json(text) {
    var jsonStr = new TextDecoder().decode(
      Uint8Array.from(atob(text), function(c) { return c.charCodeAt(0); })
    );
    return JSON.parse(jsonStr);
  }

  function getDirectoryFromPath(path) {
    var parts = path.split('/').filter(function(p) { return p; });
    return parts.length > 0 ? parts[0].toUpperCase() : '';
  }

  function formatPropertyTypeLabel(type) {
    var t = (type || 'homes').toLowerCase();
    return t === 'townhomes' ? 'townhomes'
         : t === 'condos' ? 'condos'
         : t === 'lots' ? 'lots'
         : 'homes';
  }

  /**
   * Build subdivision search URL for iframe/link
   */
  function buildSubdivisionUrl(subdivisionName, forEmbed) {
    var encoded = subdivisionName.replace(/ /g, '+');
    var url = 'https://www.truesouthcoastalhomes.com/property-search/results/?searchtype=2&subdivision=' + encoded;
    if (forEmbed) url += '&embed=true';
    return url;
  }

  function renderHeader(data) {
    var areaName = data.name || 'Community';
    var directory = data.directory || '';
    var city = data.city || 'Emerald Coast';
    var propertyType = formatPropertyTypeLabel(data.propertyType);
    var heroImage = data.heroImage || '';
    var amenities = data.amenities || [];
    var searchId = data.searchId || '';
    var listingCount = data.listingCount || 0;

    // Build report URL (only if searchId exists)
    var reportUrl = searchId
      ? 'https://www.truesouthcoastalhomes.com/property-search/market-update/update/?searchtype=2&searchid=' + searchId
      : '#';

    // Build tags HTML (directory first, then amenities)
    var tags = [];
    if (directory) tags.push(directory);
    tags = tags.concat(amenities);
    var tagsHtml = tags.map(function(tag) {
      return '<a href="#">' + tag + '</a>';
    }).join('');

    container.innerHTML =
      // Section 1: H1 Hero (with image)
      '<div class="si-content-area">' +
      '<section>' +
        '<div class="hero-section">' +
          '<div class="hero-content">' +
            '<h1>Explore beautiful <span class="hero-headline-highlight">' + areaName + '</span> ' + propertyType + ' for sale in ' + city + ', FL.</h1>' +
            '<div class="hero-cta-group">' +
              '<button type="button" class="btn-custom js-new-listing-alerts">Notify Me About New Listings</button>' +
            '</div>' +
          '</div>' +
          (heroImage ? '<div class="hero-image hero-image-col">' +
            '<img alt="' + areaName + ' ' + propertyType + '" src="' + heroImage + '" height="307" loading="eager" fetchpriority="high" />' +
          '</div>' : '') +
        '</div>' +
      '</section>' +
      '</div>' +

      // Section 2: Breadcrumb
      '<nav class="breadcrumb-nav" aria-label="Breadcrumb">' +
        '<div class="breadcrumb-items">' +
          '<a href="/">Home</a>' +
          '<svg class="breadcrumb-chevron" width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>' +
          '<a href="/' + directory.toLowerCase() + '">' + directory + '</a>' +
          '<svg class="breadcrumb-chevron" width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>' +
          '<span class="breadcrumb-current" aria-current="page">' + areaName + '</span>' +
        '</div>' +
      '</nav>' +

      // Section 3: Button Group
      '<div class="si-content-area">' +
        '<div class="button-group-wrapper">' +
          '<div class="button-group" role="group" aria-label="Navigation options">' +
            '<a href="#listings" title="' + areaName + ' Homes for Sale">Homes</a>' +
            '<a href="#" title="' + areaName + ' Townhomes for Sale">Townhomes</a>' +
            '<a href="#faq" title="' + areaName + ' FAQ">FAQ</a>' +
            '<a href="#insight" title="' + areaName + ' Insight">Insight</a>' +
            '<a href="#map" title="' + areaName + ' Map">Map</a>' +
            '<a href="' + reportUrl + '" title="' + areaName + ' Market Update" target="_blank">Report</a>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Section 4: Secondary Title
      '<div class="si-content-area">' +
        '<h2>' + areaName + ' Real Estate in ' + city + ', FL</h2>' +
      '</div>' +

      // Section 5: Tags
      (amenities.length > 0 ?
      '<div class="si-content-area">' +
        '<div class="tags-section">' +
          '<div class="tag-items">' +
            '<i class="fa fa-tags tag-icon"></i>' +
            '<span>Tags: </span>' +
            tagsHtml +
          '</div>' +
        '</div>' +
      '</div>' : '') +

      // Section 6: Description (placeholder for blurb - to be implemented)
      '<div class="si-content-area">' +
        '<p>' + areaName + ' ' + propertyType + ' for sale offer a community experience in ' + city + ', FL. <a href="#read-more" title="Additional Community Info">Read More</a></p>' +
      '</div>' +

      // Section 7: Market Stats H2
      '<div class="si-content-area">' +
        '<h2>' + areaName + ' Market Stats</h2>' +
      '</div>' +

      // Section 8: Listings
      '<div id="listings" class="si-content-area">' +
        '<h2 id="listings-heading"></h2>' +
        '<div id="listing-gallery">' +
          (isLocal ? '' : '<iframe id="listing-iframe" src="" style="width:100%; min-height:800px; border:none;"></iframe>') +
        '</div>' +
      '</div>';

    // Update listings heading with count from neighborhood JSON
    var listingsHeading = document.getElementById('listings-heading');
    if (listingsHeading) {
      listingsHeading.textContent = listingCount + ' Active ' + propertyType.charAt(0).toUpperCase() + propertyType.slice(1) + ' for Sale in ' + areaName;
    }

    // Load listings - iframe on prod, link on local
    var gallery = document.getElementById('listing-gallery');
    if (gallery) {
      if (isLocal) {
        // Local: show link (iframe blocked cross-origin)
        var searchUrl = buildSubdivisionUrl(areaName, false);
        gallery.innerHTML =
          '<div class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">' +
            '<p class="text-gray-600 mb-4">' + listingCount + ' active listings in ' + areaName + '</p>' +
            '<a href="' + searchUrl + '" target="_blank" class="text-primary underline">View All ' + areaName + ' Listings</a>' +
          '</div>';
        console.log('[AreaHeader] Local mode - link:', searchUrl);
      } else {
        // Prod: load iframe with embed mode
        var iframe = document.getElementById('listing-iframe');
        if (iframe) {
          var embedUrl = buildSubdivisionUrl(areaName, true);
          iframe.src = embedUrl;
          console.log('[AreaHeader] Iframe loaded:', embedUrl);
        }
      }
    }
  }

  function findCommunityBySlug(neighborhoods, urlOverrides, currentPath) {
    // Normalize path for comparison
    var pathLower = currentPath.toLowerCase();
    if (!pathLower.endsWith('/')) pathLower += '/';

    console.log('[AreaHeader] Looking for path:', pathLower);

    // Search through overrides to find matching urlSlug
    for (var communityName in urlOverrides) {
      if (communityName.startsWith('_')) continue;
      var entry = urlOverrides[communityName];

      // Handle both nested structure { homes: { urlSlug } } and flat structure { urlSlug }
      if (entry.urlSlug !== undefined) {
        // Old flat structure - check directly
        if (entry.urlSlug && entry.urlSlug.toLowerCase() === pathLower) {
          console.log('[AreaHeader] Found match (flat):', communityName);
          var neighborhood = neighborhoods.find(function(n) {
            return n.name.toLowerCase() === communityName.toLowerCase();
          });
          if (neighborhood) {
            return {
              name: neighborhood.name,
              propertyType: neighborhood.propertyType,
              city: neighborhood.location ? neighborhood.location.city : '',
              heroImage: neighborhood.photos ? neighborhood.photos.hero : '',
              amenities: neighborhood.amenities || [],
              directory: getDirectoryFromPath(entry.urlSlug),
              searchId: entry.searchId || '',
              listingCount: (neighborhood.stats && neighborhood.stats.listingCount) || 0
            };
          }
        }
      } else {
        // New nested structure - check each property type's urlSlug
        for (var propType in entry) {
          var propEntry = entry[propType];
          if (propEntry && propEntry.urlSlug && propEntry.urlSlug.toLowerCase() === pathLower) {
            console.log('[AreaHeader] Found match (nested):', communityName, propType);
            // Found match - now find the neighborhood data
            var neighborhood = neighborhoods.find(function(n) {
              return n.name.toLowerCase() === communityName.toLowerCase() &&
                     n.propertyType.toLowerCase() === propType.toLowerCase();
            });

            if (neighborhood) {
              return {
                name: neighborhood.name,
                propertyType: neighborhood.propertyType,
                city: neighborhood.location ? neighborhood.location.city : '',
                heroImage: neighborhood.photos ? neighborhood.photos.hero : '',
                amenities: neighborhood.amenities || [],
                directory: getDirectoryFromPath(propEntry.urlSlug),
                searchId: propEntry.searchId || '',
                listingCount: (neighborhood.stats && neighborhood.stats.listingCount) || 0
              };
            }
          }
        }
      }
    }
    console.log('[AreaHeader] No match found for path:', pathLower);
    return null;
  }

  function loadAndRender() {
    // Allow test override via data-test-path attribute
    var currentPath = container.getAttribute('data-test-path') || window.location.pathname;
    console.log('[AreaHeader] Loading data for path:', currentPath);

    // Load URL overrides
    var overridesPromise = fetch(mlsBaseUrl + jsonFiles.urlOverrides)
      .then(function(r) { return r.ok ? r.json() : {}; })
      .catch(function() { return {}; });

    // Load all neighborhood files (base64 encoded)
    var neighborhoodPromises = jsonFiles.neighborhoods.map(function(file) {
      return fetch(mlsBaseUrl + file)
        .then(function(r) { return r.ok ? r.text() : null; })
        .then(function(text) {
          if (!text) return [];
          try {
            var data = decodeBase64Json(text);
            return data.neighborhoods || [];
          } catch (e) {
            console.warn('[AreaHeader] Failed to decode', file, e);
            return [];
          }
        })
        .catch(function() { return []; });
    });

    Promise.all([overridesPromise, Promise.all(neighborhoodPromises)])
      .then(function(results) {
        var urlOverrides = results[0];
        var neighborhoodArrays = results[1];

        // Flatten all neighborhoods
        var allNeighborhoods = [];
        neighborhoodArrays.forEach(function(arr) {
          allNeighborhoods = allNeighborhoods.concat(arr);
        });

        console.log('[AreaHeader] Loaded', allNeighborhoods.length, 'neighborhoods,', Object.keys(urlOverrides).length, 'overrides');

        // Find community matching current URL
        var communityData = findCommunityBySlug(allNeighborhoods, urlOverrides, currentPath);

        if (communityData) {
          console.log('[AreaHeader] Found community:', communityData.name);
          renderHeader(communityData);
        } else {
          console.warn('[AreaHeader] No community found for path:', currentPath);
          // Render with fallback data from URL
          var parts = currentPath.split('/').filter(function(p) { return p; });
          renderHeader({
            name: parts.length > 1 ? parts[1].replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Community',
            directory: parts.length > 0 ? parts[0].toUpperCase() : '',
            city: 'Emerald Coast',
            propertyType: 'homes',
            heroImage: '',
            amenities: []
          });
        }
      })
      .catch(function(err) {
        console.error('[AreaHeader] Failed to load data:', err);
      });
  }

  // Initialize
  loadAndRender();
})();

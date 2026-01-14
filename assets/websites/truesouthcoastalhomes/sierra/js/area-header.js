/**
 * Area Header Component
 * Renders community page header (H1 through Market Stats H2)
 */
(function() {
  'use strict';

  var container = document.getElementById('area-header');
  if (!container) return;

  // Hardcoded for now - will be dynamic later
  var areaName = 'Watersound Origins';
  var directory = '30A';
  var city = 'Inlet Beach';
  var propertyType = 'homes';

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
        '<div class="hero-image hero-image-col">' +
          '<img alt="' + areaName + ' Homes" src="https://res.cloudinary.com/diovgtpmh/image/upload/c_fill,dpr_auto,f_auto,q_auto:eco,w_512/c_scale,g_south_east,l_Logos:TS_Logo,w_100,x_25,y_0/v1763936527/30A/Watersound-Origins/Watersound-Origins-Land-1_Hero.webp" height="307" loading="eager" fetchpriority="high" />' +
        '</div>' +
      '</div>' +
    '</section>' +
    '</div>' +

    // Section 2: Breadcrumb
    '<nav class="breadcrumb-nav" aria-label="Breadcrumb">' +
      '<div class="breadcrumb-items">' +
        '<a href="/">Home</a>' +
        '<svg class="breadcrumb-chevron" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>' +
        '<a href="/30a">' + directory + '</a>' +
        '<svg class="breadcrumb-chevron" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>' +
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
          '<a href="#" title="' + areaName + ' Market Update" target="_blank">Report</a>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Section 4: Secondary Title
    '<div class="si-content-area">' +
      '<h2>' + areaName + ' Real Estate in ' + city + ', FL</h2>' +
    '</div>' +

    // Section 5: Tags
    '<div class="si-content-area">' +
      '<div class="tags-section">' +
        '<div class="tag-items">' +
          '<i class="fa fa-tags tag-icon"></i>' +
          '<span>Tags: </span>' +
          '<a href="#">30A</a><a href="#">Fitness</a><a href="#">Golf</a><a href="#">No Short-Term</a><a href="#">Pickleball</a><a href="#">Pool</a><a href="#">Tennis</a><a href="#">Walking Trails</a>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Section 6: Description
    '<div class="si-content-area">' +
      '<p>' + areaName + ' homes for sale offer a master-planned community experience along Florida\'s Emerald Coast in ' + city + ', providing residents access to coastal living near the renowned 30A corridor. This expansive neighborhood in South Walton County combines natural surroundings with modern amenities, attracting families and retirees seeking a lifestyle-oriented community close to the Gulf of America\'s beaches. <a href="#read-more" title="Additional Community Info">Read More</a></p>' +
    '</div>' +

    // Section 7: Market Stats H2
    '<div class="si-content-area">' +
      '<h2>' + areaName + ' Market Stats</h2>' +
    '</div>';
})();

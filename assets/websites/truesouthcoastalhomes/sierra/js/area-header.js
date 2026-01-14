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
      '<div class="container mx-auto flex flex-col-reverse px-5 mt-4 md:mt-9 mb-4 md:flex-row">' +
        '<div class="flex flex-col md:mb-0 md:w-1/2 md:items-start md:pr-16 md:text-left lg:flex-grow lg:pr-24">' +
          '<h1>Explore beautiful <span class="hero-headline-highlight">' + areaName + '</span> ' + propertyType + ' for sale in ' + city + ', FL.</h1>' +
          '<div class="flex justify-center gap-4">' +
            '<button type="button" class="btn-custom js-new-listing-alerts">Notify Me About New Listings</button>' +
          '</div>' +
        '</div>' +
        '<div class="hero-image flex w-full items-center justify-center md:w-1/2 md:items-start md:justify-start lg:w-full lg:max-w-lg">' +
          '<img class="rounded object-cover object-center aspect-[10/6]" alt="' + areaName + ' Homes" src="https://res.cloudinary.com/diovgtpmh/image/upload/c_fill,dpr_auto,f_auto,q_auto:eco,w_512/c_scale,g_south_east,l_Logos:TS_Logo,w_100,x_25,y_0/v1763936527/30A/Watersound-Origins/Watersound-Origins-Land-1_Hero.webp" height="307" loading="eager" fetchpriority="high" />' +
        '</div>' +
      '</div>' +
    '</section>' +
    '</div>' +

    // Section 2: Breadcrumb
    '<nav aria-label="Breadcrumb">' +
      '<div class="breadcrumb-items flex justify-center items-center px-4 space-x-2 md:space-x-4 font-body text-neutral-700 mt-4">' +
        '<a href="/">Home</a>' +
        '<svg class="w-4 h-4 text-neutral-400 flex-shrink-0" style="width: 1rem; height: 1rem;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>' +
        '<a href="/30a">' + directory + '</a>' +
        '<svg class="w-4 h-4 text-neutral-400 flex-shrink-0" style="width: 1rem; height: 1rem;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>' +
        '<span class="text-neutral-500" aria-current="page">' + areaName + '</span>' +
      '</div>' +
    '</nav>' +

    // Section 3: Button Group
    '<div class="si-content-area">' +
      '<div class="flex justify-center">' +
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
      '<div class="flex justify-center items-center mt-2 mb-8 px-4">' +
        '<div class="tag-items flex items-center justify-center space-x-1 md:space-x-2 flex-wrap text-sm font-body text-neutral-700 font-bold">' +
          '<i class="fa fa-tags text-primary-600 flex-shrink-0" style="width: 1rem; height: 1rem;"></i>' +
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

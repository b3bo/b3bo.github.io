/**
 * Listing Card Component (Tailwind)
 * Renders listing cards with Tailwind CSS classes
 *
 * Uses Sierra CDN for photos and includes data attributes
 * for compatibility with Sierra's event handlers (favorites, etc.)
 */
(function() {
  'use strict';

  // Constants
  var REGION_ID = 40; // ECAR MLS region
  var SIERRA_CDN = 'https://cdn.listingphotos.sierrastatic.com/pics2x';
  var SIERRA_BASE = 'https://www.truesouthcoastalhomes.com';

  /**
   * Build photo URL from MLS ID
   */
  function buildPhotoUrl(mlsId, photoIndex) {
    photoIndex = photoIndex || 1;
    var paddedIndex = photoIndex < 10 ? '0' + photoIndex : photoIndex;
    return SIERRA_CDN + '/' + REGION_ID + '/' + REGION_ID + '_' + mlsId + '_' + paddedIndex + '.jpg';
  }

  /**
   * Build detail page URL from listing data
   */
  function buildDetailUrl(listing) {
    var slug = buildAddressSlug(listing);
    return '/property-search/detail/' + REGION_ID + '/' + listing.mlsId + '/' + slug + '/';
  }

  /**
   * Build address slug from listing data
   */
  function buildAddressSlug(listing) {
    var parts = [];
    if (listing.streetAddress) parts.push(listing.streetAddress);
    if (listing.city) parts.push(listing.city);
    if (listing.state) parts.push(listing.state);
    if (listing.zip) parts.push(listing.zip);

    return parts.join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Format price with commas
   */
  function formatPrice(price) {
    if (!price) return 'N/A';
    return '$' + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Format number with commas
   */
  function formatNumber(num) {
    if (!num) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Render a single listing card with Tailwind classes
   */
  function renderCard(listing) {
    if (!listing || !listing.mlsId) {
      console.warn('[ListingCard] Missing required mlsId');
      return '';
    }

    var photoUrl = buildPhotoUrl(listing.mlsId);
    // Use provided detailUrl if available (from Sierra widget), otherwise build our own
    var detailUrl = listing.detailUrl || buildDetailUrl(listing);
    var fullDetailUrl = detailUrl.startsWith('http') ? detailUrl : SIERRA_BASE + detailUrl;

    var priceDisplay = formatPrice(listing.price);
    var sqftDisplay = formatNumber(listing.sqft);
    var cityStateZip = [listing.city, listing.state, listing.zip].filter(Boolean).join(', ');
    var altText = [listing.streetAddress, listing.city, listing.state, listing.zip].filter(Boolean).join(' ');
    var internalId = listing.internalId || ('lw' + listing.mlsId);

    var html =
      '<div id="' + internalId + '" class="bg-white border-2 border-[#ececec] overflow-hidden relative transition-colors duration-400 hover:border-primary" ' +
        'data-url="' + detailUrl + '" data-offset="1">' +

        // Photo section - relative container
        '<div class="bg-gray-700 relative">' +
          // Favorite button (white icon, transparent background)
          '<button type="button" class="absolute top-3 right-3 z-10 bg-transparent border-none p-2 text-white text-2xl cursor-pointer transition-all hover:scale-110 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" ' +
            'data-toggle="listing-state" data-state="save" ' +
            'data-mlsid="' + listing.mlsId + '" data-mlsregionid="' + REGION_ID + '" ' +
            'aria-label="Save Listing">' +
            '<i class="fa fa-heart-o"></i>' +
          '</button>' +

          '<a href="' + fullDetailUrl + '" class="block js-listing-detail">' +
            // Image container - aspect ratio with full coverage
            '<div class="aspect-[4/3] overflow-hidden">' +
              '<img src="' + photoUrl + '" ' +
                'class="w-full h-full object-cover object-top" ' +
                'alt="' + altText + '" loading="lazy">' +
            '</div>' +
            // Price overlay
            '<div class="absolute bottom-0 left-0 right-0 px-4 pt-8 pb-3 bg-gradient-to-t from-black/70 to-transparent text-white flex justify-between items-end">' +
              '<span class="text-2xl font-bold">' + priceDisplay + '</span>' +
              (listing.photoCount ?
                '<span class="text-sm opacity-90">' + listing.photoCount + ' <i class="fa fa-camera"></i></span>'
                : '') +
            '</div>' +
          '</a>' +
        '</div>' +

        // Title section
        '<a href="' + fullDetailUrl + '" title="' + altText + '" class="block no-underline text-inherit hover:text-inherit js-listing-detail">' +
          '<div class="px-4 py-3">' +
            '<div class="text-gray-600 text-lg font-semibold">' + (listing.streetAddress || 'Address unavailable') + '</div>' +
            '<div class="text-gray-400 text-xs uppercase mt-1">' + cityStateZip.toUpperCase() + '</div>' +
          '</div>' +
        '</a>' +

        // Content section
        '<div class="px-4 pb-4">' +
          // Subdivision
          (listing.subdivision ?
            '<div class="border-b border-gray-200 pb-2 mb-2">' +
              '<span class="text-primary text-sm">' + listing.subdivision + '</span>' +
            '</div>'
            : '') +

          // Beds/Baths/Sqft grid
          '<div class="flex border-b border-gray-200 pb-2 mb-2">' +
            '<div class="flex-1 text-center relative after:content-[\'\'] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">' +
              '<div class="text-xl font-semibold text-gray-800">' + (listing.beds || '-') + '</div>' +
              '<div class="text-gray-500 text-xs mt-1">Beds</div>' +
            '</div>' +
            '<div class="flex-1 text-center relative after:content-[\'\'] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">' +
              '<div class="text-xl font-semibold text-gray-800">' + (listing.baths || '-') + '</div>' +
              '<div class="text-gray-500 text-xs mt-1">Baths</div>' +
            '</div>' +
            '<div class="flex-1 text-center">' +
              '<div class="text-xl font-semibold text-gray-800">' + (sqftDisplay || '-') + '</div>' +
              '<div class="text-gray-500 text-xs mt-1">Sq.Ft.</div>' +
            '</div>' +
          '</div>' +

          // Footer
          '<div class="text-primary text-xs">' +
            'MLS #: ' + listing.mlsId +
          '</div>' +
        '</div>' +

      '</div>';

    return html;
  }

  /**
   * Render a gallery of listing cards
   */
  function renderGallery(listings, options) {
    options = options || {};

    if (!listings || !listings.length) {
      return '<p class="text-gray-400 text-center py-10">No listings available.</p>';
    }

    var cols = options.columns || 3;
    var gridClass = 'grid gap-5 ';
    if (cols === 2) gridClass += 'grid-cols-1 md:grid-cols-2';
    else if (cols === 4) gridClass += 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    else gridClass += 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'; // default 3

    var html = '<div class="' + gridClass + '">';

    for (var i = 0; i < listings.length; i++) {
      html += '<div data-compliance="' + REGION_ID + '">';
      html += renderCard(listings[i]);
      html += '</div>';
    }

    html += '</div>';

    return html;
  }

  /**
   * Render listing cards into a container element
   */
  function render(container, listings, options) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (!container) {
      console.error('[ListingCard] Container not found');
      return;
    }

    container.innerHTML = renderGallery(listings, options);
  }

  // Expose API
  window.ListingCard = {
    render: render,
    renderGallery: renderGallery,
    renderCard: renderCard,
    buildPhotoUrl: buildPhotoUrl,
    buildDetailUrl: buildDetailUrl
  };

})();

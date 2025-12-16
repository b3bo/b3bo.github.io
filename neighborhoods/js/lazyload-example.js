/**
 * @file lazyload-example.js
 * @description Example: How to add lazy-loaded community images to neighborhood cards
 * 
 * Use this as a reference for adding community hero/thumbnail images to the list items
 * or info windows when your image assets are ready.
 * 
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */

import { initLazyLoad, createBlurUpImage, createResponsiveImage } from './lazyload.js';

/**
 * EXAMPLE 1: Add a community thumbnail to a neighborhood card
 * (Integrate this into renderListItems() in ui.js)
 */
export function renderCommunityImageInCard(card, neighborhood) {
  // Example: Assume images are stored in assets/img/neighborhoods/{urlslug}.jpg
  const imageDir = './neighborhoods/img/communities';
  const communitySlug = neighborhood.urlSlug?.split('/').filter(p => p).pop() || 'default';
  const imageUrl = `${imageDir}/${communitySlug}.jpg`;
  
  // Optional: Low-res placeholder (if you have one, or use a data URI)
  const placeholderUrl = `${imageDir}/${communitySlug}-thumb.jpg`;
  
  // Create a container for the image
  const imageContainer = document.createElement('div');
  imageContainer.className = 'w-full h-48 bg-neutral-100 dark:bg-dark-bg-elevated rounded-lg overflow-hidden';
  
  // Create a lazy-loaded image with blur-up effect
  const img = createBlurUpImage(
    placeholderUrl,       // Low-res blur placeholder
    imageUrl,            // Full-res source
    neighborhood.name,   // Alt text
    'w-full h-full object-cover' // CSS classes for scaling
  );
  
  imageContainer.appendChild(img);
  
  // Prepend image to the card (before the title)
  card.insertBefore(imageContainer, card.firstChild);
}

/**
 * EXAMPLE 2: Add responsive images with srcset
 * (Use this for desktop/tablet/mobile variants)
 */
export function renderResponsiveCommunityImage(card, neighborhood) {
  const communitySlug = neighborhood.urlSlug?.split('/').filter(p => p).pop() || 'default';
  const baseUrl = './neighborhoods/img/communities';
  
  const img = createResponsiveImage(
    `${baseUrl}/${communitySlug}-medium.jpg`,  // Fallback source
    {
      [`${baseUrl}/${communitySlug}-small.jpg`]: 640,      // Mobile
      [`${baseUrl}/${communitySlug}-medium.jpg`]: 1024,    // Tablet
      [`${baseUrl}/${communitySlug}-large.jpg`]: 1920      // Desktop
    },
    neighborhood.name,
    'w-full h-48 object-cover rounded-lg'
  );
  
  // Wrap in container
  const container = document.createElement('div');
  container.className = 'w-full h-48 bg-neutral-100 dark:bg-dark-bg-elevated rounded-lg overflow-hidden';
  container.appendChild(img);
  
  card.insertBefore(container, card.firstChild);
}

/**
 * EXAMPLE 3: Initialize lazy loading after rendering cards
 * Call this at the end of renderListItems() or when dynamic content is added
 */
export function enableLazyLoadingOnCards() {
  // Initialize lazy loading with 50px margin to load images just before they enter viewport
  initLazyLoad('img[data-src]', {
    rootMargin: '50px',
    threshold: 0.01
  });
}

/**
 * EXAMPLE 4: Preload hero/logo images for first community
 * (Integrate into setupUI() for performance)
 */
export async function preloadHeroImages(neighborhoods) {
  if (!neighborhoods || neighborhoods.length === 0) return;
  
  const firstCommunity = neighborhoods[0];
  const slug = firstCommunity.urlSlug?.split('/').filter(p => p).pop();
  
  if (!slug) return;
  
  try {
    // Preload first community's image for LCP (Largest Contentful Paint)
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = `./neighborhoods/img/communities/${slug}.jpg`;
    document.head.appendChild(link);
  } catch (e) {
    console.debug('[preloadHeroImages] Could not preload image:', e);
  }
}

/**
 * INTEGRATION CHECKLIST:
 * 
 * 1. Create image directory structure:
 *    NeighborhoodFinder/assets/neighborhoods/img/communities/
 *    
 * 2. Add images (optimized for web):
 *    - community-name.jpg (primary, ~1920px wide)
 *    - community-name-thumb.jpg (optional, blur placeholder, ~40px wide)
 *    - community-name-small.jpg (mobile, ~640px)
 *    - community-name-medium.jpg (tablet, ~1024px)
 *    - community-name-large.jpg (desktop, ~1920px)
 *
 * 3. Update ui.js renderListItems() to include image:
 *    // Near the start of renderListItems():
 *    if (neighborhood.photoUrl || communityHasImage(neighborhood)) {
 *      renderCommunityImageInCard(card, neighborhood);
 *    }
 *    enableLazyLoadingOnCards();
 *
 * 4. Update setupUI() to preload first community:
 *    const neighborhoods = [...]; // Get initial neighborhoods
 *    preloadHeroImages(neighborhoods);
 *
 * 5. Optional: Store image URLs in neighborhood JSON:
 *    {
 *      "name": "Watersound",
 *      "photoUrl": "./neighborhoods/img/communities/watersound.jpg",
 *      ...
 *    }
 *
 * CSS CLASSES AVAILABLE:
 * - lazy-image: Applied by default
 * - lazy-loaded: Applied after image loads
 * - loaded: Applied by blur-up variant
 *
 * PERFORMANCE NOTES:
 * - Images load ~50px before entering viewport (configurable)
 * - Blur placeholder reduces perceived load time
 * - Responsive srcset ensures optimal image for device width
 * - Native lazy loading (loading="lazy") used when available
 * - Fallback to Intersection Observer for older browsers
 */

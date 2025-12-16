/**
 * @file lazyload.js
 * @description Native lazy loading utility with Intersection Observer fallback.
 * Handles responsive image loading with optional placeholder.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */

/**
 * Enable lazy loading for images with native support + Intersection Observer fallback
 * @param {string} selector - CSS selector for images to lazy load (default: 'img[data-src]')
 * @param {Object} options - Intersection Observer options
 *   @param {string} options.rootMargin - Margin around viewport (default: '50px')
 *   @param {number} options.threshold - Visibility threshold (default: 0.01)
 */
export function initLazyLoad(selector = 'img[data-src]', options = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.01
  } = options;

  const images = document.querySelectorAll(selector);

  if (!images.length) {
    console.debug('[lazyload] No images found with selector:', selector);
    return;
  }

  // Check for native lazy loading support
  const supportsNativeLoading = 'loading' in HTMLImageElement.prototype;

  if (supportsNativeLoading) {
    // Use native lazy loading with loading="lazy"
    images.forEach(img => {
      if (img.dataset.src && !img.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.setAttribute('loading', 'lazy');
      }
    });
    console.debug('[lazyload] Using native lazy loading for', images.length, 'image(s)');
    return;
  }

  // Fallback: Intersection Observer for older browsers
  if (!('IntersectionObserver' in window)) {
    console.warn('[lazyload] IntersectionObserver not supported; loading all images');
    images.forEach(img => {
      if (img.dataset.src && !img.src) {
        img.src = img.dataset.src;
      }
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('lazy-loaded');
          observer.unobserve(img);
        }
      }
    });
  }, {
    root: null,
    rootMargin,
    threshold
  });

  images.forEach(img => imageObserver.observe(img));
  console.debug('[lazyload] Initialized Intersection Observer for', images.length, 'image(s)');
}

/**
 * Preload a single image (for hero/critical images)
 * @param {string} src - Image source URL
 * @returns {Promise} Resolves when image loads
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Create a responsive image with srcset support
 * @param {string} src - Base image source
 * @param {Object} srcset - Responsive image set { 'mobile.jpg': 640, 'tablet.jpg': 1024, 'desktop.jpg': 1920 }
 * @param {string} alt - Alt text
 * @param {string} classes - CSS classes (optional)
 * @returns {HTMLImageElement}
 */
export function createResponsiveImage(src, srcset = {}, alt = '', classes = '') {
  const img = document.createElement('img');

  img.alt = alt;
  img.dataset.src = src;

  if (classes) {
    img.className = classes;
  }

  // Build srcset attribute if provided
  if (Object.keys(srcset).length > 0) {
    const srcsetString = Object.entries(srcset)
      .map(([url, width]) => `${url} ${width}w`)
      .join(', ');
    img.dataset.srcset = srcsetString;
  }

  return img;
}

/**
 * Create a lazy-loaded image with blur-up placeholder effect
 * @param {string} blurPlaceholder - Low-res/blurred placeholder (data URI or URL)
 * @param {string} src - Full-res source
 * @param {string} alt - Alt text
 * @param {string} classes - CSS classes
 * @returns {HTMLImageElement}
 */
export function createBlurUpImage(blurPlaceholder, src, alt = '', classes = '') {
  const img = document.createElement('img');

  img.alt = alt;
  img.src = blurPlaceholder; // Start with blur
  img.dataset.src = src; // Full res in data-src

  if (classes) {
    img.className = classes;
  }

  // Add transition for smooth blur-up effect
  img.addEventListener('load', () => {
    if (img.dataset.src) {
      img.classList.add('loaded');
    }
  });

  return img;
}

/**
 * Example: Initialize lazy loading on DOMContentLoaded
 * Uncomment to auto-init on page load
 */
// document.addEventListener('DOMContentLoaded', () => {
//   initLazyLoad('img[data-src]', { rootMargin: '50px' });
// });

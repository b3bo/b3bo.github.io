<script>
  (function() {
    // Step 1: Preconnect for Cloudinary (for image LCP)
    console.log('Step 1: Preconnect added for https://res.cloudinary.com');
    var cloudinaryPreconnect = document.createElement('link');
    cloudinaryPreconnect.rel = 'preconnect';
    cloudinaryPreconnect.href = 'https://res.cloudinary.com';
    document.head.appendChild(cloudinaryPreconnect);
    // Step 2: Dynamic preloads for hero and logo images (run on DOM ready for LCP)
    function addImagePreloads() {
      var imagesToPreload = document.querySelectorAll('img[src*="Hero"], img[src*="Logo"]');
      var subStep = 1;
      imagesToPreload.forEach(function(img) {
        var imgSrc = img.src;
        if (!imgSrc || document.querySelector('link[href="' + imgSrc + '"]')) return;
        var preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.href = imgSrc;
        preloadLink.as = 'image';
        preloadLink.fetchpriority = 'high';
        document.head.appendChild(preloadLink);
        console.log('Step 2.' + subStep + ': Preload added for image: ' + imgSrc);
        subStep++;
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addImagePreloads);
    } else {
      addImagePreloads();
    }
  })();
</script>
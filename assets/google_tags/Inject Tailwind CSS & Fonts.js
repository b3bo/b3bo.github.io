<script>
  (function() {
    // Step 1: Load critical CSS first (blocking in head)
    console.log('Step 1: Stylesheet link added for Critical CSS (loaded first)');
    var criticalLink = document.createElement('link');
    criticalLink.rel = 'stylesheet';
    criticalLink.href = 'https://b3bo.github.io/assets/css/critical.css'; 
    criticalLink.onload = function() {
      console.log('Critical CSS loaded successfully');
    };
    criticalLink.onerror = function() {
      console.error('Error: Failed to load Critical CSS');
    };
    document.head.appendChild(criticalLink);

    // Step 2: Preconnect for asset domain (for self-hosted fonts and CSS)
    console.log('Step 2: Preconnect added for https://b3bo.github.io');
    var assetPreconnect = document.createElement('link');
    assetPreconnect.rel = 'preconnect';
    assetPreconnect.href = 'https://b3bo.github.io';
    document.head.appendChild(assetPreconnect);

    // Step 3: Preload self-hosted fonts (with crossorigin='anonymous' to match credentials mode)
    console.log('Step 3.1: Preload added for Montserrat variable');
    var montVariable = document.createElement('link');
    montVariable.rel = 'preload';
    montVariable.href = 'https://b3bo.github.io/assets/fonts/Montserrat/Montserrat-VF.woff2';
    montVariable.as = 'font';
    montVariable.type = 'font/woff2';
    montVariable.crossorigin = 'anonymous';
    document.head.appendChild(montVariable);

    console.log('Step 3.2: Preload added for Roboto variable');
    var robotoVariable = document.createElement('link');
    robotoVariable.rel = 'preload';
    robotoVariable.href = 'https://b3bo.github.io/assets/fonts/Roboto/Roboto-Flex-VF.woff2';
    robotoVariable.as = 'font';
    robotoVariable.type = 'font/woff2';
    robotoVariable.crossorigin = 'anonymous';
    document.head.appendChild(robotoVariable);

    // Step 4: Preload minified Tailwind CSS
    console.log('Step 4: Preload added for minified Tailwind CSS');
    var tailwindPreload = document.createElement('link');
    tailwindPreload.rel = 'preload';
    tailwindPreload.href = 'https://b3bo.github.io/assets/css/tailwind.css'; 
    tailwindPreload.as = 'style';
    document.head.appendChild(tailwindPreload);

    // Step 5: Load full minified Tailwind CSS asynchronously in head (after critical)
    console.log('Step 5: Stylesheet link added for minified Tailwind CSS');
    var tailwindLink = document.createElement('link');
    tailwindLink.rel = 'stylesheet';
    tailwindLink.href = 'https://b3bo.github.io/assets/css/tailwind.css'; // Updated to minified Tailwind
    tailwindLink.media = 'print'; // Async hack
    tailwindLink.onload = function() {
      this.media = 'all';
      console.log('Minified Tailwind CSS loaded successfully');
    };
    tailwindLink.onerror = function() {
      console.error('Error: Failed to load minified Tailwind CSS');
    };
    document.head.appendChild(tailwindLink);

    // Noscript fallback for Tailwind
    var noscriptTailwind = document.createElement('noscript');
    noscriptTailwind.innerHTML = '<link rel="stylesheet" href="https://b3bo.github.io/assets/css/tailwind.css">';
    document.head.appendChild(noscriptTailwind);
  })();
</script>
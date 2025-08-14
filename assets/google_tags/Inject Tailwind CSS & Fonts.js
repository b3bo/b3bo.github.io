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

    // Step 3: Preload self-hosted fonts
    console.log('Step 3.1: Preload added for Montserrat variable');
    var montVariable = document.createElement('link');
    montVariable.rel = 'preload';
    montVariable.href = 'https://b3bo.github.io/assets/fonts/Montserrat/montserrat-variable-latin.woff2';
    montVariable.as = 'font';
    montVariable.type = 'font/woff2';
    montVariable.crossorigin = 'anonymous';
    document.head.appendChild(montVariable);

    console.log('Step 3.2: Preload added for Roboto regular');
    var robotoRegular = document.createElement('link');
    robotoRegular.rel = 'preload';
    robotoRegular.href = 'https://b3bo.github.io/assets/fonts/Roboto/roboto-v48-latin-regular.woff2';
    robotoRegular.as = 'font';
    robotoRegular.type = 'font/woff2';
    robotoRegular.crossorigin = 'anonymous';
    document.head.appendChild(robotoRegular);

    console.log('Step 3.3: Preload added for Roboto bold');
    var robotoBold = document.createElement('link');
    robotoBold.rel = 'preload';
    robotoBold.href = 'https://b3bo.github.io/assets/fonts/Roboto/roboto-v48-latin-700.woff2';
    robotoBold.as = 'font';
    robotoBold.type = 'font/woff2';
    robotoBold.crossorigin = 'anonymous';
    document.head.appendChild(robotoBold);

    // Step 4: Preload styles CSS (updated from tailwind)
    console.log('Step 4: Preload added for styles CSS');
    var stylesPreload = document.createElement('link');
    stylesPreload.rel = 'preload';
    stylesPreload.href = 'https://b3bo.github.io/assets/css/styles.css'; 
    stylesPreload.as = 'style';
    document.head.appendChild(stylesPreload);

    // Step 5: Load full styles CSS asynchronously in head (after critical)
    console.log('Step 5: Stylesheet link added for styles CSS');
    var stylesLink = document.createElement('link');
    stylesLink.rel = 'stylesheet';
    stylesLink.href = 'https://b3bo.github.io/assets/css/tailwind.css'; // Updated path
    stylesLink.media = 'print'; // Async hack
    stylesLink.onload = function() {
      this.media = 'all';
      console.log('styles CSS loaded successfully');
    };
    stylesLink.onerror = function() {
      console.error('Error: Failed to load styles CSS');
    };
    document.head.appendChild(stylesLink);

    // Noscript fallback for styles
    var noscriptStyles = document.createElement('noscript');
    noscriptStyles.innerHTML = '<link rel="stylesheet" href="https://b3bo.github.io/assets/css/styles.css">';
    document.head.appendChild(noscriptStyles);
  })();
</script>
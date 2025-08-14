<script>
  (function() {
    // Step 1: Load critical CSS first (blocking in head)
    console.log('Step 1: Stylesheet link added for Critical CSS (loaded first)');
    var criticalLink = document.createElement('link');
    criticalLink.rel = 'stylesheet';
    criticalLink.href = 'https://b3bo.github.io/assets/css/critical.css'; // Adjust path to your critical.css
    criticalLink.onload = function() {
      console.log('Critical CSS loaded successfully');
    };
    criticalLink.onerror = function() {
      console.error('Error: Failed to load Critical CSS');
    };
    document.head.appendChild(criticalLink);

    // Step 2: Preconnect for font resources
    console.log('Step 2: Preconnect added for https://fonts.googleapis.com');
    var link1 = document.createElement('link');
    link1.rel = 'preconnect';
    link1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(link1);

    console.log('Step 3: Preconnect added for https://fonts.gstatic.com');
    var link2 = document.createElement('link');
    link2.rel = 'preconnect';
    link2.href = 'https://fonts.gstatic.com';
    link2.setAttribute('crossorigin', '');
    document.head.appendChild(link2);

    // Step 4: Preload font stylesheet (trimmed weights)
    console.log('Step 4: Preload added for Montserrat and Roboto font stylesheet');
    var fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Roboto:wght@400;700&display=swap';
    fontPreload.as = 'style';
    document.head.appendChild(fontPreload);

    // Step 5: Preload Tailwind CSS
    console.log('Step 5: Preload added for Tailwind CSS');
    var tailwindPreload = document.createElement('link');
    tailwindPreload.rel = 'preload';
    tailwindPreload.href = 'https://b3bo.github.io/assets/css/tailwind.css'; // Adjust path
    tailwindPreload.as = 'style';
    document.head.appendChild(tailwindPreload);

    // Step 6: Load font stylesheet asynchronously
    console.log('Step 6: Stylesheet link added for Montserrat and Roboto fonts');
    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Roboto:wght@400;700&display=swap';
    fontLink.media = 'print'; // Async hack
    fontLink.onload = function() {
      this.media = 'all';
      console.log('Montserrat and Roboto font stylesheet loaded successfully');
    };
    fontLink.onerror = function() {
      console.error('Error: Failed to load Montserrat and Roboto font stylesheet');
    };
    document.head.appendChild(fontLink);

    // Noscript fallback for fonts
    var noscriptFonts = document.createElement('noscript');
    noscriptFonts.innerHTML = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Roboto:wght@400;700&display=swap">';
    document.head.appendChild(noscriptFonts);

    // Step 7: Load full Tailwind CSS asynchronously in head (after critical)
    console.log('Step 7: Stylesheet link added for Tailwind CSS');
    var tailwindLink = document.createElement('link');
    tailwindLink.rel = 'stylesheet';
    tailwindLink.href = 'https://b3bo.github.io/assets/css/tailwind.css'; // Adjust path
    tailwindLink.media = 'print'; // Async hack
    tailwindLink.onload = function() {
      this.media = 'all';
      console.log('Tailwind CSS loaded successfully');
    };
    tailwindLink.onerror = function() {
      console.error('Error: Failed to load Tailwind CSS');
    };
    document.head.appendChild(tailwindLink);

    // Noscript fallback for Tailwind
    var noscriptTailwind = document.createElement('noscript');
    noscriptTailwind.innerHTML = '<link rel="stylesheet" href="https://b3bo.github.io/assets/css/tailwind.css">';
    document.head.appendChild(noscriptTailwind);
  })();
</script>

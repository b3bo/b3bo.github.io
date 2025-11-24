# Sierra Support Request - Performance & Style Issues

**Date:** November 24, 2025  
**Site:** https://www.truesouthcoastalhomes.com  
**Example Page:** https://www.truesouthcoastalhomes.com/30a/watersound-origins/

---

## Issue 1: Console Errors - 404s

I'm seeing several 404 errors in the browser console that are impacting performance scores:

1. **product-gallery.js** - Returns 404
   - URL: `https://www.truesouthcoastalhomes.com/30a/watersound-origins/product-gallery.js`
   - Also causes a MIME type execution error

2. **watersound-origins.js** - Returns 404
   - URL: `https://www.truesouthcoastalhomes.com/30a/watersound-origins.js`

**Request:** Can you remove these script references from the template or verify if they should exist? These 404s waste bandwidth and create console noise.

---

## Issue 2: Preload Warning

There's a browser warning about a resource being preloaded but not used within a few seconds of page load.

**Request:** Can you identify which resource is being unnecessarily preloaded and either remove the preload or ensure it's actually used immediately?

---

## Issue 3: Font Flash (FOUC) & Outdated Fonts

**Background:** I'm using Google Tag Manager to inject custom Tailwind CSS and updated Google Fonts (Montserrat and Roboto with weights 400/500/600/700). However, there's a noticeable flash of unstyled content because GTM runs after the page starts rendering.

**Current situation from screenshot:**
- Sierra's template already preloads Roboto and Montserrat from `css.site-static.com`
- These appear to be older versions that don't match my brand requirements

**Request:** Can you add these 4 lines to the `<head>` section of my template **before the GTM container**? This would:
- Eliminate the flash of unstyled content
- Use the updated font versions I need
- Improve page load performance

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://b3bo.github.io/assets/css/tailwind.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Roboto:wght@400;500;600;700&display=swap">
```

**Alternative (if template modification isn't possible):** Can you update the existing Roboto and Montserrat font preloads to use the latest versions with the font weights I need (400/500/600/700)?

---

## Issue 4: Cloudflare + GTM Integration

I need help setting up Cloudflare integration with my Google Tag Manager (GTM-M87295X3) to improve tag firing behavior and consent mode compatibility.

**Context:** Sierra controls the Cloudflare account for my domain (truesouthcoastalhomes.com).

**Request:** Can someone from your team complete the Cloudflare connection in my GTM account? The setup requires:
1. Signing into Cloudflare 
2. Connecting it to my GTM container to route script requests through my first-party domain

**Note:** I've already invited support@sierrainteractive.com as an admin to my GTM account.

---

## Summary Priority

1. **High:** Add custom CSS/fonts to `<head>` (or update existing font versions) - eliminates FOUC
2. **Medium:** Fix 404 errors - improves performance scores
3. **Low:** Cloudflare GTM integration - future enhancement
4. **Low:** Investigate preload warning - minor optimization

Please let me know if any of these requests aren't feasible due to template restrictions. Happy to discuss alternative solutions.

Thanks!

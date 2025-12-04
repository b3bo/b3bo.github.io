# Agent Rebranding Guide

## Quick Rebrand (< 10 minutes)

### Step 1: Update Brand Colors

**File:** `assets/css/neighborhoods/styles.css`

Find the "AGENT REBRAND SECTION" (around lines 10-18) and update these 4 values:

```css
/* === AGENT REBRAND SECTION START === */

/* Primary Brand Color */
--color-brand-base: #4c8f96;      /* Main brand color (buttons, links, accents) */
--color-brand-hover: #3a7179;     /* Hover state (slightly darker) */
--color-brand-light: rgba(76, 143, 150, 0.1);  /* Light tint for backgrounds */
--color-brand-rgb: 76, 143, 150;  /* RGB values (must match brand-base) */

/* === AGENT REBRAND SECTION END === */
```

**Example:** Change to purple brand

```css
--color-brand-base: #7c3aed;
--color-brand-hover: #6d28d9;
--color-brand-light: rgba(124, 58, 237, 0.1);
--color-brand-rgb: 124, 58, 237;
```

**Example:** Change to orange brand

```css
--color-brand-base: #f97316;
--color-brand-hover: #ea580c;
--color-brand-light: rgba(249, 115, 22, 0.1);
--color-brand-rgb: 249, 115, 22;
```

**Example:** Change to green brand

```css
--color-brand-base: #059669;
--color-brand-hover: #047857;
--color-brand-light: rgba(5, 150, 105, 0.1);
--color-brand-rgb: 5, 150, 105;
```

---

### Step 2: Build CSS

Run Tailwind build:

```bash
npm run build:neighborhoods
```

**Expected output:**
```
> tailwindcss -i assets/css/neighborhoods/styles.css -o assets/css/tailwind_neighborhoods.css --minify
≈ tailwindcss v4.1.11
Done in 50ms
```

---

### Step 3: Update Branding Text (Optional)

**File:** `index.html`

Update these sections with agent-specific branding:

1. **Line 14** - Page title:
   ```html
   <title>Your Agent Name | Neighborhood Finder</title>
   ```

2. **Line 15** - Meta description:
   ```html
   <meta name="description" content="Your custom description...">
   ```

3. **Line 40** - Author:
   ```html
   <meta name="author" content="Your Agent Name">
   ```

---

### Step 4: Test

1. Open `index.html` in browser
2. Verify new brand color appears on:
   - Buttons
   - Selected filters
   - Hover states
   - Active markers
3. Test dark mode toggle (moon/sun icon in sidebar)
4. Verify brand color looks good in both light and dark themes

---

### Step 5: Deploy

Run deployment script:

```bash
# From repository root
RealEstateApps/scripts/spark_pathway/3_deploy_map.bat
```

Or manually:

```bash
git add assets/css/tailwind_neighborhoods.css index.html
git commit -m "Rebrand: Update to [Agent Name] colors"
git push
```

**Done!** Your rebranded site will be live in 1-2 minutes.

---

## Advanced Customization (Optional)

### Change Dark Mode Colors

**File:** `assets/css/neighborhoods/styles.css`

Find the dark mode section (around lines 35-45):

```css
/* Dark Mode Colors */
--color-dark-bg-base: #0f1419;        /* Deep dark background */
--color-dark-bg-elevated: #1a1f26;    /* Cards, panels */
--color-dark-bg-elevated-2: #252b34;  /* Hover states */
--color-dark-border: #2d3440;         /* Subtle borders */
--color-dark-text-primary: #e8eaed;   /* High contrast text */
--color-dark-text-secondary: #9ca3af; /* Muted text */

/* Brand colors adjusted for dark mode */
--color-brand-dark: #5ba3ab;          /* Lighter for contrast */
--color-brand-dark-hover: #6bb5be;    /* Even lighter on hover */
```

**Customize for your brand:**
- Make backgrounds lighter/darker
- Adjust brand color brightness for WCAG contrast
- Modify border subtlety

**After changes:** Run `npm run build:neighborhoods`

---

### Change Neutral Grays

**File:** `assets/css/neighborhoods/styles.css`

Update neutral palette for lighter/darker UI (around lines 20-30):

```css
/* Neutral Palette (Light Mode) */
--color-neutral-50: #f9fafb;   /* Lightest - hover backgrounds */
--color-neutral-100: #f3f4f6;  /* Tag backgrounds */
--color-neutral-200: #e5e7eb;  /* Borders, dividers */
--color-neutral-300: #d1d5db;  /* Hover borders */
--color-neutral-600: #4b5563;  /* Secondary text */
--color-neutral-800: #313842;  /* Primary text (headings) */
```

**Use case:**
- Lighter neutrals = softer, more spacious feel
- Darker neutrals = higher contrast, more dramatic

**After changes:** Run `npm run build:neighborhoods`

---

### Typography

**File:** `assets/css/neighborhoods/styles.css`

Update font family (around line 105):

```css
--font-sans: ui-sans-serif, system-ui, sans-serif;
```

**Custom font example:**

```css
--font-sans: "Proxima Nova", "Helvetica Neue", system-ui, sans-serif;
```

Don't forget to load the font in `index.html` `<head>`:

```html
<link href="https://fonts.googleapis.com/css2?family=Proxima+Nova:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**After changes:** Run `npm run build:neighborhoods`

---

## Troubleshooting

### Colors didn't change after build

1. Hard refresh browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Check browser DevTools Console for errors
3. Verify `tailwind_neighborhoods.css` timestamp updated
4. Clear browser cache

### Build fails

```bash
# Check for syntax errors in styles.css
npm run build:neighborhoods
```

Common issues:
- Missing semicolon in CSS
- Unclosed comment `/* ... */`
- Invalid color format (must be hex or rgba)

### Dark mode colors look wrong

1. Test WCAG contrast ratios: https://webaim.org/resources/contrastchecker/
2. Minimum contrast: 4.5:1 for body text, 3:1 for large text
3. Adjust `--color-brand-dark` if brand color fails contrast

---

## Color Palette Inspiration

### Modern Real Estate Brands

**Luxury Coastal:**
```css
--color-brand-base: #2c5f6f;  /* Deep teal */
--color-brand-hover: #1e4450;
```

**Warm & Welcoming:**
```css
--color-brand-base: #d4824c;  /* Terracotta */
--color-brand-hover: #c26d3a;
```

**Modern Professional:**
```css
--color-brand-base: #475569;  /* Slate gray */
--color-brand-hover: #334155;
```

**Beach Vibes:**
```css
--color-brand-base: #06b6d4;  /* Cyan */
--color-brand-hover: #0891b2;
```

### RGB Conversion

To convert hex to RGB:

1. Use online tool: https://www.rgbtohex.net/hextorgb/
2. Or in DevTools: Inspect element, click color swatch, copy RGB

**Example:**
- Hex: `#4c8f96`
- RGB: `76, 143, 150`

---

## Quick Reference

| What to Change | File | Line | Rebuild Needed |
|---------------|------|------|----------------|
| Brand colors | `neighborhoods/styles.css` | 10-18 | ✅ Yes |
| Dark mode colors | `neighborhoods/styles.css` | 35-45 | ✅ Yes |
| Neutral grays | `neighborhoods/styles.css` | 20-30 | ✅ Yes |
| Typography | `neighborhoods/styles.css` | 105 | ✅ Yes |
| Page title | `index.html` | 14 | ❌ No |
| Meta description | `index.html` | 15 | ❌ No |

**Rebuild command:** `npm run build:neighborhoods`

---

## Need Help?

- **Build issues:** See `TAILWIND_BUILD.md`
- **Styling rules:** See `STYLES.md`
- **Design tokens:** Check `assets/css/neighborhoods/styles.css` `@theme` block

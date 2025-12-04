# Tailwind CSS Build System

## Overview

This repository uses **Tailwind CSS 4** with **isolated build pipelines** for two separate projects:
1. **Sierra Main Site** - Primary real estate website
2. **Neighborhood Finder** - Interactive community map tool (subdomain)

**Important:** Each project has its own CSS source folder to prevent build conflicts.

---

## Folder Structure

```
assets/css/
├── neighborhoods/          # Neighborhood Finder source files
│   └── styles.css         # Tailwind 4 @theme + utilities (INPUT)
│
├── sierra/                # Sierra main site source files
│   ├── styles.css         # Tailwind 4 @theme + utilities (INPUT)
│   └── custom.css         # Custom site styles
│
├── tailwind.css           # Sierra site output (GENERATED - do not edit)
├── tailwind_neighborhoods.css  # Neighborhoods output (GENERATED - do not edit)
│
├── archive/               # Historical CSS files
├── styles.css             # DEPRECATED (kept for reference)
└── custom.css             # DEPRECATED (kept for reference)
```

---

## Build Commands

### Neighborhood Finder

```bash
# Production build (minified)
npm run build:neighborhoods

# Watch mode (auto-rebuild on save)
npm run watch:neighborhoods

# Input:  assets/css/neighborhoods/styles.css
# Output: assets/css/tailwind_neighborhoods.css
```

### Sierra Main Site

```bash
# Production build (minified)
npm run build:sierra

# Watch mode (auto-rebuild on save)
npm run watch:sierra

# Input:  assets/css/sierra/styles.css
# Output: assets/css/tailwind.css
```

### Build Everything

```bash
# Build both projects + generate critical CSS
npm run build
```

---

## Editing Styles

### For Neighborhood Finder:
1. Edit: `assets/css/neighborhoods/styles.css`
2. Run: `npm run build:neighborhoods`
3. Output: `assets/css/tailwind_neighborhoods.css`
4. Test: Open `index.html` in browser

### For Sierra Site:
1. Edit: `assets/css/sierra/styles.css`
2. Run: `npm run build:sierra`
3. Output: `assets/css/tailwind.css`
4. Deploy to main site

---

## Design System Changes

### Rebranding Neighborhood Finder (< 10 minutes):

See `docs/REBRAND_GUIDE.md` for step-by-step instructions.

**Quick version:**
1. Open `assets/css/neighborhoods/styles.css`
2. Find "AGENT REBRAND SECTION"
3. Update 4 brand color values
4. Run `npm run build:neighborhoods`
5. Done!

---

## Deployment Integration

### Neighborhood Finder Deployment Script:

The automated deployment script `RealEstateApps/scripts/spark_pathway/3_deploy_map.bat` includes:

```batch
echo Building Tailwind CSS...
call npm run build:neighborhoods

echo Generating SEO files...
python scripts/utility/generate_sitemap.py

echo Committing and pushing...
git add index.html assets/css/tailwind_neighborhoods.css sitemap.xml robots.txt
git commit -m "Update neighborhoods data from Spark API"
git push
```

---

## Troubleshooting

### Build fails with "Cannot find input file"
- Check that source files exist in correct folders:
  - `assets/css/neighborhoods/styles.css`
  - `assets/css/sierra/styles.css`

### Changes not appearing in browser
1. Confirm you ran the correct build command
2. Hard refresh browser (Ctrl+Shift+R)
3. Check that HTML links to correct output file

### "Unexpected token" error
- Tailwind 4 syntax differs from v3
- Ensure `@theme` block (not `@layer theme`)
- Check for syntax errors in CSS variables

---

## References

- Tailwind CSS 4 Docs: https://tailwindcss.com/docs/v4-beta
- Project Structure: See `STYLES.md` for design system rules

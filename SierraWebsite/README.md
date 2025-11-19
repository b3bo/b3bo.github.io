# Sierra Website

Modern, performance-optimized website built with Tailwind CSS.

## 🎨 Features

- Component-based HTML architecture
- Tailwind CSS for styling
- Critical CSS optimization for fast page loads
- Google Tag Manager integration
- Responsive design

## 📦 Installation

```bash
npm install
```

## 🚀 Development

### Watch mode (auto-rebuild on changes)
```bash
npm run watch
```

### Build for production
```bash
npm run build
```

This runs:
1. `build:tailwind` - Compiles and minifies Tailwind CSS
2. `build:critical` - Generates critical CSS for above-the-fold content

## 📁 Project Structure

```
SierraWebsite/
├── assets/
│   ├── css/          # Source and compiled styles
│   └── google_tags/  # GTM injection scripts
├── components/       # Reusable HTML components
│   ├── sierra/       # Sierra-specific components
│   └── ...           # Generic components (hero, cta, faq, etc.)
├── package.json      # Dependencies and build scripts
├── tailwind.config.js # Tailwind configuration
└── postcss.config.js  # PostCSS configuration
```

## 🔧 Configuration

### Tailwind Config
Edit `tailwind.config.js` to customize:
- Theme colors
- Fonts
- Breakpoints
- Plugins

### Build Pipeline
- `generate-critical.js` - Critical CSS extraction
- `postcss.config.js` - PostCSS plugins and optimization

## 📊 Performance Optimizations

1. **Critical CSS**: Above-the-fold styles inlined for faster initial render
2. **Minification**: All CSS is minified in production builds
3. **Component-based**: Easy to maintain and optimize individual sections

## 🛠️ Available Scripts

- `npm run build:tailwind` - Compile Tailwind CSS
- `npm run build:critical` - Generate critical CSS
- `npm run build` - Full production build
- `npm run watch` - Development mode with auto-rebuild
- `npm test` - Run tests (not implemented)

## 📝 Components

Reusable HTML components in the `components/` folder:
- `hero.html` - Hero section
- `cta.html` - Call-to-action blocks
- `faq.html` - FAQ accordion
- `contact.html` - Contact forms
- `breadcrumb.html` - Navigation breadcrumbs
- `tags.html`, `table.html`, `button-group.html` - UI elements
- `sierra/` - Sierra-specific custom components

## 🚀 Deployment

After building, deploy the compiled files to your web server or GitHub Pages.

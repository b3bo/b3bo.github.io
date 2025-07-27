module.exports = {
  content: [
    './components/breadcrumb/breadcrumb.html', // Specific path to breadcrumbs
    './*.html',                               // Other HTML files (e.g., content.html, hero.html)
    './components/*.html',                    // Other component files
    './js/*.js',                              // JS files with Tailwind classes (if any)
  ],
  theme: {
    extend: {
      colors: { indigo: { 500: '#6366f1', 600: '#4f46e5' } },
    },
  },
  plugins: [],
};
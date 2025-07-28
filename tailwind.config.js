module.exports = {
  content: [
    './*.html',          // Scans root HTML files (e.g., hero.html)
    './components/breadcrumb/breadcrumb.html', // Specific path to breadcrumb
    './components/*.html' // Scans other component files if added
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          500: '#6366f1',
          600: '#4f46e5'
        }
      }
    }
  },
  plugins: []
};
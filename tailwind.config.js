module.exports = {
  content: [
    './*.html',          // Scans root HTML files (e.g., hero.html)
    './components/breadcrumb/breadcrumb.html', 
    './components/sierra/.si-site-container.html',
    './components/sierra/*.html',
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
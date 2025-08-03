module.exports = {
  content: [
    './*.html', // Root HTML files
    './components/**/*.{html,js}', // Recursive scan for components
    './components/breadcrumb/breadcrumb.html',
    './components/sierra/*.html', // Specific Sierra components
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#32788c',
          light: '#5ea3b3',
          dark: '#1c4a58',
        },
        secondary: '#f4a261',
        accent: '#e76f51',
        neutral: {
          DEFAULT: '#333333',
          light: '#666666',
          dark: '#1a1a1a',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'], // Centralize Roboto
      },
      fontSize: {
        '3xl': '30px', // Explicitly set 3xl to 30px
      },
    },
  },
  plugins: [],
  safelist: [
    'text-primary', // Ensure h2 text color isn’t purged
    'content-visibility-auto', // Existing custom utility
    'leading-inherit', // New custom utility
    {
      pattern: /bg-(primary|secondary|accent)-(DEFAULT|light|dark)/,
      variants: ['hover', 'focus'],
    },
  ],
  darkMode: 'class', // Optional for future dark mode
  corePlugins: {
    preflight: true, // Keep base styles
  },
};
/** @type {import('tailwindcss').Config} */ 
module.exports = { 
  content: [ 
    "./*.html", 
    "./components/**/*.html" 
  ], 
  theme: { 
    extend: { 
      colors: { 
        primary: { 
          DEFAULT: '#58a7af', 
          light: '#5ea3b3', 
          dark: '#32788c', 
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
        sans: ['Roboto', 'system-ui', 'sans-serif'], 
      }, 
      fontSize: { 
        '3xl': '30px', 
      }, 
    }, 
  }, 
  plugins: [ 
    require('@tailwindcss/typography'), 
    require('@tailwindcss/forms'), 
  ], 
  safelist: [ 
    'content-visibility-auto', 
    'leading-inherit', 
    { 
      pattern: /min-w-\[.*\]/, 
      variants: ['hover', 'focus'], 
    }, 
  ], 
  darkMode: 'class', 
  corePlugins: { 
    preflight: true, 
  }, 
} 

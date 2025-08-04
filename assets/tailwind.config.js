/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html", // Includes si-site-container.html in the root
    "./components/**/*.html",
    "./assets/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          '50': '#f1fcfd',
          '100': '#e0f5f8',
          '200': '#c1edf2',
          '300': '#9ce0e7',
          '400': '#73cad3',
          '500': '#58a7af',
          '600': '#4c8f96',
          '700': '#3e7378',
          '800': '#335d61',
          '900': '#2e4d50',
          '950': '#1a3336',
        },
        'neutral': {
          '50': '#fafafa',
          '100': '#f5f5f5',
          '200': '#e5e5e5',
          '300': '#d4d4d4',
          '400': '#a1a1a1',
          '500': '#737373',
          '600': '#525252',
          '700': '#404040',
          '800': '#262626',
          '900': '#171717',
          '950': '#0a0a0a',
        },
      },
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        body: ["Roboto", "sans-serif"],
      },
      fontSize: {
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
      },
      lineHeight: {
        inherit: 'inherit',
        DEFAULT: '1.5', // Provides a fallback line-height
      },
      borderRadius: {
        DEFAULT: '0.375rem',
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
};
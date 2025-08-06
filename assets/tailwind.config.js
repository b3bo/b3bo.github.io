/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/*.html",
    "./components/**/*.html",
    "./assets/**/*.css"
  ],
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
/**
 * tailwind.config.js
 * 
 * Configuration file for Tailwind CSS.
 * Defines content paths for tree-shaking, active plugins (typography, forms),
 * and safelisted classes to ensure dynamic styles are preserved.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./assets/css/sierra/components/**/*.html",
    "./assets/**/*.css",
  ],
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
  darkMode: 'class',
};
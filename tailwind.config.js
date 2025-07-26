/** @type {import('tailwindcss').Config} */
// Purpose: Tailwind v3.4.10 config for purging/minification in your repo. Scans 'content.html' for Sierra classes.
// Content paths: Points to 'content.html' in repo root; add more if files are in subfolders (e.g., './css/*.html').
// Theme: Extends for custom real estate styles (e.g., colors from test div).
module.exports = {
  content: ['./content.html'], // Ensure this path is correct; no other JS/HTML for now.
  theme: {
    extend: {
      colors: {
        'real-estate-primary': '#1E3A8A', // Custom blue; must be here for purge to include .bg-real-estate-primary.
      },
    },
  },
  plugins: [],
};
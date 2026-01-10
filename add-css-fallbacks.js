/**
 * add-css-fallbacks.js
 *
 * Post-processes Tailwind CSS output to add fallback values for CSS variables.
 * This ensures browser compatibility when variables might not be defined.
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'assets/css/sierra/tailwind_sierra.css');

// Read the CSS file
let css = fs.readFileSync(inputFile, 'utf8');

// Add fallbacks for common variables
const fallbacks = {
  '--spacing': '.25rem',
  '--text-xs': '.75rem',
  '--text-xs--line-height': 'calc(1/.75)',
  '--text-sm': '.875rem',
  '--text-sm--line-height': 'calc(1.25/.875)',
  '--text-base': '1rem',
  '--text-base--line-height': 'calc(1.5/1)',
  '--text-lg': '1.125rem',
  '--text-lg--line-height': 'calc(1.75/1.125)',
  '--text-xl': '1.25rem',
  '--text-xl--line-height': 'calc(1.75/1.25)',
  '--text-2xl': '1.5rem',
  '--text-2xl--line-height': 'calc(2/1.5)',
  '--text-3xl': '1.875rem',
  '--text-3xl--line-height': 'calc(2.25/1.875)',
  '--text-4xl': '2.25rem',
  '--text-4xl--line-height': 'calc(2.5/2.25)',
  '--text-5xl': '3rem',
  '--text-5xl--line-height': '1',
  '--font-weight-normal': '400',
  '--font-weight-medium': '500',
  '--font-weight-semibold': '600',
  '--font-weight-bold': '700',
  '--font-weight-extrabold': '800',
  '--font-weight-black': '900',
  '--leading-tight': '1.25',
  '--leading-normal': '1.5',
  '--leading-relaxed': '1.625',
  '--radius-sm': '.25rem',
  '--radius-md': '.375rem',
  '--radius-lg': '.5rem',
  '--radius-xl': '.75rem',
  '--radius-2xl': '1rem',
  '--color-white': '#fff',
  '--color-black': '#000',
  '--default-transition-duration': '.15s',
  '--default-transition-timing-function': 'cubic-bezier(.4,0,.2,1)',
};

// Process each fallback - run multiple passes to handle nested vars
for (let pass = 0; pass < 3; pass++) {
  for (const [varName, fallbackValue] of Object.entries(fallbacks)) {
    // Match var(--varname) that doesn't already have a fallback
    // Look for var(--name) followed by ) or , or end of property
    const regex = new RegExp(`var\\(${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
    css = css.replace(regex, (match) => {
      // Check if this var already has a fallback by looking at context
      return `var(${varName},${fallbackValue})`;
    });
  }
}

// Write the processed CSS
fs.writeFileSync(inputFile, css);

console.log('CSS fallbacks added successfully!');
console.log('File size:', css.length, 'bytes');

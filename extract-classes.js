const fs = require('fs');

const stable = fs.readFileSync('assets/css/sierra/tailwind-stable.css', 'utf8');
const sierra = fs.readFileSync('assets/css/sierra/tailwind_sierra.css', 'utf8');

// Extract class selectors from CSS
function extractClasses(css) {
  const classes = new Set();
  const regex = /\.([a-zA-Z][a-zA-Z0-9_-]*(?:\\:[a-zA-Z0-9_-]+)*)/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    classes.add(match[1]);
  }
  return classes;
}

const stableClasses = extractClasses(stable);
const sierraClasses = extractClasses(sierra);

// Find classes in stable but not in sierra
const missing = [...stableClasses].filter(c => !sierraClasses.has(c));

console.log('Classes in stable but missing from sierra build:');
console.log('Total missing:', missing.length);
console.log('\nAll missing classes:');
missing.forEach(c => console.log(c));

// Read existing safelist and merge with missing classes
const safelistPath = 'assets/css/sierra/safelist.html';
let existingClasses = new Set();

if (fs.existsSync(safelistPath)) {
  const existing = fs.readFileSync(safelistPath, 'utf8');
  const classMatch = existing.match(/class="([^"]+)"/);
  if (classMatch) {
    classMatch[1].split(/\s+/).forEach(c => {
      if (c.trim()) existingClasses.add(c.trim());
    });
  }
}

// Merge missing classes (unescaped) with existing
const unescaped = missing.map(c => c.replace(/\\/g, ''));
unescaped.forEach(c => existingClasses.add(c));

// Filter out non-Tailwind classes (SI classes, custom classes)
const tailwindClasses = [...existingClasses].filter(c =>
  !c.startsWith('si-') &&
  !c.startsWith('js-') &&
  !c.startsWith('css-') &&
  !c.includes('__') &&
  !c.includes('--') &&
  !['disclaimer', 'faq-question', 'faq-answer', 'item', 'img', 'hero-image',
    'full-width-bg', 'table-custom', 'th-custom', 'head-custom', 'td-custom',
    'tr-custom', 'tbody-custom'].includes(c)
);

const html = `<!-- Tailwind Safelist - Auto-generated classes to ensure build includes all utilities -->
<div class="${tailwindClasses.join(' ')}"></div>
`;

fs.writeFileSync(safelistPath, html);
console.log('\nUpdated safelist.html with', tailwindClasses.length, 'Tailwind classes');

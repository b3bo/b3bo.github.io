const fs = require('fs');
const stable = fs.readFileSync('assets/css/sierra/tailwind-stable.css', 'utf8');
const sierra = fs.readFileSync('assets/css/sierra/tailwind_sierra.css', 'utf8');

function extractUtilities(css) {
  const matches = css.match(/\.[\w-]+(?=\s*\{|,)/g) || [];
  return new Set(matches);
}

const stableUtils = extractUtilities(stable);
const sierraUtils = extractUtilities(sierra);

const missing = [...stableUtils].filter(u => !sierraUtils.has(u));
const extra = [...sierraUtils].filter(u => !stableUtils.has(u));

console.log('Missing from new build:', missing.length);
missing.forEach(u => console.log('  ' + u));

console.log('\nExtra in new build (not in stable):', extra.length);
extra.slice(0, 30).forEach(u => console.log('  ' + u));
if (extra.length > 30) console.log('  ... and', extra.length - 30, 'more');

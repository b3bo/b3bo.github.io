const fs = require('fs');

const stable = fs.readFileSync('assets/css/sierra/tailwind-stable.css', 'utf8');
const sierra = fs.readFileSync('assets/css/sierra/tailwind_sierra.css', 'utf8');

// Extract only Tailwind utility class selectors (starting with .)
function extractUtilities(css) {
  const matches = css.match(/\.[\w-]+(?:\:[\w-]+)*(?:\[[^\]]+\])?(?=\s*\{|,)/g) || [];
  return new Set(matches.map(m => m.replace(/\/g, '')));
}

const stableUtils = extractUtilities(stable);
const sierraUtils = extractUtilities(sierra);

const missing = [...stableUtils].filter(u => !sierraUtils.has(u));
const extra = [...sierraUtils].filter(u => !stableUtils.has(u));

console.log('Utilities in STABLE but missing from new build:', missing.length);
missing.slice(0, 50).forEach(u => console.log('  ' + u));
if (missing.length > 50) console.log('  ... and', missing.length - 50, 'more');

console.log('\nUtilities in NEW build but not in stable:', extra.length);

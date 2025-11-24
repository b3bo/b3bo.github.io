# Tailwind Build Workflow

The live site currently serves the CSS bundle in `assets/css/tailwind.css` that was generated with Tailwind v4.1.11. If you regenerate the CSS with a newer CLI it will purge utilities differently and the layout at https://www.truesouthcoastalhomes.com/30a/watersound-origins/ breaks.

Follow this exact workflow whenever you need to rebuild the CSS:

1. **Install pinned dependencies**
   ```powershell
   npm install
   ```
   This pulls `@tailwindcss/cli` and `tailwindcss` v4.1.11 (pinned in `package.json`). Avoid running a global `npx tailwindcss` without installing, because it may resolve 4.1.17+ and produce a different bundle.

2. **Build the Sierra site CSS**
   ```powershell
   npm run build:sierra
   ```
   - Input: `assets/css/styles.css`
   - Output: `assets/css/tailwind.css`
   - The `@source` directives inside `styles.css` currently scan `./*.html` plus `./components/sierra/*.html`. If you add markup outside those globs, update the `@source` list before rebuilding so classes are not purged.

3. **(Optional) Build the Neighborhood map CSS**
   ```powershell
   npm run build:neighborhoods
   ```
   This produces `assets/css/tailwind_neighborhoods.css` for the separate map project. It uses the same input file, so only run it after confirming the new utilities belong in that project.

4. **Verify before deploying**
   - Run `git status -sb` to ensure only the expected CSS files changed.
   - Spot-check the key pages (especially Watersound Origins) locally or via staging. If the diff looks larger than expected, double-check that you are still on Tailwind v4.1.11 (`npx tailwindcss --version`).

By keeping the CLI pinned and using the npm scripts above, you can regenerate the CSS without drifting away from the stable build that is live today.
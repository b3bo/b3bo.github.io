# Font Host (GitHub Pages)

This folder is a ready-made GitHub Pages site that serves the Montserrat and Roboto font files without a custom domain. Deploying it as a separate repository removes the Cloudflare redirect that currently strips the CORS headers.

## Directory layout

```
font-host/
  index.html          # simple test page
  fonts.css           # optional @font-face stylesheet importing the hosted files
  assets/fonts/
    Montserrat/*.woff2
    Roboto/*.woff2
```

## Deploying as a new repository

1. Create a new public GitHub repository (for example `b3bo-font-host`). Do **not** add a custom domain or Pages configuration yet.
2. Copy the contents of `font-host/` from this workspace into the new repo (or push this folder as the repository root).
3. Commit and push the files.
4. In the repository settings, enable **GitHub Pages** → **Deploy from branch** → `main` / `/ (root)`.
5. After Pages finishes building, your fonts will be available at `https://b3bo.github.io/<repo-name>/assets/fonts/...` with `Access-Control-Allow-Origin: *`.

> Example URL: `https://b3bo.github.io/b3bo-font-host/assets/fonts/Montserrat/Montserrat-VF.woff2`

## Using the hosted fonts

Once the Pages site is live, update your main project to point to the new URLs:

```html
<link rel="preload" href="https://b3bo.github.io/b3bo-font-host/assets/fonts/Montserrat/Montserrat-VF.woff2" as="font" type="font/woff2" crossorigin="anonymous">
<link rel="preload" href="https://b3bo.github.io/b3bo-font-host/assets/fonts/Roboto/Roboto-Flex-VF.woff2" as="font" type="font/woff2" crossorigin="anonymous">
```

```css
@font-face {
  font-family: 'Montserrat';
  src: url('https://b3bo.github.io/b3bo-font-host/assets/fonts/Montserrat/Montserrat-VF.woff2') format('woff2-variations');
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

Replace `<repo-name>` in the URLs with whatever name you choose. The key requirement is that the repository **does not** define a custom domain so that GitHub Pages serves the files directly with its default CORS headers.

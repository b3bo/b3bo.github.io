# Community Finder Map

An interactive real estate map for Florida's Emerald Coast, featuring neighborhood discovery, amenity filtering, and accurate boundary overlays.

## Overview

This project provides a visual interface for exploring communities in the 30A and Emerald Coast regions. It uses Google Maps Platform with custom styling and data layers to highlight specific zip codes and neighborhoods.

## Key Features

- **Interactive Map:** Google Maps integration with custom styling.
- **Custom Boundaries:** Accurate 2020 Census ZCTA boundaries for key zip codes (32413, 32459, 32461, 32541, 32550).
- **Filtering:** Filter communities by price, property type (Homes/Condos), and amenities (Pool, Beach Access, etc.).
- **Responsive Design:** Mobile-friendly drawer interface for filters and results.

## Project Structure

- **`index.html`**: Main application entry point.
- **`assets/`**: Static assets including CSS, fonts, and data.
    - **`data/`**: GeoJSON files for zip code boundaries.
    - **`css/`**: Tailwind and custom stylesheets.
- **`components/`**: HTML fragments for various UI components.
- **`docs/`**: Project documentation.
- **`scripts/`**: Python utility scripts for data processing.

## Development

### Prerequisites

- Python 3.x (for data scripts)
- Node.js (for Tailwind CSS build process)

### Zip Code Data

The zip code boundaries are generated using custom Python scripts located in the separate `RealEstateApps` development environment.
The generated GeoJSON files are stored in `assets/data/`.

### Styling

The project uses Tailwind CSS. To rebuild styles:

```bash
npx tailwindcss -i ./assets/css/tailwind_neighborhoods.css -o ./assets/css/tailwind_neighborhoods.css --watch
```

See [docs/TAILWIND_BUILD.md](docs/TAILWIND_BUILD.md) for more styling information.

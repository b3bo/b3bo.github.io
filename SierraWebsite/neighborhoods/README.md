# Neighborhood Finder

Interactive map showing neighborhoods along Florida's Emerald Coast.

## 📁 Files

- **index.html** - Full page with sidebar filters
- **embed.html** - Iframe version (no filters, just map)
- **neighborhoods.json** - Data file (auto-updated nightly)

## 🔗 URLs

### Full Site
- Local: `file:///C:/Users/johnb/Documents/GitHub/b3bo.github.io/SierraWebsite/neighborhoods/index.html`
- Deployed: `https://floridasemeraldcoast.com/`
- Future: `https://neighborhoods.truesouthcoastalhomes.com/`

### Embed (for iframes)
- `https://floridasemeraldcoast.com/embed.html`

## 🎨 Features

### index.html (Full Page)
- Sidebar with price and amenity filters
- Responsive design (mobile-friendly)
- Results count
- Interactive map with custom markers

### embed.html (Iframe Version)
- No sidebar (map only)
- Cleaner for embedding
- Auto-opens first marker
- Links open in new tab

## 📊 Data Structure

`neighborhoods.json` contains array of neighborhoods:

```json
[
  {
    "name": "Neighborhood Name",
    "position": { "lat": 30.123, "lng": -86.123 },
    "stats": {
      "listingCount": 76,
      "avgPrice": 825000,
      "avgPriceDisplay": "$825,000",
      "avgSqft": 2450,
      "avgDom": 45,
      "priceRange": "$600k - $1.2M"
    },
    "amenities": ["Pool", "Beach Access", ...],
    "marketReportUrl": "https://..."
  }
]
```

## 🔄 Updates

This JSON file is automatically updated nightly by:
1. `RealEstateApps/scrape_market_report.py` (scrapes data)
2. `RealEstateApps/sheets_to_json.py` (converts to JSON)
3. GitHub Action (commits the file)

**Manual update:** Just edit `neighborhoods.json` and commit.

## 🎯 Embed Code

To embed on TrueSouth site:

```html
<iframe 
  src="https://floridasemeraldcoast.com/embed.html"
  width="100%" 
  height="600" 
  frameborder="0"
  style="border:0"
  allowfullscreen>
</iframe>
```

## 🎨 Customization

### Colors
Marker colors based on avg price:
- Green: Under $500k
- Amber: $500k-$750k
- Orange: $750k-$1M
- Red: $1M+

### Styling
All styles are inline CSS - easy to customize without external files.

## 📱 Mobile Responsive

- Desktop: Sidebar + Map side-by-side
- Mobile: Sidebar stacks on top, collapsible

## 🔐 API Key

Google Maps API key is in the HTML files. It's restricted to specific domains for security.

**Current key:** AIzaSyDjwVlnRslcTnR8d0Ocj3zYdj4CqFkIv9E

**Restrictions set in Google Cloud Console:**
- Allowed domains: floridasemeraldcoast.com, *.github.io, truesouthcoastalhomes.com
- API: Maps JavaScript API only

## 🚀 Deployment

1. Edit files locally
2. Test by opening index.html in browser
3. Commit and push to GitHub
4. GitHub Pages auto-deploys in 1-2 minutes
5. Visit https://floridasemeraldcoast.com/

## 📝 Adding New Neighborhoods

1. **Manual:** Edit `neighborhoods.json`, add new object
2. **Automatic:** Configure in `RealEstateApps/neighborhoods_config.json`, run scraper

## 🐛 Troubleshooting

**Map not loading?**
- Check browser console for API errors
- Verify API key is valid
- Check domain restrictions

**Markers not showing?**
- Verify coordinates in neighborhoods.json
- Check browser console for JS errors

**Filters not working?**
- Only on index.html (not embed.html)
- Check all data has required fields

## 📞 Support

See main project docs in `RealEstateApps/IMPLEMENTATION_ROADMAP.md`

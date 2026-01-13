/**
 * @file ui/navPage.js
 * @description Navigation page card rendering for area presets.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */

import { formatPrice, getAreaStats, getAreaNeighborhoods } from '../utils.js';

/**
 * Create HTML for a single area card.
 * @param {Object} preset - Area preset data from areaPresets.presets
 * @param {string} propertyType - 'homes' or 'condos'
 * @returns {string} HTML string for the card
 */
export function createAreaCard(preset, propertyType) {
    const stats = getAreaStats(preset, propertyType);
    const neighborhoods = getAreaNeighborhoods(preset, propertyType);

    // Skip if no listings for this type
    if (!stats.listingCount || stats.listingCount === 0) {
        return '';
    }

    const typeLabel = propertyType === 'homes' ? 'Homes' : 'Condos';
    const listingLabel = `${stats.listingCount} ${typeLabel}`;

    // Build neighborhoods list HTML as table rows
    const neighborhoodsHtml = neighborhoods
        .slice(0, 8)
        .map(n => `
            <tr class="community-row">
                <td class="community-name"><a href="#">${n.name}</a></td>
                <td class="community-count">${n.listingCount || 0}</td>
            </tr>
        `)
        .join('');

    return `
        <div class="area-card" data-area="${preset.slug}" data-type="${propertyType}">
            <div class="area-card-header">
                <h2>${preset.name} ${typeLabel}</h2>
                <span class="listing-count">${listingLabel}</span>
            </div>

            <div class="area-card-body">
                <div class="map-section">
                    <iframe
                        src="http://localhost:8003/?mode=single&area=${preset.slug}&propertyType=${propertyType}&controls=false"
                        loading="lazy"
                        style="width: 100%; height: 100%; border: none;"
                    ></iframe>
                </div>

                <div class="content-section">
                    <div class="stats-row">
                        <div class="stat-item">
                            <div class="stat-value">${formatPrice(stats.medianPrice || 0)}</div>
                            <div class="stat-label">Median</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">$${(stats.avgPricePerSqFt || 0).toLocaleString()}</div>
                            <div class="stat-label">$/SF</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.avgDom || 0}</div>
                            <div class="stat-label">Avg DOM</div>
                        </div>
                    </div>

                    <div class="communities-section">
                        <table class="communities-table">
                            <thead>
                                <tr>
                                    <th colspan="2">Top Neighborhoods</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${neighborhoodsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="area-card-footer">
                <a class="view-all-link" href="#">
                    View All ${preset.name} ${typeLabel} &rarr;
                </a>
            </div>
        </div>
    `;
}

/**
 * Render all area cards for given presets.
 * @param {Object} areaPresets - The areaPresets object with presets array
 * @param {HTMLElement} container - Container element to render cards into
 */
export function renderAreaCards(areaPresets, container) {
    if (!areaPresets?.presets || !container) {
        console.error('renderAreaCards: Missing areaPresets or container');
        return;
    }

    let html = '';

    for (const preset of areaPresets.presets) {
        // Generate Homes card
        html += createAreaCard(preset, 'homes');
        // Generate Condos card
        html += createAreaCard(preset, 'condos');
    }

    container.innerHTML = html;
}

// Expose on window for standalone pages
if (typeof window !== 'undefined') {
    window.createAreaCard = createAreaCard;
    window.renderAreaCards = renderAreaCards;
}

/**
 * @file data.js
 * @description Handles loading and parsing of neighborhood data.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import { CONFIG } from './config.js';

export async function loadNeighborhoods() {
    // Domain Lock: Prevent running on unauthorized domains
    // Currently in "Soft Mode" (Logging only) to troubleshoot local environments
    const allowedDomains = ['b3bo.github.io', 'localhost', '127.0.0.1'];
    const currentDomain = window.location.hostname;
    
    // Log for debugging
    // console.log(`[Security] Current Domain: "${currentDomain}"`);

    // If domain is not empty (not file://) and not in allowed list
    if (currentDomain && !allowedDomains.some(d => currentDomain.includes(d))) {
        // console.error(`[Security] Unauthorized domain detected: ${currentDomain}. Data loading would be blocked in Strict Mode.`);
        // In Strict Mode, we would: return [];
        // For now, we allow it to proceed but log the violation.
    }

    const files = CONFIG.data.neighborhoodFiles;
    
    let allNeighborhoods = [];

    try {
        const promises = files.map(async (file) => {
            try {
                const response = await fetch(file);
                if (!response.ok) throw new Error(`Failed to load ${file}`);
                const text = await response.text();
                // Decode Base64 (handle UTF-8 chars correctly)
                const jsonStr = new TextDecoder().decode(Uint8Array.from(atob(text), c => c.charCodeAt(0)));
                // Parse JSON
                const data = JSON.parse(jsonStr);
                return data.neighborhoods || [];
            } catch (e) {
                console.error(`Error loading ${file}:`, e);
                return [];
            }
        });

        const results = await Promise.all(promises);
        allNeighborhoods = results.flat();
        
        // Sort alphabetically by name
        allNeighborhoods.sort((a, b) => a.name.localeCompare(b.name));
        
        // console.log(`Loaded ${allNeighborhoods.length} neighborhoods.`);
        
        return allNeighborhoods;

    } catch (error) {
        console.error('Error loading neighborhoods:', error);
        return [];
    }
}

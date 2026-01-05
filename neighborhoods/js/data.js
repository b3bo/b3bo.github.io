/**
 * @file data.js
 * @description Handles loading and parsing of neighborhood data.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import{CONFIG as o}from"./config.js";export async function loadNeighborhoods(){const r=window.location.hostname;r&&["b3bo.github.io","localhost","127.0.0.1"].some(o=>r.includes(o));const t=o.data.neighborhoodFiles;let e=[];try{const o=t.map(async o=>{try{const r=await fetch(o);if(!r.ok)throw new Error(`Failed to load ${o}`);const t=await r.text(),e=(new TextDecoder).decode(Uint8Array.from(atob(t),o=>o.charCodeAt(0)));return JSON.parse(e).neighborhoods||[]}catch(r){return console.error(`Error loading ${o}:`,r),[]}});return e=(await Promise.all(o)).flat(),e.sort((o,r)=>o.name.localeCompare(r.name)),e}catch(o){return console.error("Error loading neighborhoods:",o),[]}}
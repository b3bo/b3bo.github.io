/**
 * @file data.js
 * @description Handles loading and parsing of neighborhood data.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
import{CONFIG as o}from"./config.js";export async function loadNeighborhoods(){const r=o.data.neighborhoodFiles;let e=[];try{const o=r.map(async o=>{try{const r=await fetch(o);if(!r.ok)throw new Error(`Failed to load ${o}`);const e=await r.text(),t=(new TextDecoder).decode(Uint8Array.from(atob(e),o=>o.charCodeAt(0)));return JSON.parse(t).neighborhoods||[]}catch(r){return console.error(`Error loading ${o}:`,r),[]}});return e=(await Promise.all(o)).flat(),e.sort((o,r)=>o.name.localeCompare(r.name)),e}catch(o){return console.error("Error loading neighborhoods:",o),[]}}
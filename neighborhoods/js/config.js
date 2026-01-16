/**
 * @file config.js
 * @description Configuration settings for the Community Finder Map.
 *
 * This file contains all configurable settings for the application including:
 * - Map initialization and behavior
 * - Data loading and pagination
 * - UI options (filters, sorting, amenities)
 * - Animation speeds and transitions
 * - Color palette references
 *
 * To customize the application, modify values in this file rather than
 * hard-coding them throughout the codebase.
 *
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 * @author John Bauman
 */
export const CONFIG={version:"1.2.4",map:{defaultCenter:{lat:30.305,lng:-86.15},defaultZoom:11,singleNeighborhoodZoom:12,flyToDuration:2e3,autoOpenOnFly:!0,flightZoomArc:{micro:{maxDistance:2e3,minZoom:13.5},short:{maxDistance:5e3,minZoom:13},medium:{maxDistance:2e4,minZoom:12},long:{minZoom:10}},flightDuration:{micro:800,short:1200,medium:2e3},mapId:"92b2f4ea8b2fce54a50ed2e9"},data:{batchSize:20,customZipCodes:["32461","32541","32459","32550","32413"],neighborhoodFiles:["./assets/mls/ecar/neighborhoods/7ea1bf14d884d192.json.b64","./assets/mls/ecar/neighborhoods/b762bb338ba328e5.json.b64","./assets/mls/ecar/neighborhoods/d2ea7fdfc87ff3e7.json.b64","./assets/mls/ecar/neighborhoods/d897c3d107c48ccc.json.b64","./assets/mls/ecar/neighborhoods/dcb3d8a92cc6eb54.json.b64","./assets/mls/ecar/neighborhoods/e0e3b36d8e692892.json.b64","./assets/mls/ecar/neighborhoods/f7e6349b564cdbb2.json.b64"],areaPresetsFile:"./assets/mls/ecar/presets/areas.json.b64",manifestFile:"./assets/mls/ecar/manifest.json",geojsonPath:"./assets/mls/ecar/boundaries/"},ui:{amenities:["Beach Access","Clubhouse","Community Pool","Dock","Elevator","Fitness","Gated","Golf","No Short-Term","Pet-Friendly","Pickleball","Playgrounds","Short-Term","Tennis","Waterfront","Waterview"],priceSteps:[25e4,3e5,35e4,4e5,45e4,5e5,55e4,6e5,65e4,7e5,75e4,8e5,85e4,9e5,95e4,1e6,125e4,15e5,175e4,2e6,225e4,25e5,275e4,3e6,325e4,35e5,375e4,4e6,425e4,45e5,475e4,5e6,6e6,7e6,8e6,9e6,1e7,15e6,2e7,25e6,3e7,35e6],sortOptions:[{id:"name-asc",label:"Name (A-Z)",field:"name",order:"asc"},{id:"name-desc",label:"Name (Z-A)",field:"name",order:"desc"},{id:"price-asc",label:"Price: Low to High",field:"price",order:"asc"},{id:"price-desc",label:"Price: High to Low",field:"price",order:"desc"},{id:"listings-desc",label:"Most Listings",field:"listingCount",order:"desc"},{id:"dom-asc",label:"DOM: Low to High",field:"avgDom",order:"asc"}],sortMenuOffset:{x:{desktop:0,tablet:0,mobile:0},y:{desktop:8,tablet:8,mobile:6}}},theme:{singleModeTheme:"light"},animations:{panelSlideDuration:500,panelSlideEasing:"ease-out"},colors:{text:{primary:"text-neutral-700",secondary:"text-neutral-500",tertiary:"text-neutral-400",error:"text-red-600"},background:{sidebar:"rgb(255, 255, 255)",disclaimer:"#8FC7CC"}}};if("undefined"!=typeof window)try{window.CONFIG=window.CONFIG||CONFIG}catch(e){}
/**
 * @file animations/index.js
 * @description Animation utilities with proper RAF cleanup.
 * @copyright 2025 Kimberly Bauman, P.A. All rights reserved.
 */
import{createAnimation as n,Easing as t}from"../utils.js";import{eventBus as e,Events as l}from"../core/eventBus.js";let o=null,u=null,i=null;export function animateCount(e,l,u=700){o&&(o.cancel(),o=null);const a=e.querySelector(".count-number"),c=a?parseInt(a.textContent,10):null,r=null===c||isNaN(c)?null!==i?i:l:c,s=l-r;if(0===s||null===i)return i=l,void(a&&(a.textContent=l));const m=performance.now();o=n(n=>{const e=n-m,c=Math.min(e/u,1),p=t.easeOutCubic(c),f=Math.round(r+s*p);return a&&(a.textContent=f),!(c>=1&&(o=null,i=l,1))})}export function cancelAllAnimations(){o&&(o.cancel(),o=null),u&&(u.cancel(),u=null)}export function getLastDisplayedCount(){return i}export function resetLastDisplayedCount(){i=null}"undefined"!=typeof window&&(window.animateCount=animateCount,window.cancelAllAnimations=cancelAllAnimations);
#!/usr/bin/env node
// Regenerates the two WordPress paste-in fragments from roi-calculator.html:
//
//   node make-fragments.mjs
//
//   wordpress-embed.html        inline fragment (calculator renders in-page)
//   wordpress-embed-popup.html  launch button + full-screen overlay variant
//
// roi-calculator.html is the single source of truth — edit it, run this,
// re-paste the fragments. No dependencies, no npm install: plain node.
//
// What gets copied out of roi-calculator.html:
//   • the vendor <script> block between the vendor-scripts:start/end
//     markers (React, ReactDOM, Babel standalone, the jsPDF pre-loader)
//   • the entire <script type="text/babel"> application block
// The fragment chrome around them (scoped styles, #galen-roi-root mount,
// popup overlay + wiring) lives in the templates below.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = readFileSync(path.join(here, 'roi-calculator.html'), 'utf8');

function between(s, a, b, label) {
  const i = s.indexOf(a);
  if (i < 0) throw new Error(`marker not found: ${label} (${a})`);
  const j = s.indexOf(b, i + a.length);
  if (j < 0) throw new Error(`end marker not found: ${label} (${b})`);
  return s.slice(i + a.length, j);
}

const vendorScripts = between(html, '<!-- vendor-scripts:start (make-fragments.mjs copies this block into the WordPress fragments) -->', '<!-- vendor-scripts:end -->', 'vendor scripts').trim();

const appOpen = '<script type="text/babel">';
const appStart = html.indexOf(appOpen);
if (appStart < 0) throw new Error('app script block not found');
const appEnd = html.indexOf('</script>', appStart);
const appSrc = html.slice(appStart + appOpen.length, appEnd);
if (appSrc.includes('</script')) throw new Error("app code contains '</script' — fragments would break; escape it first");

// Scoped to the calculator mount so nothing leaks into the host page.
// (input/select rules are the calculator's own controls only.)
const styles = `
  #galen-roi-root, #galen-roi-root *, #galen-roi-root *::before, #galen-roi-root *::after { box-sizing: border-box; }
  #galen-roi-root { width: 100%; min-height: 100vh; background: #EEF7F2; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  #galen-roi-root input[type=range] { -webkit-appearance: none; height: 12px; border-radius: 6px; background: #D4E0DD; }
  #galen-roi-root input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 30px; border-radius: 50%; background: #0F4146; cursor: pointer; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(15,65,70,0.35); }
  #galen-roi-root input[type=range]::-moz-range-thumb { width: 30px; height: 30px; border-radius: 50%; background: #0F4146; cursor: pointer; border: 3px solid #fff; }
  #galen-roi-root select { background: #fff; color: #0F4146; border-color: #D4E0DD; }
  #galen-roi-root input[type=number] { background: #fff; color: #0F4146; border-color: #D4E0DD; }
`;

const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap" rel="stylesheet" />`;

const mount = `<div id="galen-roi-root">
  <div style="color:#3D5A5E;text-align:center;padding:120px 32px;font-family:'DM Sans',sans-serif;font-size:16px;">
    <div style="font-size:24px;font-weight:700;color:#0F4146;margin-bottom:16px;">Loading calculator...</div>
    <div>This calculator needs JavaScript. If this message persists, please contact your RLDatix representative.</div>
  </div>
</div>`;

const appBlock = `<script type="text/babel">${appSrc}</script>`;

const fragment = `<!-- ═══════════════════════════════════════════════════════════════════
     RLDatix Galen Clinical Archive — UK & Ireland SHORT ROI Calculator
     WordPress inline-embed fragment

     HOW TO USE
       In the WordPress page editor, add a "Custom HTML" block (Classic
       editor: the Text/HTML tab) and paste this ENTIRE file into it.
       The calculation engine, all styles and images are inline; the page
       loads React 18.3.1, ReactDOM, Babel standalone and jsPDF from
       public CDNs (see CDN SCRIPTS below) — no build step, no iframe,
       no separate hosting.

     CDN SCRIPTS REQUIRED
       cdnjs.cloudflare.com (React 18.3.1, ReactDOM, Babel standalone),
       cdn.jsdelivr.net / unpkg.com / cdnjs (jsPDF 4.2.1 fallback chain),
       fonts.googleapis.com (DM Sans — remove the <link> to use the site
       font instead). If the host page sets a Content-Security-Policy,
       allow script-src for those hosts.

     INTEGRATIONS (already configured inside)
       • HubSpot lead form → portal 27174408, EU1 data centre
       • Branded PDF download (jsPDF)
       • Admin view: add #admin-leads to the page URL

     UPDATING
       This file is GENERATED from roi-calculator.html — the single file
       that IS the calculator. To update:
         1. edit roi-calculator.html
         2. node make-fragments.mjs
         3. re-paste this file over the old block
     ═══════════════════════════════════════════════════════════════════ -->
${fonts}
<style>${styles}</style>
${mount}
${vendorScripts}
${appBlock}
`;

writeFileSync(path.join(here, 'wordpress-embed.html'), fragment);
console.log(`wordpress-embed.html: ${(fragment.length / 1024).toFixed(0)} KB`);

// ── Popup variant: a CTA button that opens the calculator in a full-screen
// overlay. Sidesteps any theme content-wrapper height/overflow constraints —
// the calculator is always fully visible regardless of page layout. ──
const popup = `<!-- ═══════════════════════════════════════════════════════════════════
     RLDatix Galen Clinical Archive — UK & Ireland SHORT ROI Calculator
     WordPress POPUP fragment

     A styled launch button; the calculator opens in a full-screen overlay
     above the page. Paste this ENTIRE file into a "Custom HTML" block.
     Same contents as wordpress-embed.html — only the launch wiring
     differs. Esc, the ✕ button, or clicking the dark backdrop closes it;
     page scroll is locked while open.

     CDN SCRIPTS REQUIRED — same as wordpress-embed.html: cdnjs (React,
     ReactDOM, Babel), jsdelivr/unpkg/cdnjs (jsPDF), Google Fonts.

     NOTE: the overlay uses position:fixed. If a theme wrapper sets a CSS
     transform/filter on an ancestor of the block, fixed positioning scopes
     to that wrapper — in that (rare) case paste the block nearer the top
     level of the page content.

     UPDATING: generated file — edit roi-calculator.html, then
       node make-fragments.mjs
     ═══════════════════════════════════════════════════════════════════ -->
${fonts}
<style>${styles}
  #galen-roi-launch-wrap { display: flex; justify-content: center; margin: 56px 0; }
  #galen-roi-launch { display: inline-block; padding: 16px 44px; border-radius: 999px; border: none; background: #0F4146; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 17px; font-weight: 800; letter-spacing: .5px; cursor: pointer; box-shadow: 0 6px 28px rgba(15,65,70,0.25); }
  #galen-roi-launch:hover { background: #1A8A7A; }
  #galen-roi-overlay { display: none; position: fixed; inset: 0; z-index: 999999; background: rgba(15,65,70,0.55); }
  #galen-roi-overlay.galen-open { display: block; }
  #galen-roi-modal { position: absolute; inset: 0; background: #EEF7F2; overflow-y: auto; -webkit-overflow-scrolling: touch; }
  @media (min-width: 900px) { #galen-roi-modal { inset: 24px; border-radius: 18px; box-shadow: 0 24px 80px rgba(0,0,0,0.35); } }
  #galen-roi-close { position: fixed; top: 10px; right: 14px; z-index: 1000000; width: 44px; height: 44px; border-radius: 50%; border: none; background: #0F4146; color: #fff; font-size: 20px; font-weight: 700; cursor: pointer; display: none; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
  #galen-roi-overlay.galen-open ~ #galen-roi-close, #galen-roi-overlay.galen-open #galen-roi-close { display: block; }
  @media (min-width: 900px) { #galen-roi-close { top: 34px; right: 38px; } }
  #galen-roi-modal #galen-roi-root { min-height: 100%; }
</style>
<div id="galen-roi-launch-wrap"><button type="button" id="galen-roi-launch">Calculate your ROI →</button></div>
<div id="galen-roi-overlay" role="dialog" aria-modal="true" aria-label="ROI calculator">
  <div id="galen-roi-modal">
    ${mount}
    <button type="button" id="galen-roi-close" aria-label="Close calculator">✕</button>
  </div>
</div>
${vendorScripts}
${appBlock}
<script>
  (function () {
    var overlay = document.getElementById('galen-roi-overlay');
    var launch = document.getElementById('galen-roi-launch');
    var close = document.getElementById('galen-roi-close');
    var prevOverflow = '';
    function open() {
      overlay.classList.add('galen-open');
      prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    }
    function shut() {
      overlay.classList.remove('galen-open');
      document.documentElement.style.overflow = prevOverflow;
    }
    launch.addEventListener('click', open);
    close.addEventListener('click', shut);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) shut(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('galen-open')) shut(); });
  })();
</script>
`;
writeFileSync(path.join(here, 'wordpress-embed-popup.html'), popup);
console.log(`wordpress-embed-popup.html: ${(popup.length / 1024).toFixed(0)} KB`);

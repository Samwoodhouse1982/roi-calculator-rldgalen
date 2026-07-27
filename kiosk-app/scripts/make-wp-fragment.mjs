// Assembles a single self-contained WordPress paste-in fragment from a
// WP_INLINE=1 embed build (single JS bundle, all assets base64-inlined).
//
//   WP_INLINE=1 vite build --mode embed-uki && node scripts/make-wp-fragment.mjs uki
//
// Output: ../kiosk-embed-<market>/wordpress-embed.html
// The fragment contains: instruction header, a scoped <style> block, the
// DM Sans font link, the mount div (#galen-roi-root — unique id so it can't
// collide with host-page themes), and the entire app bundle inline.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const market = process.argv[2] || 'uki';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const assets = readdirSync(path.join(dist, 'assets')).filter(f => f.endsWith('.js'));
if (assets.length !== 1) {
  console.error(`Expected exactly 1 JS bundle in dist/assets (WP_INLINE build), found ${assets.length}: ${assets.join(', ')}\nDid you build with WP_INLINE=1?`);
  process.exit(1);
}
let js = readFileSync(path.join(dist, 'assets', assets[0]), 'utf8');

// Retarget the mount to the fragment's unique id. The entry references both
// ids ('galen-roi-root' first, '#root' fallback), so no rewrite is needed —
// just verify the string survived minification.
if (!js.includes('galen-roi-root')) {
  console.error("Bundle does not reference 'galen-roi-root' — main.jsx mount changed?");
  process.exit(1);
}
// Guard the classic inline-script terminator. Valid JS only contains
// '</script' inside string literals; escaping the slash is a no-op there.
js = js.replaceAll('</script', '<\\/script');

const styles = `
  /* Scoped to the calculator mount so nothing leaks into the host page.
     (input/select rules are the calculator's own controls only.) */
  #galen-roi-root, #galen-roi-root *, #galen-roi-root *::before, #galen-roi-root *::after { box-sizing: border-box; }
  #galen-roi-root { width: 100%; min-height: 100vh; background: #EEF7F2; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  #galen-roi-root input[type=range] { -webkit-appearance: none; height: 12px; border-radius: 6px; background: #D4E0DD; }
  #galen-roi-root input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 30px; border-radius: 50%; background: #0F4146; cursor: pointer; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(15,65,70,0.35); }
  #galen-roi-root input[type=range]::-moz-range-thumb { width: 30px; height: 30px; border-radius: 50%; background: #0F4146; cursor: pointer; border: 3px solid #fff; }
  #galen-roi-root select { background: #fff; color: #0F4146; border-color: #D4E0DD; }
  #galen-roi-root input[type=number] { background: #fff; color: #0F4146; border-color: #D4E0DD; }
`;

const MARKET_TITLES = { uki: 'UK & Ireland', au: 'Australia', us: 'US' };
const fragment = `<!-- ═══════════════════════════════════════════════════════════════════
     RLDatix Galen Clinical Archive — ${MARKET_TITLES[market] || market} SHORT ROI Calculator
     WordPress inline-embed fragment (fully self-contained)

     HOW TO USE
       In the WordPress page editor, add a "Custom HTML" block (Classic
       editor: the Text/HTML tab) and paste this ENTIRE file into it.
       Nothing else is needed: React, the calculation engine, all images
       and the PDF generator are bundled inline — no CDNs, no external
       hosting, no iframe. The only external request is the DM Sans font
       from Google Fonts (remove that <link> to use the site font instead).

     INTEGRATIONS (already configured inside)
       • HubSpot lead form → portal 27174408, EU1 data centre
       • Branded PDF download (jsPDF bundled)
       • Admin view: add #admin-leads to the page URL

     UPDATING
       This file is GENERATED. To rebuild after a calculator change:
         cd kiosk-app
         WP_INLINE=1 npm run build:embed:${market} && node scripts/make-wp-fragment.mjs ${market}
       then re-paste the new file over the old block.
     ═══════════════════════════════════════════════════════════════════ -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap" rel="stylesheet" />
<style>${styles}</style>
<div id="galen-roi-root">
  <div style="color:#3D5A5E;text-align:center;padding:120px 32px;font-family:'DM Sans',sans-serif;font-size:16px;">
    <div style="font-size:24px;font-weight:700;color:#0F4146;margin-bottom:16px;">Loading calculator...</div>
    <div>This calculator needs JavaScript. If this message persists, please contact your RLDatix representative.</div>
  </div>
</div>
<script type="module">
${js}
</script>
`;

const out = path.join(root, '..', `kiosk-embed-${market}`, 'wordpress-embed.html');
writeFileSync(out, fragment);
console.log(`${out}: ${(fragment.length / 1024).toFixed(0)} KB (${assets[0]})`);

// ── Popup variant: a CTA button that opens the calculator in a full-screen
// overlay. Sidesteps any theme content-wrapper height/overflow constraints —
// the calculator is always fully visible regardless of page layout. ──
const CTA_LABEL = { uki: 'Calculate your ROI', au: 'Calculate your ROI', us: 'Calculate your ROI' }[market] || 'Calculate your ROI';
const popup = `<!-- ═══════════════════════════════════════════════════════════════════
     RLDatix Galen Clinical Archive — ${MARKET_TITLES[market] || market} SHORT ROI Calculator
     WordPress POPUP fragment (fully self-contained)

     A styled launch button; the calculator opens in a full-screen overlay
     above the page. Paste this ENTIRE file into a "Custom HTML" block.
     Same zero-dependency bundle as wordpress-embed.html — only the launch
     wiring differs. Esc, the ✕ button, or clicking the dark backdrop
     closes it; page scroll is locked while open.

     NOTE: the overlay uses position:fixed. If a theme wrapper sets a CSS
     transform/filter on an ancestor of the block, fixed positioning scopes
     to that wrapper — in that (rare) case paste the block nearer the top
     level of the page content.

     UPDATING: generated file — rebuild with
       cd kiosk-app && WP_INLINE=1 npm run build:embed:${market} && node scripts/make-wp-fragment.mjs ${market}
     ═══════════════════════════════════════════════════════════════════ -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800&display=swap" rel="stylesheet" />
<style>${styles}
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
<button type="button" id="galen-roi-launch">${CTA_LABEL} →</button>
<div id="galen-roi-overlay" role="dialog" aria-modal="true" aria-label="ROI calculator">
  <div id="galen-roi-modal">
    <div id="galen-roi-root">
      <div style="color:#3D5A5E;text-align:center;padding:120px 32px;font-family:'DM Sans',sans-serif;font-size:16px;">
        <div style="font-size:24px;font-weight:700;color:#0F4146;margin-bottom:16px;">Loading calculator...</div>
        <div>This calculator needs JavaScript. If this message persists, please contact your RLDatix representative.</div>
      </div>
    </div>
    <button type="button" id="galen-roi-close" aria-label="Close calculator">✕</button>
  </div>
</div>
<script type="module">
${js}
</script>
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
const outPopup = path.join(root, '..', `kiosk-embed-${market}`, 'wordpress-embed-popup.html');
writeFileSync(outPopup, popup);
console.log(`${outPopup}: ${(popup.length / 1024).toFixed(0)} KB`);

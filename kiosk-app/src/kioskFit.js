// UKI touchscreen: scale the fixed 1080x1920 design to whatever screen the
// browser is on. The UPERFECT 24.5" 2K panel in portrait is 1440x2560
// physical pixels (exactly 9:16), but Windows display scaling changes the
// browser's CSS viewport (1440x2560 at 100%, 1152x2048 at 125%, ...), so a
// fixed 1080px layout would sit left-aligned with an empty band beside it.
//
// The whole page is zoomed by min(width/1080, height/1920) so it always fills
// the screen in portrait and is never cropped; on a non-9:16 screen (e.g.
// landscape) it is centred with dark bars either side.
const DESIGN_W = 1080;
const DESIGN_H = 1920;

export function getKioskZoom() {
  if (typeof document === 'undefined') return 1;
  return parseFloat(document.documentElement.style.zoom) || 1;
}

export function applyKioskFit() {
  const root = document.documentElement;
  const fit = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!vw || !vh) return;
    const zoom = Math.min(vw / DESIGN_W, vh / DESIGN_H);
    root.style.zoom = String(zoom);
    // Centre the 1080-wide column when the screen is wider than 9:16.
    const spare = vw / zoom - DESIGN_W;
    root.style.marginLeft = spare > 1 ? `${Math.floor(spare / 2)}px` : '0px';
  };
  fit();
  window.addEventListener('resize', fit);
}

// UKI touchscreen on Windows: stop touch gestures meant for documents from
// getting in the way. A long press would open the browser's context menu or
// start a text selection, a double tap could zoom, and over-scrolling would
// bounce or swipe back a page. Pinch-zoom and edge swipes are switched off by
// the browser launch flags in the deploy folder's windows/start-kiosk.cmd.
export function applyKioskTouch() {
  const style = document.createElement('style');
  style.textContent = `
    html, body { overscroll-behavior: none; touch-action: manipulation; }
    body { -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
  `;
  document.head.appendChild(style);
  window.addEventListener('contextmenu', e => e.preventDefault());
}

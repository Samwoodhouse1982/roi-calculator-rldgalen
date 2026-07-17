# US Embed / Responsive build

The embed build mode (`npm run build:embed`) produces a **responsive,
iframe-friendly variant** of the US touchscreen kiosk calculator. It uses
the **same calculation engine, same input flow, same results layout, same
components** — only the visual sizing is fluid instead of locked at the
kiosk's 1080×1920 portrait.

Historically this was a separate branch (`us-embed`); it is now a build
mode of the same app, selected by `--mode embed` / `VITE_EMBED=1`.

## What changes vs the touchscreen build

- **theme.js**: font sizes (`F.hero`, `F.h1` etc) are CSS `clamp()` values
  that scale fluidly with viewport width. The kiosk values become the
  desktop max. Smallest mobile target ~320px; max viewport ~1080px (after
  which the layout is capped and centered).
- **App.jsx**: outer container is `width: 100%, maxWidth: 1080px,
  margin: 0 auto, minHeight: 100vh` instead of `width: 1080, minHeight: 1920`.
  A new `<EmbedStyles>` component injects responsive `@media` rules at three
  breakpoints (1200 / 900 / 640 px) that tighten padding and collapse the
  2-column KPI grid on phones.
- **SplashScreen.embed.jsx**: container is 100% width / 100vh. The particle
  canvas reads its actual rendered size each resize and uses
  `devicePixelRatio` so it stays crisp on hi-DPI. The radial-wipe transition
  expands using `vmax` units so it works at any viewport size.

## What did NOT change

- `src/calc/engine.js` — all maths is identical.
- `src/calc/presets.js`, `src/calc/vendors.js` — identical.
- `src/steps/` — same input steps.
- `src/results/ResultsPage.jsx` — same report layout. Inherits the
  multi-instance flagships, timescale toggle, count-up animations, and
  network-consolidation rewrites from `us-touchscreen`.

## Deploy notes

- Same Vite stack. `npm run build:embed` outputs to `dist/` (emitted as
  `index.html`, same as the touchscreen build).
- The shared `vercel.json` and `netlify.toml` continue to work — just point
  the embed deploy's build command at `npm run build:embed`.
- For iframe embedding: set the iframe's `width` and `height`; the app
  fills 100% of both. `body { overflow: hidden }` is set so scrolling
  happens inside the app's own scroll area, not on the host page.

# US Responsive / Embed Kiosk — `us-embed`

The **responsive, iframe-friendly** variant of the US kiosk calculator. Same
engine, flow, and results as `us-touchscreen`, but the layout is fluid
(clamp-based fonts, breakpoints, flex splash) so it works on normal screens,
mobile devices, and inside an iframe -- not just the fixed 1080x1920 kiosk.

> This repository uses **one branch per market/surface**. See the table below.

## What's the calculator?

Everything lives in **`kiosk-app/`** -- a Vite + React application. This branch
has **no root calculator file**; leftover web-calc files have been removed.

```bash
cd kiosk-app
npm install
npm run dev      # local dev server
npm run build    # production build -> kiosk-app/dist/
```

## How this differs from `us-touchscreen`

Same `kiosk-app/` structure and the same calc engine. The differences are
layout-only and documented in **`kiosk-app/README-EMBED.md`**:
- `theme.js` font sizes are `clamp()` values (fluid, capped at the kiosk sizes)
- `App.jsx` outer container is `width:100%` up to `maxWidth:1080`, with an
  `EmbedStyles` block adding responsive breakpoints (1200 / 900 / 640px)
- `SplashScreen.jsx` is fluid (100vh, canvas reads actual size, `vmax` wipe)
- `index.html` uses `width=device-width` (not the kiosk's fixed viewport)

## How it deploys

From `kiosk-app/` via Vite (`kiosk-app/vercel.json`, `kiosk-app/netlify.toml`,
build `npm run build`, publish `dist/`). For iframe embedding, set the iframe's
width/height; the app fills 100% of both and scrolls internally.

## The other branches

| Branch | Market / surface | Deploys |
|--------|------------------|---------|
| `uki` | UK / Ireland web | `roi-calculator.html` |
| `us` | US web | `roi-calculator.html` |
| `au` | Australia web | `roi-calculator.html` |
| `us-touchscreen` | US kiosk, fixed 1080x1920 | `kiosk-app/` |
| **`us-embed`** | US kiosk, responsive / iframe (this branch) | `kiosk-app/` |

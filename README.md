# US Touchscreen Kiosk — `us-touchscreen`

The **US conference-kiosk** version of the RLDatix Galen Clinical Archive ROI
calculator: a Vite/React app designed for a **fixed 1080x1920 portrait
touchscreen** at events, with sales-rep guidance.

> This repository uses **one branch per market/surface**. See the table below.

## What's the calculator?

Everything lives in **`kiosk-app/`** -- a Vite + React application (unlike the
web branches, which are a single self-contained `roi-calculator.html`). This
branch has **no root calculator file**; the root previously carried leftover
web-calc files which have been removed.

```bash
cd kiosk-app
npm install
npm run dev      # local dev server
npm run build    # production build -> kiosk-app/dist/
```

## Structure (`kiosk-app/src/`)

| Path | Purpose |
|------|---------|
| `calc/engine.js` | Calculation engine (pure). |
| `calc/presets.js`, `calc/vendors.js` | Presets and vendor/system lists. |
| `theme.js` | Design tokens (colours, fonts, sizing). |
| `App.jsx` | Root component, step flow, timescale bar. |
| `steps/index.jsx` | Input steps (Scope, Journey, Facilities, Systems, Fine-tune). |
| `results/ResultsPage.jsx` | Results report. |
| `components/` | Splash screen, particles, icons, shared UI. |

## How it deploys

From `kiosk-app/` via Vite. `kiosk-app/vercel.json` and `kiosk-app/netlify.toml`
both build with `npm run build` and publish `dist/`. Fixed 1080x1920 portrait;
fully offline-capable.

## The other branches

| Branch | Market / surface | Deploys |
|--------|------------------|---------|
| `uki` | UK / Ireland web | `roi-calculator.html` |
| `us` | US web | `roi-calculator.html` |
| `au` | Australia web | `roi-calculator.html` |
| **`us-touchscreen`** | US kiosk, fixed 1080x1920 (this branch) | `kiosk-app/` |
| `us-embed` | US kiosk, responsive / iframe | `kiosk-app/` |

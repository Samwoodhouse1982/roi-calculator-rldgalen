# ROI Calculator — US Kiosk App (Touchscreen + Embed)

Conference kiosk app for RLDatix Galen Clinical Archive ROI estimation.
Dark theme, touch-optimized. One codebase, two build modes:

| Mode | Command | Output | Surface |
|------|---------|--------|---------|
| **Touchscreen** (default) | `npm run build` | `dist/` | Fixed portrait 1080×1920 (9:16) conference kiosk |
| **Embed** | `npm run build:embed` | `dist/` | Responsive / iframe-friendly, scales from ~320px phones to desktop |

The mode is selected at build time via `--mode embed`, which loads
`.env.embed` (`VITE_EMBED=1`). The flag switches the font scale
(`theme.js`), the outer container sizing (`App.jsx`), the splash screen
variant (`components/SplashScreen.kiosk.jsx` vs
`components/SplashScreen.embed.jsx`) and the HTML entry (`index.html` vs
`index.embed.html`). The calculation engine, input flow, and results
layout are shared and identical in both modes. See `README-EMBED.md` for
embed-specific details.

## Deploy to Netlify

**Option 1 — Drag & drop:**
1. Run `npm install && npm run build` (or `npm run build:embed`)
2. Drag the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

**Option 2 — Git deploy:**
1. Connect the repo in Netlify, set base directory to `kiosk-app`
2. Build settings are in `netlify.toml` (auto-detected); for the embed
   deploy, override the build command to `npm run build:embed`

**Option 3 — Netlify CLI:**
```bash
npm install
npm run build          # or: npm run build:embed
npx netlify-cli deploy --prod --dir=dist
```

Both modes emit `dist/index.html`, so the same Vercel/Netlify routing
config works for either.

## Local development

```bash
npm install
npm run dev            # touchscreen mode
npm run dev:embed      # embed/responsive mode
```

Opens at `http://localhost:5173`. For touchscreen preview, use browser
DevTools to set viewport to 1080×1920.

## Architecture

```
src/
  main.jsx              Entry point
  App.jsx               State management, routing, calibrating screen
                        (embed: + EmbedStyles responsive overrides)
  theme.js              Colors, fonts, formatters, step labels
                        (embed: fluid clamp() font scale)
  calc/
    engine.js           Calc function + 50+ US model constants
    presets.js           Provider presets, multipliers
    vendors.js           29 US legacy systems + cost function
  components/
    index.jsx           Card, StepIndicator, NavButtons, TouchSlider,
                        Stepper, InfoTip, BigChoice, SegmentedControl
    SplashScreen.jsx    Build-time selector for the two splash variants
    SplashScreen.kiosk.jsx   Fixed 1080×1920 splash (touchscreen)
    SplashScreen.embed.jsx   Responsive splash (embed)
  steps/
    index.jsx           ProviderStep, JourneyStep, FacilitiesStep,
                        SystemsStep, FineTuneStep
  results/
    ResultsPage.jsx     KPIs, breakdown, methodology, Galen case
```

Build: ~274KB (81KB gzip). Fully offline-capable.

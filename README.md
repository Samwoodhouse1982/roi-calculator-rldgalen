# US EHR ROI Calculator — `us`

The **United States** version of the RLDatix Galen Clinical Archive ROI
calculator. US terminology (EHR, hospital, CMS), US dollars, US evidence base
(CMS, AHRQ, AHA, KFF, HFMA, CRICO, Mello, Bates, HCUP, Joint Commission).

> This repository uses **one branch per market**. See the table at the bottom.

## What's the calculator?

**`roi-calculator.html`** is the entire application -- a self-contained single
file (React + Babel loaded from CDN, all styles inline, no build step). Open it
in a browser and it runs. This is the only file you edit to change the
calculator.

## How it deploys (Vercel)

| URL | Serves |
|-----|--------|
| `/` | `index.html` -> redirects to `roi-calculator.html` |
| other paths | rewritten to `roi-calculator.html` |
| `/roi-calculator.html` | served directly |

`index.html` is a 2-line redirect, **not** a second calculator. `vercel.json`
holds the routing.

## Files

| File | Purpose |
|------|---------|
| `roi-calculator.html` | **The calculator.** Self-contained; edit this. |
| `index.html` | 2-line redirect to `roi-calculator.html`. |
| `vercel.json` | Deploy routing. |
| `embed-snippet.html` | Reference snippet for embedding via iframe (auto-resizes via `postMessage`). |
| `README.md` | This file. |

## Editing notes

- Tuneable assumptions are named constants near the top of the
  `<script type="text/babel">` block.
- The pure `calc()` function takes inputs + overrides and returns derived values.
- Sanity-check the JSX parses before pushing.
- US work uses **US English and US evidence sources only** (CMS, AHRQ, AHA, KFF,
  HFMA, CRICO, Mello, Bates, HCUP, Joint Commission). No UK/AU contamination.

## The other branches

| Branch | Market | Deploys |
|--------|--------|---------|
| `main` | UK / Ireland (EPR, NHS, GBP) | `roi-calculator.html` |
| **`us`** | United States (this branch) | `roi-calculator.html` |
| `au` | Australia (EMR, ACSQHC, AUD) | `roi-calculator.html` |
| `us-touchscreen` | US conference kiosk (fixed 1080x1920) | `kiosk-app/` (Vite/React) |
| `us-embed` | US responsive / iframe kiosk | `kiosk-app/` (Vite/React) |

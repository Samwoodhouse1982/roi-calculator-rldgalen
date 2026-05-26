# UK / Ireland EPR ROI Calculator — `uki`

The **UK / Ireland** version of the RLDatix Galen Clinical Archive ROI calculator.
NHS terminology (EPR, Trust, NHS Reference Costs), pounds sterling, `en-GB`
formatting.

> This repository uses **one branch per market**. See the table at the bottom.

## What's the calculator?

**`roi-calculator.html`** is the entire application — a self-contained single
file (React + Babel loaded from CDN, all styles inline, no build step). Open it
in a browser and it runs. This is the only file you edit to change the
calculator.

## How it deploys (Vercel)

| URL | Serves |
|-----|--------|
| `/` | `index.html` -> redirects to `roi-calculator.html` |
| `/uk`, `/calc`, `/calculator`, `/roi-calculator` | rewritten to `roi-calculator.html` |
| `/roi-calculator.html` | served directly |

`index.html` is a 2-line redirect, **not** a second calculator -- there is only
one calculator file. `vercel.json` holds the routing.

## Files

| File | Purpose |
|------|---------|
| `roi-calculator.html` | **The calculator.** Self-contained; edit this. |
| `index.html` | 2-line redirect to `roi-calculator.html`. |
| `vercel.json` | Deploy routing + cache headers. |
| `embed-snippet.html` | Reference snippet for embedding the calculator in a host page via iframe (auto-resizes via `postMessage`). |
| `README.md` | This file. |

## Editing notes

- All tuneable assumptions are named constants near the top of the
  `<script type="text/babel">` block (`STAFF_PER_BED`, `BLENDED_HOURLY_RATE`,
  `ACTIVE_USER_PCT`, harm/quality constants, etc.).
- The pure `calc()` function takes inputs + overrides and returns all derived
  values -- no side effects.
- After editing, sanity-check the JSX parses before pushing (e.g. `@babel/parser`
  with the `jsx` plugin).
- Evidence/assumptions stay anchored to named, credible UK/NHS sources (Camacho
  et al BMJ Qual Saf 2024, NHS Reference Costs, NHS Resolution / NAO, HSSIB).
  Over-counting is worse than under-counting.

## The other branches

| Branch | Market | Deploys |
|--------|--------|---------|
| **`uki`** | UK / Ireland (this branch) | `roi-calculator.html` |
| `us` | United States (EHR, CMS, USD) | `roi-calculator.html` |
| `au` | Australia (EMR, ACSQHC, AUD) | `roi-calculator.html` |
| `us-touchscreen` | US conference kiosk (fixed 1080x1920) | `kiosk-app/` (Vite/React) |
| `us-embed` | US responsive / iframe kiosk | `kiosk-app/` (Vite/React) |

# Australia EMR ROI Calculator — `au`

The **Australia** version of the RLDatix Galen Clinical Archive ROI calculator.
Australian terminology (EMR, ACSQHC), Australian dollars, AU evidence base and
frameworks (AN-ACC, ABF / NWAU, ACSQHC, VMIA, AIHW). Includes aged-care and NDIS
provider models not present on the other branches.

> This repository uses **one branch per market**. See the table at the bottom.

## What's the calculator?

**`roi-calculator.html`** is the entire application -- a self-contained single
file (React + Babel from CDN, styles inline, no build step). Open it in a
browser and it runs. This is the only file you edit.

## How it deploys (Vercel)

`vercel.json` rewrites `/` directly to `/roi-calculator.html`. (There is no
`index.html` on this branch -- the rewrite handles the root path. This differs
slightly from `main`/`us`, which use an `index.html` redirect; functionally
equivalent.)

## Files

| File | Purpose |
|------|---------|
| `roi-calculator.html` | **The calculator.** Self-contained; edit this. |
| `vercel.json` | Deploy routing (`/` -> `roi-calculator.html`). |
| `embed-snippet.html` | Reference snippet for embedding via iframe. |
| `README.md` | This file. |

## Editing notes

- Tuneable assumptions are named constants near the top of the
  `<script type="text/babel">` block.
- AU work uses **AU-specific frameworks** (AN-ACC, ABF, NWAU, ACSQHC, VMIA) and
  AU/international evidence. Keep AUD and `en-AU`/`en-GB` number formatting.
- Aged care scales on **places**; NDIS scales on **active participants** (not
  generic bed counts).
- Sanity-check the JSX parses before pushing.

## The other branches

| Branch | Market | Deploys |
|--------|--------|---------|
| `main` | UK / Ireland (EPR, NHS, GBP) | `roi-calculator.html` |
| `us` | United States (EHR, CMS, USD) | `roi-calculator.html` |
| **`au`** | Australia (this branch) | `roi-calculator.html` |
| `us-touchscreen` | US conference kiosk (fixed 1080x1920) | `kiosk-app/` (Vite/React) |
| `us-embed` | US responsive / iframe kiosk | `kiosk-app/` (Vite/React) |

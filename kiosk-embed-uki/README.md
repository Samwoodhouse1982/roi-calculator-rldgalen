# UK & Ireland SHORT ROI Calculator — web embed (single HTML file)

The **UK & Ireland web embed** of the RLDatix Galen Clinical Archive ROI
calculator: the short interactive flow (Scope → Journey → Scale → Systems →
Fine-tune → Results) with NHS model, £/`en-GB`, lead capture and branded
PDF.

## What's the calculator?

**`roi-calculator.html`** is the entire application — a self-contained
single file (React + Babel loaded from CDN, all styles inline, images
embedded as data URIs, no build step). Open it in a browser and it runs.
This is the only file you edit to change the calculator.

> Until July 2026 this folder was a Vercel build wrapper around the
> Vite/React app in `../kiosk-app` (`npm run build:embed:uki`). The
> calculator was ported to this single file — UKI market only, numeric
> parity with the kiosk-app engine verified — so it can be edited and
> deployed exactly like the `web/*` calculators. `../kiosk-app` still
> contains the US/AU products (and the old `embed-uki` build mode, which
> is **no longer what deploys here** — see `TO-REVIEW.md` at the repo
> root).

## Files

| File | Purpose |
|------|---------|
| `roi-calculator.html` | **The calculator.** Self-contained; edit this. |
| `wordpress-embed.html` | WordPress paste-in fragment (calculator inline on the page). **Generated** — never hand-edit. |
| `wordpress-embed-popup.html` | WordPress paste-in fragment (launch button + full-screen overlay). **Generated** — never hand-edit. |
| `make-fragments.mjs` | Regenerates the two fragments from `roi-calculator.html`. Plain `node`, no dependencies. |
| `embed-snippet.html` | Iframe embed code for host pages (auto-resizes via `postMessage`). |
| `index.html` | 2-line redirect to `roi-calculator.html`. |
| `vercel.json` | Deploy routing + cache headers. |

## Editing workflow

1. Edit `roi-calculator.html` (sections are indexed in the header comment;
   model assumptions are named constants at the top of the ENGINE section).
2. Sanity-check the JSX parses before pushing (e.g. `@babel/parser` with
   the `jsx` plugin on the `<script type="text/babel">` block).
3. Regenerate the WordPress fragments: `node make-fragments.mjs`
4. Commit all three files together.

**Engine changes:** the ENGINE section is a verbatim port of the model in
`web/uki/roi-calculator.html` (numeric parity verified — see repo history).
If you change model arithmetic here, decide explicitly whether the full
web calculator (and `../kiosk-app/src/calc/engine.uki.js`) should change
too, and say so in the commit message.

## How it deploys (Vercel)

Static — no build. Point the Vercel project's **Root Directory at
`kiosk-embed-uki`**; no Build Command, no environment variables, and the
"Include source files outside of the Root Directory" setting is no longer
needed.

| URL | Serves |
|-----|--------|
| `/` | `index.html` → redirects to `roi-calculator.html` |
| `/calc`, `/calculator`, `/roi-calculator` | rewritten to `roi-calculator.html` |
| `/roi-calculator.html` | served directly |

## External requests

The page loads React 18.3.1 / ReactDOM / Babel standalone from
cdnjs.cloudflare.com, jsPDF 4.2.1 with a jsdelivr → unpkg → cdnjs fallback
chain, and the DM Sans font from Google Fonts. Same pattern as
`web/uki/roi-calculator.html` (which has run on these cdnjs pins in
production). Everything else — engine, styles, images — is inline.

## Integrations

- **HubSpot lead form** → portal 27174408, EU1 data centre (interim shared
  form GUID — see the LEAD CAPTURE section header in the file).
- **postMessage protocol** (same contract as the full web calculators):
  `roi-calculator-resize { height }` and `roi-calculator-scroll-top {}`.
- **Admin views**: tap the RLDatix wordmark on the splash for completion
  stats (PIN-reset); add `#admin-leads` to the URL for stored lead
  submissions (CSV export).

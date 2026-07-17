# RLDatix Galen Clinical Archive — ROI Calculators

All market/surface versions of the RLDatix Galen Clinical Archive ROI
calculator, in one repository, **one folder per product** on a single
branch.

| Folder | Product | Tech | Build / entry |
|--------|---------|------|---------------|
| `web/uki/` | UK / Ireland web (EPR, Trusts, NHS Reference Costs, GBP, `en-GB`) | Self-contained HTML | `roi-calculator.html` — no build step |
| `web/us/` | US web (EHR, CMS, USD, `en-US`) | Self-contained HTML | `roi-calculator.html` — no build step |
| `web/au/` | Australia web (EMR, ACSQHC, AUD, `en-AU`) | Self-contained HTML | `roi-calculator.html` — no build step |
| `kiosk-app/` | US conference kiosk — **touchscreen** (fixed 1080×1920 portrait) | Vite + React | `npm run build` |
| `kiosk-app/` | US kiosk — **embed** (responsive / iframe-friendly) | Vite + React (same app, build flag) | `npm run build:embed` |

## The two codebases

**Web calculators** (`web/uki`, `web/us`, `web/au`): each is a single
self-contained `roi-calculator.html` (React + Babel from CDN, all styles
inline, no build step). Open it in a browser and it runs. Each market
folder also carries its own `vercel.json` routing and embed snippet. See
the README inside each folder for market-specific editing notes and
evidence-sourcing rules.

**Kiosk app** (`kiosk-app/`): one Vite/React app with two build modes —
the fixed 1080×1920 touchscreen build (default) and the responsive embed
build (`--mode embed`, driven by `VITE_EMBED=1` from `.env.embed`). The
calculation engine, input flow and results are shared; only sizing/layout
variants differ. See `kiosk-app/README.md` and `kiosk-app/README-EMBED.md`.

## Deploys

Each product deploys as its own Vercel/Netlify project pointed at its
folder (Root Directory setting), all from this branch:

| Product | Root directory | Build command |
|---------|---------------|---------------|
| UKI web | `web/uki` | — (static) |
| US web | `web/us` | — (static) |
| AU web | `web/au` | — (static) |
| US touchscreen | `kiosk-app` | `npm run build` |
| US embed | `kiosk-app` | `npm run build:embed` |

## History

This repo previously used one branch per product (`uki`, `us`, `au`,
`us-touchscreen`, `us-embed`). Those branches were merged here with full
history preserved: the web branches via subtree merges into `web/<market>/`
(files byte-identical to each branch tip at merge time), and `us-embed`
unified into `kiosk-app/` behind the embed build flag (rendered output
verified identical for both modes). Every pre-merge commit remains
reachable; to see a web calculator's pre-merge history, follow the merge's
second parent, e.g. for UKI:

```bash
git log $(git log --merges --format=%H -1 --grep="Merge branch 'uki'")^2 -- roi-calculator.html
```

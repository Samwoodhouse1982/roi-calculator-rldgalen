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
| `kiosk-app/` | UK & Ireland — **embed** (short interactive web flow, NHS model, GBP) | Vite + React (same app, market flag) | `npm run build:embed:uki` |

## The two codebases

**Web calculators** (`web/uki`, `web/us`, `web/au`): each is a single
self-contained `roi-calculator.html` (React + Babel from CDN, all styles
inline, no build step). Open it in a browser and it runs. Each market
folder also carries its own `vercel.json` routing and embed snippet. See
the README inside each folder for market-specific editing notes and
evidence-sourcing rules.

**Kiosk app** (`kiosk-app/`): one Vite/React app with two build
dimensions — surface (`VITE_EMBED=1` picks the responsive embed over the
fixed 1080×1920 touchscreen) and market (`VITE_MARKET=uki` picks the
NHS/Ireland engine, UK system catalogue, £ formatting and UK report
content over the US defaults). Three shipped combinations: US touchscreen
(`npm run build`), US embed (`npm run build:embed`), UKI embed
(`npm run build:embed:uki`). The UKI engine is a verbatim port of
`web/uki/roi-calculator.html`'s model (numeric parity verified); the US
builds are byte-for-byte unaffected by the UKI market code. See
`kiosk-app/README.md` and `kiosk-app/README-EMBED.md`.

## Deploys

Each product deploys as its own Vercel/Netlify project pointed at its
folder (Root Directory setting), all from this branch:

| Product | Root directory | Build command |
|---------|---------------|---------------|
| UKI web | `web/uki` | — (static) |
| US web | `web/us` | — (static) |
| AU web | `web/au` | — (static) |
| US touchscreen | `kiosk-app` | — (auto: `npm run build`) |
| US embed | `kiosk-embed` | — (auto: builds `kiosk-app` in embed mode) |
| UKI embed | `kiosk-embed-uki` | — (auto: builds `kiosk-app` in UKI embed mode) |

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

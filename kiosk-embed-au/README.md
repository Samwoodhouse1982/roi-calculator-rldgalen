# Australia Embed — Vercel deploy wrapper

This folder exists so the **Australia web embed** can deploy on Vercel
with zero dashboard configuration beyond the Root Directory.

Point the AU embed Vercel project's **Root Directory at
`kiosk-embed-au`** and you're done: the `vercel.json` here builds the
AU embed variant of `../kiosk-app` (`npm run build:embed:au`, i.e.
`--mode embed-au` → `VITE_EMBED=1` + `VITE_MARKET=au`) and serves its
output. No Build Command override, no environment variables.

The actual application source lives in `../kiosk-app` — one Vite app with
a US touchscreen build (default), US/UKI embed builds, and this AU embed
build. The AU market swaps in the audited Australian engine
(`src/calc/engine.au.js`, numeric parity with `web/au/roi-calculator.html`),
three-sector flow (hospitals / residential aged care / NDIS), AU system
catalogues, A$ formatting, and AU report content; the US and UKI builds
are byte-for-byte unaffected.

Requires the project's "Include source files outside of the Root
Directory" setting to be enabled — it is by default.

# UK & Ireland Embed — Vercel deploy wrapper

This folder exists so the **UK & Ireland web embed** can deploy on Vercel
with zero dashboard configuration beyond the Root Directory.

Point the UKI embed Vercel project's **Root Directory at
`kiosk-embed-uki`** and you're done: the `vercel.json` here builds the
UKI embed variant of `../kiosk-app` (`npm run build:embed:uki`, i.e.
`--mode embed-uki` → `VITE_EMBED=1` + `VITE_MARKET=uki`) and serves its
output. No Build Command override, no environment variables.

The actual application source lives in `../kiosk-app` — one Vite app with
a US touchscreen build (default), a US embed build (`--mode embed`), and
this UKI embed build. The UKI market swaps in the NHS/Ireland engine
(`src/calc/engine.uki.js`, numeric parity with `web/uki/roi-calculator.html`),
UK system catalogue, org-type presets, £ formatting, and UK report content;
the US builds are byte-for-byte unaffected.

Requires the project's "Include source files outside of the Root
Directory" setting to be enabled — it is by default.

# UK & Ireland Touchscreen Kiosk — Vercel deploy wrapper

This folder exists so the **UK & Ireland touchscreen kiosk** can deploy on
Vercel with zero dashboard configuration beyond the Root Directory.

Point the UKI kiosk Vercel project's **Root Directory at `kiosk-uki`** and
you're done: the `vercel.json` here builds the UKI touchscreen variant of
`../kiosk-app` (`npm run build:kiosk:uki`, i.e. `--mode kiosk-uki` →
`VITE_MARKET=uki`, no `VITE_EMBED`) and serves its output. No Build Command
override, no environment variables.

What you get: the US touchscreen's look and format (fixed 1080×1920
portrait, dark theme, particle splash, on-screen keyboard, 15-minute idle
reset, hidden PIN-protected stats overlay, no lead form) with the UKI
embed's maths and content (NHS/Ireland engine `src/calc/engine.uki.js`, UK
system catalogue, org-type presets, £/en-GB, UK report copy, and the
Conservative / Moderate / Optimistic confidence toggle). Same inputs give
the same numbers as the UKI embed.

Requires the project's "Include source files outside of the Root
Directory" setting to be enabled — it is by default.

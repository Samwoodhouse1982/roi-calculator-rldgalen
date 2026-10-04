# UK & Ireland Touchscreen Kiosk — Vercel deploy wrapper

This folder exists so the **UK & Ireland touchscreen kiosk** can deploy on
Vercel with zero dashboard configuration beyond the Root Directory.

Point the UKI kiosk Vercel project's **Root Directory at `rld-galen-uki-touchscreen-oct-2026`** and
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

## Deploying on Netlify instead

`netlify.toml` here does the same build on Netlify. In Netlify choose
**Add new site → Import an existing project**, pick this repo and set
**Base directory** to `rld-galen-uki-touchscreen-oct-2026`. The build
command, publish folder, Node version and SPA redirect all come from
`netlify.toml`. Netlify skips the build when a push doesn't touch this
folder or `kiosk-app/`.

## Running it on the UPERFECT 24.5" 2K screen

See [`windows/SETUP-WINDOWS.md`](windows/SETUP-WINDOWS.md) for mounting,
cabling, Windows display and touch settings, and the `windows/start-kiosk.cmd`
launcher (Edge kiosk mode). The calculator scales itself to fill any portrait
screen, whatever its resolution or Windows display scaling.

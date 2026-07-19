# US Embed — Vercel deploy wrapper

This folder exists so the **US web embed** can deploy on Vercel with zero
dashboard configuration beyond the Root Directory.

Point the embed Vercel project's **Root Directory at `kiosk-embed`** and
you're done: the `vercel.json` here builds the embed variant of
`../kiosk-app` (`npm run build:embed`) and serves its output. No Build
Command override, no environment variables.

The actual application source lives in `../kiosk-app` — one Vite app with
a touchscreen build (default) and this embed build (`--mode embed` /
`VITE_EMBED=1`). See `../kiosk-app/README-EMBED.md`.

Requires the project's "Include source files outside of the Root
Directory" setting to be enabled — it is by default.

<!-- deploy: 2026-07-19 v3.2 rollout -->

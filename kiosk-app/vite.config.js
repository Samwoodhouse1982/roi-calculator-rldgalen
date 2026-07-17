import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { existsSync, renameSync } from 'node:fs';
import path from 'node:path';

// One app, two build modes:
//   npm run build        -> touchscreen kiosk (fixed 1080×1920), entry index.html
//   npm run build:embed  -> responsive/iframe embed,             entry index.embed.html
//
// `--mode embed` loads .env.embed (VITE_EMBED=1), which the source reads via
// import.meta.env.VITE_EMBED to pick the embed variants. Both modes emit
// dist/index.html so existing Vercel/Netlify configs work unchanged.
const embedHtmlEntry = () => {
  let outDir;
  return {
    name: 'embed-html-entry',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    // Dev server: serve index.embed.html at /
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url === '/index.html') req.url = '/index.embed.html';
        next();
      });
    },
    // Build: the entry is index.embed.html; rename the emitted file to
    // index.html once everything is written (Vite emits the HTML after
    // plugin generateBundle hooks, so a filesystem rename is the reliable way).
    closeBundle() {
      const from = path.join(outDir, 'index.embed.html');
      if (existsSync(from)) renameSync(from, path.join(outDir, 'index.html'));
    },
  };
};

export default defineConfig(({ mode }) => {
  const embed = mode === 'embed';
  return {
    plugins: [react(), ...(embed ? [embedHtmlEntry()] : [])],
    build: {
      outDir: 'dist',
      target: 'es2015',
      cssTarget: 'chrome61',
      ...(embed
        ? { rollupOptions: { input: fileURLToPath(new URL('./index.embed.html', import.meta.url)) } }
        : {}),
    },
  };
});

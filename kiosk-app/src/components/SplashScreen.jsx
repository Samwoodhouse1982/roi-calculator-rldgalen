// Selects the splash screen variant at build time.
//
// The two variants are intentionally kept as separate files (rather than one
// file full of conditionals) because they differ structurally: the kiosk
// version is the animated attract screen (particle canvas, pulse, radial
// launch wipe) laid out against a fixed 1080×1920 display, while the embed
// version is a static, light-themed web start screen with the same content
// (ported from the Smart Match web-from-kiosk conversion).
//
// VITE_EMBED is set by `.env.embed` when building with `--mode embed`
// (see package.json scripts). The condition is replaced with a constant
// at build time, so only the selected variant ends up in the bundle path
// that runs.
import { SplashScreen as KioskSplashScreen } from './SplashScreen.kiosk';
import { SplashScreen as EmbedSplashScreen } from './SplashScreen.embed';

export const SplashScreen = import.meta.env.VITE_EMBED === '1'
  ? EmbedSplashScreen
  : KioskSplashScreen;

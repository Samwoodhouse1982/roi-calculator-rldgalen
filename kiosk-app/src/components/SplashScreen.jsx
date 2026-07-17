// Selects the splash screen variant at build time.
//
// The two variants are intentionally kept as separate, untouched files
// (rather than one file full of conditionals) because they differ
// structurally: the kiosk version lays out the badge/logo/footer with
// absolute positioning against a fixed 1080×1920 canvas, while the embed
// version uses a responsive flex column and a devicePixelRatio-aware
// canvas. Keeping each file byte-identical to its original branch
// guarantees neither build's behaviour changed in the unification.
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

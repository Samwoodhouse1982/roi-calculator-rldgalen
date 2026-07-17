export const C = {
  bg: "#0a0f1a", surface: "#141b2d", border: "#2a3548", borderLight: "#1e2840",
  text: "#e8edf5", textMid: "#a0b0c0", textMuted: "#8494a8",
  accent: "#00d4aa", accentLight: "#003328", accentPale: "#0a2520",
  green: "#00d4aa", greenPale: "#0a2520",
  amber: "#f0a040", amberLight: "#2a2010",
  teal: "#00d4aa", tealLight: "#00ffc8", tealPale: "#0a2a22",
  rose: "#ff4f7a", rosePale: "#2a1020",
  blue: "#40b0ff", purple: "#c090f0",
};
// Build-time flag: '1' when built with `--mode embed` (see .env.embed).
// Selects the responsive/iframe variant; default is the fixed 1080×1920 kiosk.
const EMBED = import.meta.env.VITE_EMBED === '1';

/**
 * Font scale.
 *
 * Kiosk build: hard-coded pixel sizes for the 1080×1920 kiosk display.
 *
 * Embed build: fluid values that scale with viewport width using CSS
 * clamp(min, preferred, max):
 *   - min: legible floor on the smallest mobile screen we target (~320px)
 *   - preferred: vw-based middle value that scales smoothly
 *   - max: the original kiosk size, so on a wide desktop the layout
 *     visually matches the kiosk
 *
 * In the embed build each entry is a string ('clamp(...)') rather than a
 * number, so any style prop that wrote `fontSize: F.hero` continues to
 * work - CSS accepts a clamp string the same as a number.
 */
export const F = EMBED
  ? {
      hero:  "clamp(56px,  9.5vw, 108px)",
      h1:    "clamp(30px,  3.7vw, 40px)",
      h2:    "clamp(22px,  2.6vw, 28px)",
      h3:    "clamp(18px,  2.0vw, 22px)",
      body:  "clamp(15px,  1.7vw, 18px)",
      small: "clamp(13px,  1.5vw, 16px)",
      tiny:  "clamp(12px,  1.3vw, 14px)",
      label: "clamp(13px,  1.4vw, 15px)",
    }
  : { hero: 108, h1: 40, h2: 28, h3: 22, body: 18, small: 16, tiny: 14, label: 15 };

/**
 * Layout size constants.
 *
 * Kiosk build: W×H (1080×1920) are the fixed dimensions of the display.
 *
 * Embed build: W (1080) is the MAX content width on wide screens. The
 * outer container in App.jsx uses width:100% up to maxWidth:W, so the
 * kiosk's visual identity is preserved on large displays but the layout
 * flows naturally on smaller ones. H (1920) is not used as a fixed
 * dimension - the embed build grows naturally with content and uses
 * min-height: 100vh on the outer container instead.
 */
export const W = 1080, H = 1920;
export const fmt = n => typeof n === "number" ? n.toLocaleString("en-US") : n;
export const fmtK = n => n >= 1e6 ? `$${(n/1e6).toFixed(1)}m` : n >= 1000 ? `$${Math.round(n/1000).toLocaleString("en-US")}k` : `$${fmt(n)}`;
export const fmtNum = n => typeof n === "number" ? n.toLocaleString("en-US") : n;
export const KIOSK_STEPS = ["Scope", "Journey", "Facilities", "Systems", "Fine-tune", "Results"];

export const FACILITY_TYPES = [
  { key: "hospitals", label: "Hospitals", iconKey: "hospital", hasBeds: true },
  { key: "ambulatory_surgery", label: "Ambulatory Surgery Centers", iconKey: "surgery" },
  { key: "physician_practices", label: "Physician Practices", iconKey: "physician" },
  { key: "urgent_care", label: "Urgent Care Centers", iconKey: "urgentCare" },
  { key: "imaging_centers", label: "Imaging Centers", iconKey: "imaging" },
  { key: "dialysis", label: "Dialysis Centers", iconKey: "dialysis" },
  { key: "snf", label: "Skilled Nursing Facilities", iconKey: "snf" },
  { key: "home_health", label: "Home Health Agencies", iconKey: "homeHealth" },
  { key: "behavioral", label: "Behavioral Health", iconKey: "behavioral" },
  { key: "rehab", label: "Rehabilitation Centers", iconKey: "rehab" },
  { key: "ltach", label: "Long-Term Acute Care", iconKey: "ltach" },
];

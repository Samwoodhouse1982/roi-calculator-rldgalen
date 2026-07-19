// Build-time flag: '1' when built with `--mode embed` (see .env.embed).
// Selects the responsive/iframe variant; default is the fixed 1080×1920 kiosk.
const EMBED = import.meta.env.VITE_EMBED === '1';

// DARK palette — the kiosk's original navy theme, unchanged.
// The extra tokens at the bottom (onAccent, scrim, …) carry the values that
// used to be hard-coded literals in components, so the embed build can swap
// them; in kiosk mode each token equals the old literal exactly.
const C_KIOSK = {
  bg: "#0a0f1a", surface: "#141b2d", border: "#2a3548", borderLight: "#1e2840",
  text: "#e8edf5", textMid: "#a0b0c0", textMuted: "#8494a8",
  accent: "#00d4aa", accentLight: "#003328", accentPale: "#0a2520",
  green: "#00d4aa", greenPale: "#0a2520",
  amber: "#f0a040", amberLight: "#2a2010",
  teal: "#00d4aa", tealLight: "#00ffc8", tealPale: "#0a2a22",
  rose: "#ff4f7a", rosePale: "#2a1020",
  blue: "#40b0ff", purple: "#c090f0",
  onAccent: "#0a0f1a",                      // text on accent-filled buttons/badges
  inkOnColor: "#0a0f1a",                    // text on bright variable-colored chips
  scrim: "rgba(10,15,26,0.94)",             // modal overlay backdrop
  tooltipBg: "#1e2840",
  tooltipShadow: "0 12px 48px rgba(0,0,0,.6)",
  ctaGrad: "linear-gradient(135deg, #00d4aa, #00ffc8)",   // Calculate ROI button
  ctaShadow: "0 6px 28px rgba(0,212,170,0.4)",
  glowA: "rgba(0,212,170,0.3)", glowB: "rgba(0,212,170,0.6)",  // hero text-shadow pulse
  // Chart FILLS (composition strip, projection bars, legend dots). Separate
  // from the text accents above: fills want vibrancy, text wants contrast.
  // Kiosk values equal the literals the charts always used.
  chart: { decom: "#00d4aa", capacity: "#f0a040", reimb: "#40b0ff", safety: "#c090f0", academic: "#e67e22", network: "#8e44ad" },
};

// LIGHT palette — the RLDatix web-calculator design system (deep teal +
// seafoam on white), matching the Smart Match web build and the wider RLDatix
// ROI suite so the embed sits comfortably on rldatix.com. Colours only: the
// kiosk build keeps the dark palette above.
const C_EMBED = {
  bg: "#EEF7F2", surface: "#FFFFFF", border: "#D4E0DD", borderLight: "#E8EFEC",
  text: "#0F4146", textMid: "#3D5A5E", textMuted: "#5F787C",
  accent: "#0F4146", accentLight: "#D6F7EE", accentPale: "#F3FBF9",
  green: "#1A8A7A", greenPale: "#EEF7F1",
  amber: "#B45309", amberLight: "#F7EFD8",
  teal: "#0F4146", tealLight: "#1A8A7A", tealPale: "#E8FAF6",
  rose: "#93405A", rosePale: "#FAF0F4",
  blue: "#1D6FB8", purple: "#7C3AED",
  onAccent: "#FFFFFF",
  inkOnColor: "#0F4146",
  scrim: "rgba(15,65,70,0.45)",
  tooltipBg: "#FFFFFF",
  tooltipShadow: "0 12px 48px rgba(15,65,70,.18)",
  ctaGrad: "linear-gradient(135deg, #0F4146, #1A8A7A)",
  ctaShadow: "0 6px 28px rgba(15,65,70,0.25)",
  glowA: "rgba(26,138,122,0.18)", glowB: "rgba(26,138,122,0.32)",
  // Vibrant, on-brand chart fills: deep teal anchor + seafoam, with clear
  // azure/violet/orange/fuchsia for the remaining series.
  chart: { decom: "#0F4146", capacity: "#34DEC2", reimb: "#2E9FE6", safety: "#8B5CF6", academic: "#F97316", network: "#C026D3" },
};

export const C = EMBED ? C_EMBED : C_KIOSK;

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
      // Web-scale fluid typography (ported from the Smart Match web build):
      // each step scales between a phone floor and a desktop ceiling. The
      // ceilings are deliberately smaller than the kiosk's px sizes — kiosk
      // type is sized for reading at arm's length on a 1920px-tall display,
      // web type for a browser page.
      hero:  "clamp(2.4rem, 7.5vw, 4rem)",
      h1:    "clamp(1.45rem, 3.4vw, 1.9rem)",
      h2:    "clamp(1.2rem, 2.6vw, 1.5rem)",
      h3:    "clamp(1.05rem, 2.2vw, 1.25rem)",
      body:  "clamp(0.92rem, 1.7vw, 1.02rem)",
      small: "clamp(0.85rem, 1.5vw, 0.92rem)",
      tiny:  "clamp(0.76rem, 1.35vw, 0.82rem)",
      label: "clamp(0.82rem, 1.5vw, 0.88rem)",
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
// Embed build content max width — a web-page column (the Smart Match web
// build uses the same), narrower than the kiosk's 1080.
export const MAXW = 900;
// Embed build fluid horizontal gutter (ported from the Smart Match web
// build); the kiosk uses fixed 56px paddings instead.
export const GUTTER = "clamp(16px, 4vw, 44px)";
export const fmt = n => typeof n === "number" ? n.toLocaleString("en-US") : n;
export const fmtK = n => n >= 1e6 ? `$${(n/1e6).toFixed(1)}m` : n >= 1000 ? `$${Math.round(n/1000).toLocaleString("en-US")}k` : `$${fmt(n)}`;
export const fmtNum = n => typeof n === "number" ? n.toLocaleString("en-US") : n;
export const KIOSK_STEPS = ["Scope", "Journey", "Facilities", "Systems", "Fine-tune", "Results"];

// `group` drives the embed's sectioned facility list (Ambulatory /
// Post-acute / Ancillary & specialty); the kiosk renders the flat list and
// ignores it.
export const FACILITY_TYPES = [
  { key: "hospitals", label: "Hospitals", iconKey: "hospital", hasBeds: true },
  { key: "ambulatory_surgery", label: "Ambulatory Surgery Centers", iconKey: "surgery", group: "ambulatory" },
  { key: "physician_practices", label: "Physician Practices", iconKey: "physician", group: "ambulatory" },
  { key: "urgent_care", label: "Urgent Care Centers", iconKey: "urgentCare", group: "ambulatory" },
  { key: "imaging_centers", label: "Imaging Centers", iconKey: "imaging", group: "ancillary" },
  { key: "dialysis", label: "Dialysis Centers", iconKey: "dialysis", group: "ancillary" },
  { key: "snf", label: "Skilled Nursing Facilities", iconKey: "snf", group: "postacute" },
  { key: "home_health", label: "Home Health Agencies", iconKey: "homeHealth", group: "postacute" },
  { key: "behavioral", label: "Behavioral Health", iconKey: "behavioral", group: "ancillary" },
  { key: "rehab", label: "Rehabilitation Centers", iconKey: "rehab", group: "postacute" },
  { key: "ltach", label: "Long-Term Acute Care", iconKey: "ltach", group: "postacute" },
];

export const FACILITY_GROUPS = [
  { key: "ambulatory", label: "Ambulatory" },
  { key: "postacute", label: "Post-acute" },
  { key: "ancillary", label: "Ancillary & specialty" },
];

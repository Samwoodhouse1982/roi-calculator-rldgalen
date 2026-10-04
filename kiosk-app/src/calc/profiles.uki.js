// UKI touchscreen audience profiles. The UKI model was built for the NHS;
// these let the touchscreen also speak to UK private providers, the HSE and
// Irish private groups. A profile sets the currency, the wording, the Scope
// step's size presets and the benchmark figures the engine uses.
//
// Only the touchscreen switches profile (App.jsx, gated on UKI_KIOSK). The
// UKI web embed never does, so it always runs as NHS and is unchanged.
//
// The non-NHS figures are interim: they reuse the NHS benchmarks (converted
// to euro for Ireland) until RLDatix supplies sector-specific ones, and they
// leave out clinical negligence, which the NHS figure builds from NHS
// Resolution's scheme. The results page says so in its methodology.

import { BENCHMARKS } from './engine.uki';
import { PRESETS, PRESETS_UK_PRIVATE, PRESETS_HSE, PRESETS_IE_PRIVATE } from './presets.uki';

// Planning rate for converting the £ benchmarks to euro. Kept round and a
// little under the 2026 market rate (about €1.16-1.17), so euro figures err
// low rather than high.
export const EUR_PER_GBP = 1.15;

const eurFigures = {
  hourlyRate: Math.round(BENCHMARKS.hourlyRate * EUR_PER_GBP),
  bedDayCost: Math.round(BENCHMARKS.bedDayCost * EUR_PER_GBP),
  indemnityPerBed: 0,
  testCost: Math.round(BENCHMARKS.testCost * EUR_PER_GBP),
  costScale: EUR_PER_GBP,
};

// Wording shared by the profiles that talk about hospitals and groups rather
// than Trusts and ICSs.
const hospitalWords = {
  orgLabel: "Hospitals in scope",
  unitTip: "The total across all the hospitals in scope.",
  avgUnit: "beds per hospital",
};

export const PROFILES = {
  nhs: {
    key: "nhs", label: "NHS", currency: "£", nhs: true,
    presets: PRESETS, figures: BENCHMARKS, orgMax: 10,
    splash: "See how much your Trust or ICS could save by retiring legacy systems and consolidating clinical data into a single archive.",
    orgLabel: "Trusts / organisations in scope",
    orgTip: "A single Trust, or the number of organisations in a multi-Trust or ICS-wide programme.",
    unitLabel: "Total acute beds",
    unitTip: "The total across all the organisations in scope.",
    avgUnit: "beds per organisation",
  },
  "uk-private": {
    key: "uk-private", label: "UK private", currency: "£",
    presets: PRESETS_UK_PRIVATE, figures: { ...BENCHMARKS, indemnityPerBed: 0 }, orgMax: 50,
    splash: "See how much your hospital or group could save by retiring legacy systems and consolidating clinical data into a single archive.",
    ...hospitalWords,
    orgTip: "A single hospital, or the number of hospitals in your group.",
    unitLabel: "Total inpatient beds",
    scaleContext: "Bed count is the primary scaling factor: it drives staffing levels, clinical time at risk, and harm exposure. Multi-site groups multiply corporate overheads and duplicate systems.",
    regulator: "ICO",
    // Shown with the methodology on the results page.
    benchmarkNote: "UK private figures use NHS benchmarks as a proxy for staff, bed-day and test costs. Clinical negligence savings are left out, because private providers carry their own indemnity cover.",
    indemnityNote: "Clinical negligence indemnity is not included: the NHS figure is built from NHS Resolution's scheme, and private providers carry their own cover.",
  },
  hse: {
    key: "hse", label: "HSE", currency: "€",
    presets: PRESETS_HSE, figures: eurFigures, orgMax: 15,
    splash: "See how much your hospital or health region could save by retiring legacy systems and consolidating clinical data into a single archive.",
    ...hospitalWords,
    orgTip: "A single hospital, or the number of hospitals in a hospital group or health region.",
    unitLabel: "Total acute beds",
    scaleContext: "Bed count is the primary scaling factor: it drives staffing levels, clinical time at risk, and harm exposure. Hospital groups and health regions multiply corporate overheads and duplicate systems.",
    regulator: "Data Protection Commission",
    benchmarkNote: "HSE figures use UK NHS benchmarks converted to euro at €1.15 per £1. Clinical negligence savings are left out, because HSE hospitals are covered by the State Claims Agency.",
    indemnityNote: "Clinical negligence indemnity is not included: the NHS figure is built from NHS Resolution's scheme, and HSE hospitals are covered by the State Claims Agency's Clinical Indemnity Scheme instead.",
  },
  "ie-private": {
    key: "ie-private", label: "Irish private", currency: "€",
    presets: PRESETS_IE_PRIVATE, figures: eurFigures, orgMax: 10,
    splash: "See how much your hospital or group could save by retiring legacy systems and consolidating clinical data into a single archive.",
    ...hospitalWords,
    orgTip: "A single hospital, or the number of hospitals in your group.",
    unitLabel: "Total inpatient beds",
    scaleContext: "Bed count is the primary scaling factor: it drives staffing levels, clinical time at risk, and harm exposure. Multi-site groups multiply corporate overheads and duplicate systems.",
    regulator: "Data Protection Commission",
    benchmarkNote: "Irish private figures use UK NHS benchmarks converted to euro at €1.15 per £1. Clinical negligence savings are left out, because private hospitals carry their own indemnity cover.",
    indemnityNote: "Clinical negligence indemnity is not included: the NHS figure is built from NHS Resolution's scheme, and Irish private hospitals buy their own cover.",
  },
};

export const PROFILE_KEYS = Object.keys(PROFILES);

// The profile the touchscreen starts in, and returns to after "New case" or
// an idle reset: ?sector=<key> on the launcher URL (e.g. ?sector=ie-private
// for an Irish private event), otherwise NHS.
export function initialProfileKey() {
  try {
    const k = new URLSearchParams(window.location.search).get("sector");
    if (k && PROFILES[k.toLowerCase()]) return k.toLowerCase();
  } catch (e) { /* no window or bad URL: fall through */ }
  return "nhs";
}

// The active profile, set by App on every render so formatters and the
// system catalogue can read it without threading a prop through every step.
let active = PROFILES.nhs;
export function setActiveProfile(key) { active = PROFILES[key] || PROFILES.nhs; }
export function activeProfile() { return active; }

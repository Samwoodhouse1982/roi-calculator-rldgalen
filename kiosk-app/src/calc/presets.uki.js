// UK & Ireland organisation presets - from web/uki/roi-calculator.html
// (data_types omitted: the kiosk flow does not collect them and calc()
// ignores them).
export const PRESETS = {
  SMALL: { label: "Specialist / Smaller Trust", desc: "~250 beds \u00b7 1 org \u00b7 8 systems", data: { bed_count: 250, org_count: 1, journey: "HAVE_EPR", tiers: { enterprise: 0, departmental: 3, niche: 5 }, complexity_level: "LOW", data_quality_level: "MIXED", decom_retire_rate: 0.75 } },
  TYPICAL: { label: "Typical Acute Trust", desc: "~800 beds \u00b7 1 org \u00b7 15 systems", data: { bed_count: 800, org_count: 1, journey: "EVALUATING", tiers: { enterprise: 1, departmental: 5, niche: 9 }, complexity_level: "TYPICAL", data_quality_level: "MIXED", decom_retire_rate: 0.75 } },
  LARGE: { label: "Large Acute Trust", desc: "~1400 beds \u00b7 1 org \u00b7 25 systems", data: { bed_count: 1400, org_count: 1, journey: "EVALUATING", tiers: { enterprise: 2, departmental: 8, niche: 15 }, complexity_level: "HIGH", data_quality_level: "MIXED", decom_retire_rate: 0.75 } },
  REGIONAL: { label: "Integrated Care System / Multi-Trust", desc: "~3500 beds \u00b7 4 orgs \u00b7 70+ systems", data: { bed_count: 3500, org_count: 4, journey: "EVALUATING", tiers: { enterprise: 5, departmental: 22, niche: 45 }, complexity_level: "HIGH", data_quality_level: "POOR", decom_retire_rate: 0.70 } },
};

// Scope-step cards (order + icons from the shared icon set).
export const ORG_TYPES = [
  { key: "SMALL", iconKey: "hospital" },
  { key: "TYPICAL", iconKey: "community" },
  { key: "LARGE", iconKey: "regional" },
  { key: "REGIONAL", iconKey: "idn" },
];

// UKI touchscreen audience profiles (calc/profiles.uki.js): size presets for
// the non-NHS profiles, keyed like PRESETS so the Scope step, its icons
// (ORG_TYPES) and the TYPICAL default work the same. Bed and site counts are
// rounded starting points the visitor adjusts on the Scale step, sized from
// published bed counts (e.g. Irish private hospitals of ~110-250 beds,
// groups of 3-5 hospitals).
const preset = (label, desc, bed_count, org_count, journey, [enterprise, departmental, niche], complexity_level, data_quality_level, decom_retire_rate = 0.75) =>
  ({ label, desc, data: { bed_count, org_count, journey, tiers: { enterprise, departmental, niche }, complexity_level, data_quality_level, decom_retire_rate } });

export const PRESETS_UK_PRIVATE = {
  SMALL: preset("Independent hospital", "~60 beds · 1 hospital · 7 systems", 60, 1, "HAVE_EPR", [0, 2, 5], "LOW", "MIXED"),
  TYPICAL: preset("Larger independent hospital", "~150 beds · 1 hospital · 11 systems", 150, 1, "EVALUATING", [1, 4, 6], "TYPICAL", "MIXED"),
  LARGE: preset("Regional hospital group", "~500 beds · 6 hospitals · 24 systems", 500, 6, "EVALUATING", [2, 8, 14], "TYPICAL", "MIXED"),
  REGIONAL: preset("National hospital group", "~2000 beds · 30 hospitals · 50 systems", 2000, 30, "EVALUATING", [4, 16, 30], "HIGH", "POOR", 0.70),
};

export const PRESETS_HSE = {
  SMALL: preset("Smaller acute hospital", "~200 beds · 1 hospital · 8 systems", 200, 1, "EVALUATING", [0, 3, 5], "LOW", "MIXED"),
  TYPICAL: preset("Regional acute hospital", "~500 beds · 1 hospital · 14 systems", 500, 1, "EVALUATING", [1, 5, 8], "TYPICAL", "MIXED"),
  LARGE: preset("Major teaching hospital", "~900 beds · 1 hospital · 24 systems", 900, 1, "EVALUATING", [2, 8, 14], "HIGH", "MIXED"),
  REGIONAL: preset("Health region", "~2000 beds · 6 hospitals · 60 systems", 2000, 6, "EVALUATING", [4, 20, 36], "HIGH", "POOR", 0.70),
};

export const PRESETS_IE_PRIVATE = {
  SMALL: preset("Private hospital", "~120 beds · 1 hospital · 8 systems", 120, 1, "HAVE_EPR", [0, 3, 5], "LOW", "MIXED"),
  TYPICAL: preset("Large private hospital", "~250 beds · 1 hospital · 12 systems", 250, 1, "EVALUATING", [1, 4, 7], "TYPICAL", "MIXED"),
  LARGE: preset("Private hospital group", "~450 beds · 3 hospitals · 22 systems", 450, 3, "EVALUATING", [2, 7, 13], "TYPICAL", "MIXED"),
  REGIONAL: preset("National private group", "~900 beds · 5 hospitals · 35 systems", 900, 5, "EVALUATING", [3, 12, 20], "HIGH", "MIXED", 0.70),
};

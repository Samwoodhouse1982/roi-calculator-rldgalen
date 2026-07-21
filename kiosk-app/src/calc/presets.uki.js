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

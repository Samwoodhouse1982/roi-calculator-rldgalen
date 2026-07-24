// Australia organisation presets - from web/au/roi-calculator.html.
// Three sectors (hospital / residential aged care / NDIS), each with its own
// size presets. Every preset carries the web calculator's providerType so the
// engine receives the right ABF share, private-patient mix, complexity boost
// and sector branch. data_types are omitted (the kiosk flow does not collect
// them and calc() ignores them).

export const SECTORS = [
  { key: "hospital", label: "Hospital / Health Service", desc: "Public or private hospitals, LHDs / HHSs, statewide programmes", iconKey: "hospital" },
  { key: "aged_care", label: "Residential Aged Care", desc: "Single facilities to national groups (AN-ACC funded)", iconKey: "community" },
  { key: "ndis", label: "NDIS Provider", desc: "Disability support, therapy and client-management providers", iconKey: "idn" },
];

// Default occupancy / utilisation per sector (web parity: the web version
// sets these when a provider type is picked).
export const SECTOR_OCCUPANCY = { hospital: 0.90, aged_care: 0.92, ndis: 0.70 };

export const PRESETS = {
  // ── Hospitals ──
  SMALL: { sector: "hospital", providerType: "rural_remote", label: "Rural / Remote Hospital", desc: "~30 beds · 1 facility · 6 systems", data: { bed_count: 30, org_count: 1, journey: "HAVE_EPR", tiers: { enterprise: 1, departmental: 2, niche: 3 }, complexity_level: "LOW", data_quality_level: "MIXED", decom_retire_rate: 0.75 } },
  TYPICAL: { sector: "hospital", providerType: "regional", label: "Regional Hospital", desc: "~250 beds · 1 facility · 15 systems", data: { bed_count: 250, org_count: 1, journey: "EVALUATING", tiers: { enterprise: 1, departmental: 5, niche: 9 }, complexity_level: "TYPICAL", data_quality_level: "MIXED", decom_retire_rate: 0.75 } },
  METRO: { sector: "hospital", providerType: "metropolitan", label: "Metropolitan Hospital", desc: "~500 beds · 1 facility · 25 systems", data: { bed_count: 500, org_count: 1, journey: "EVALUATING", tiers: { enterprise: 2, departmental: 8, niche: 15 }, complexity_level: "HIGH", data_quality_level: "MIXED", decom_retire_rate: 0.75 } },
  LARGE: { sector: "hospital", providerType: "tertiary", label: "Tertiary / Teaching Hospital", desc: "~600 beds · 1 facility · 25 systems · academic", data: { bed_count: 600, org_count: 1, journey: "EVALUATING", tiers: { enterprise: 2, departmental: 8, niche: 15 }, complexity_level: "HIGH", data_quality_level: "MIXED", decom_retire_rate: 0.75 } },
  REGIONAL: { sector: "hospital", providerType: "state_network", label: "Local Health District / HHS", desc: "~3,000 beds · 12 hospitals · 80+ systems", data: { bed_count: 3000, org_count: 12, journey: "EVALUATING", tiers: { enterprise: 4, departmental: 28, niche: 50 }, complexity_level: "HIGH", data_quality_level: "POOR", decom_retire_rate: 0.70 } },
  STATEWIDE: { sector: "hospital", providerType: "statewide", label: "Statewide Programme", desc: "~20,000 beds · 200 hospitals · 15+ districts", data: { bed_count: 20000, org_count: 200, journey: "EVALUATING", tiers: { enterprise: 24, departmental: 80, niche: 80 }, complexity_level: "HIGH", data_quality_level: "POOR", decom_retire_rate: 0.65 } },
  // ── Residential aged care (places = bed_count) ──
  AC_SINGLE: { sector: "aged_care", providerType: "aged_care", label: "Single Aged Care Facility", desc: "~90 places · 1 facility · 6 systems", data: { bed_count: 90, org_count: 1, journey: "HAVE_EPR", tiers: { enterprise: 1, departmental: 2, niche: 3 }, complexity_level: "LOW", data_quality_level: "MIXED", decom_retire_rate: 0.70 } },
  AC_SMALL: { sector: "aged_care", providerType: "aged_care", label: "Small Aged Care Group", desc: "~350 places · 4 facilities · 8 systems", data: { bed_count: 350, org_count: 4, journey: "HAVE_EPR", tiers: { enterprise: 1, departmental: 3, niche: 4 }, complexity_level: "TYPICAL", data_quality_level: "MIXED", decom_retire_rate: 0.70 } },
  AC_MID: { sector: "aged_care", providerType: "aged_care", label: "Mid-Range Aged Care Provider", desc: "~1,000 places · 12 facilities · 12 systems", data: { bed_count: 1000, org_count: 12, journey: "HAVE_EPR", tiers: { enterprise: 2, departmental: 4, niche: 6 }, complexity_level: "TYPICAL", data_quality_level: "MIXED", decom_retire_rate: 0.65 } },
  AC_LARGE: { sector: "aged_care", providerType: "aged_care", label: "Large Aged Care Provider", desc: "~3,500 places · 35 facilities · 16 systems", data: { bed_count: 3500, org_count: 35, journey: "HAVE_EPR", tiers: { enterprise: 2, departmental: 5, niche: 9 }, complexity_level: "HIGH", data_quality_level: "POOR", decom_retire_rate: 0.60 } },
  // ── NDIS (participants = bed_count) ──
  NDIS_SMALL: { sector: "ndis", providerType: "ndis_provider", label: "Small NDIS Provider", desc: "~50 participants · 12 staff · 5 systems", data: { bed_count: 50, org_count: 1, journey: "HAVE_EPR", tiers: { enterprise: 1, departmental: 2, niche: 2 }, complexity_level: "LOW", data_quality_level: "MIXED", decom_retire_rate: 0.75 } },
  NDIS_THERAPY: { sector: "ndis", providerType: "ndis_provider", label: "Therapy Practice", desc: "~150 participants · 20 staff · 6 systems", data: { bed_count: 150, org_count: 1, journey: "HAVE_EPR", tiers: { enterprise: 1, departmental: 2, niche: 3 }, complexity_level: "TYPICAL", data_quality_level: "MIXED", decom_retire_rate: 0.70 } },
  NDIS_MID: { sector: "ndis", providerType: "ndis_provider", label: "Mid-Range NDIS Provider", desc: "~500 participants · 100 staff · 8 systems", data: { bed_count: 500, org_count: 3, journey: "HAVE_EPR", tiers: { enterprise: 1, departmental: 3, niche: 4 }, complexity_level: "TYPICAL", data_quality_level: "MIXED", decom_retire_rate: 0.70 } },
  NDIS_LARGE: { sector: "ndis", providerType: "ndis_provider", label: "Large NDIS Provider", desc: "~2,000 participants · 400 staff · 14 systems", data: { bed_count: 2000, org_count: 8, journey: "HAVE_EPR", tiers: { enterprise: 2, departmental: 5, niche: 7 }, complexity_level: "HIGH", data_quality_level: "MIXED", decom_retire_rate: 0.65 } },
};

// Scope-step size cards per sector (order + icons from the shared icon set).
export const ORG_TYPES = {
  hospital: [
    { key: "SMALL", iconKey: "hospital" },
    { key: "TYPICAL", iconKey: "community" },
    { key: "METRO", iconKey: "regional" },
    { key: "LARGE", iconKey: "graduation" },
    { key: "REGIONAL", iconKey: "network" },
    { key: "STATEWIDE", iconKey: "idn" },
  ],
  aged_care: [
    { key: "AC_SINGLE", iconKey: "hospital" },
    { key: "AC_SMALL", iconKey: "community" },
    { key: "AC_MID", iconKey: "regional" },
    { key: "AC_LARGE", iconKey: "idn" },
  ],
  ndis: [
    { key: "NDIS_SMALL", iconKey: "hospital" },
    { key: "NDIS_THERAPY", iconKey: "community" },
    { key: "NDIS_MID", iconKey: "regional" },
    { key: "NDIS_LARGE", iconKey: "idn" },
  ],
};

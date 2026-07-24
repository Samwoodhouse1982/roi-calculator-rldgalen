// Australia legacy-system catalogues - ported verbatim from
// web/au/roi-calculator.html (hospital, residential aged care and NDIS
// lists, including the per-type cost caps in systemCost).

export const KNOWN_SYSTEMS_HOSPITAL = [
  { label: "Oracle Health (Cerner Millennium)", baseCost: 2000000, perBed: 5500, type: "EMR" },
  { label: "Epic", baseCost: 3000000, perBed: 6000, type: "EMR" },
  { label: "InterSystems TrakCare", baseCost: 800000, perBed: 1800, type: "EMR/PAS" },
  { label: "Telstra Health", baseCost: 400000, perBed: 800, type: "Clinical" },
  { label: "DXC iPM / Technology (legacy)", baseCost: 800000, perBed: 1800, type: "PAS" },
  { label: "Allscripts / Sunrise", baseCost: 350000, perBed: 700, type: "EMR" },
  { label: "MEDITECH Expanse", baseCost: 600000, perBed: 1500, type: "EMR" },
  { label: "Dedalus (Orion Health)", baseCost: 500000, perBed: 1000, type: "Integration" },
  { label: "Citadel Health (BOSSnet)", baseCost: 250000, perBed: 500, type: "Theatre" },
  { label: "Alcidion Miya", baseCost: 300000, perBed: 600, type: "Clinical" },
  { label: "Citadel Health (Auslab / vLab)", baseCost: 400000, perBed: 800, type: "LIMS" },
  { label: "Agfa ORBIS / RIS", baseCost: 250000, perBed: 400, type: "Radiology" },
  { label: "Hyland OnBase", baseCost: 180000, perBed: 280, type: "ECM" },
  { label: "ISS OmniLab", baseCost: 350000, perBed: 700, type: "LIMS" },
  { label: "i.Pharmacy (NSW Health statewide)", baseCost: 200000, perBed: 300, type: "Pharmacy" },
  { label: "WinScribe / BigHand", baseCost: 120000, perBed: 180, type: "Dictation" },
  { label: "Maternity (various)", baseCost: 150000, perBed: 200, type: "Maternity" },
  { label: "RiskMan / Datix", baseCost: 80000, perBed: 120, type: "Incident" },
  { label: "MIMS Integrated", baseCost: 100000, perBed: 150, type: "Pharmacy" },
  { label: "Karisma / ORMIS", baseCost: 200000, perBed: 350, type: "Theatre" },
  { label: "Cerner PathNet", baseCost: 350000, perBed: 700, type: "LIMS" },
  { label: "iMDsoft MetaVision (eRIC)", baseCost: 300000, perBed: 600, type: "ICU" },
  { label: "Orion Health (HealtheNet / CAP)", baseCost: 500000, perBed: 900, type: "Portal" },
  { label: "DXC MedChart", baseCost: 250000, perBed: 500, type: "eMeds" },
  { label: "Cerner eMeds", baseCost: 300000, perBed: 600, type: "eMeds" },
  { label: "CorePAS", baseCost: 200000, perBed: 400, type: "PAS" },
  { label: "Objective ECM", baseCost: 120000, perBed: 180, type: "DocMgmt" },
  { label: "Micro Focus Content Manager (TRIM)", baseCost: 100000, perBed: 160, type: "DocMgmt" },
  { label: "OpenText", baseCost: 140000, perBed: 200, type: "DocMgmt" },
  { label: "Dragon Medical (Nuance)", baseCost: 80000, perBed: 140, type: "Dictation" },
  { label: "MedTasker", baseCost: 60000, perBed: 100, type: "ClinComms" },
  { label: "Alcidion Smartpage", baseCost: 80000, perBed: 130, type: "ClinComms" },
  { label: "Vocera (Stryker)", baseCost: 70000, perBed: 120, type: "ClinComms" },
  { label: "Allocate HealthRoster", baseCost: 150000, perBed: 220, type: "Rostering" },
  { label: "Kronos / UKG", baseCost: 120000, perBed: 180, type: "Rostering" },
  { label: "ICNet (BD)", baseCost: 80000, perBed: 130, type: "InfControl" },
  { label: "SAP Business Objects", baseCost: 100000, perBed: 150, type: "Analytics" },
  { label: "Qlik (legacy)", baseCost: 80000, perBed: 120, type: "Analytics" },
  { label: "Patient Flow Manager", baseCost: 90000, perBed: 140, type: "PatientFlow" },
  { label: "CBORD (Food Services)", baseCost: 60000, perBed: 90, type: "Support" },
  { label: "TechOne (Asset Mgmt)", baseCost: 80000, perBed: 110, type: "Support" },
  { label: "VHIMS (Incident/OH&S)", baseCost: 50000, perBed: 80, type: "Incident" },
  { label: "Clinical Forms (legacy)", baseCost: 40000, perBed: 60, type: "DocMgmt" },
  { label: "SIMS (Staff Credentialing)", baseCost: 50000, perBed: 70, type: "Credentialing" },
];

export const KNOWN_SYSTEMS_AGED_CARE = [
  { label: "Leecare Platinum6", baseCost: 80000, perBed: 120, type: "Clinical" },
  { label: "iCare", baseCost: 60000, perBed: 100, type: "Clinical" },
  { label: "eCase (Health Metrics)", baseCost: 70000, perBed: 110, type: "Clinical" },
  { label: "Autumn Care", baseCost: 50000, perBed: 90, type: "Clinical" },
  { label: "Person Centred Software", baseCost: 55000, perBed: 95, type: "Clinical" },
  { label: "AlayaCare Residential", baseCost: 65000, perBed: 100, type: "Clinical" },
  { label: "Telstra Health Clinical Manager", baseCost: 75000, perBed: 110, type: "Clinical" },
  { label: "Statura Care", baseCost: 45000, perBed: 80, type: "Clinical" },
  { label: "MPS Connect (eMeds)", baseCost: 30000, perBed: 50, type: "Medication" },
  { label: "WebsterCare", baseCost: 20000, perBed: 35, type: "Medication" },
  { label: "Humanforce", baseCost: 25000, perBed: 40, type: "Rostering" },
  { label: "Deputy", baseCost: 15000, perBed: 25, type: "Rostering" },
  { label: "RotaWiz", baseCost: 18000, perBed: 30, type: "Rostering" },
  { label: "Manad Plus", baseCost: 12000, perBed: 20, type: "Compliance" },
];

export const KNOWN_SYSTEMS_NDIS = [
  { label: "ShiftCare", baseCost: 15000, perBed: 30, type: "Client Mgmt" },
  { label: "SupportAbility", baseCost: 20000, perBed: 40, type: "Client Mgmt" },
  { label: "Brevity", baseCost: 18000, perBed: 35, type: "Client Mgmt" },
  { label: "Lumary", baseCost: 25000, perBed: 50, type: "Client Mgmt" },
  { label: "MYP Corp", baseCost: 22000, perBed: 45, type: "Client Mgmt" },
  { label: "iinsight", baseCost: 16000, perBed: 30, type: "Clinical/Allied" },
  { label: "Careview (Telstra Health)", baseCost: 30000, perBed: 55, type: "Client Mgmt" },
  { label: "RotaWiz", baseCost: 12000, perBed: 20, type: "Rostering" },
  { label: "Deputy", baseCost: 10000, perBed: 18, type: "Rostering" },
  { label: "Humanforce", baseCost: 15000, perBed: 25, type: "Rostering" },
  { label: "Proda/NDIA Claims", baseCost: 5000, perBed: 10, type: "Billing" },
];

export const KNOWN_SYSTEMS_BY_SECTOR = {
  hospital: KNOWN_SYSTEMS_HOSPITAL,
  aged_care: KNOWN_SYSTEMS_AGED_CARE,
  ndis: KNOWN_SYSTEMS_NDIS,
};

// Which system types belong to which tier card in the Systems step.
export const TIER_TYPES_BY_SECTOR = {
  hospital: {
    enterprise: ["EMR", "EMR/PAS", "PAS", "Portal", "Integration"],
    departmental: ["Clinical", "Theatre", "LIMS", "Radiology", "Pharmacy", "Maternity", "ICU", "eMeds", "ECM", "Dictation", "Incident"],
    niche: ["DocMgmt", "ClinComms", "Rostering", "InfControl", "Analytics", "PatientFlow", "Support", "Credentialing"],
  },
  aged_care: {
    enterprise: ["Clinical"],
    departmental: ["Medication", "Rostering"],
    niche: ["Compliance"],
  },
  ndis: {
    enterprise: ["Client Mgmt", "Clinical/Allied"],
    departmental: ["Rostering"],
    niche: ["Billing"],
  },
};

// Defaults for module consumers that don't know the sector (hospital first).
export const KNOWN_SYSTEMS = KNOWN_SYSTEMS_HOSPITAL;
export const TIER_TYPES = TIER_TYPES_BY_SECTOR.hospital;

// Per-type cost caps from the web calculator, so the biggest flagship
// suggestions can't exceed observed market rates.
export function systemCost(sys, beds) {
  const raw = Math.round(((sys.baseCost || 250000) + (sys.perBed || 0) * beds) / 1000) * 1000;
  const tierTypeCaps = { EMR: 20000000, "EMR/PAS": 20000000, PAS: 15000000, Clinical: 3000000, Theatre: 500000, Radiology: 500000, LIMS: 500000, Pharmacy: 500000, Maternity: 500000, Integration: 500000, eMeds: 500000, Dictation: 200000, ECM: 200000, Incident: 200000 };
  const cap = tierTypeCaps[sys.type] || 8000000;
  return Math.min(raw, cap);
}

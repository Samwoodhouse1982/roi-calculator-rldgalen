// UK & Ireland legacy-system catalogue - ported verbatim from
// web/uki/roi-calculator.html.

export const KNOWN_SYSTEMS = [
  // Cost = baseCost + (perBed * bed_count). Calibrated to UK NHS contract benchmarks.
  // Sources: NHS Contracts Finder, G-Cloud framework, NHSE Frontline Digitisation pricing,
  // Spend Network, public Trust IT spend disclosures, vendor case studies (2022-2025).
  // ── Enterprise tier (EPR / PAS) ──
  { label: "Epic", baseCost: 2000000, perBed: 5000, type: "EPR" },
  { label: "Oracle Health (Cerner) Millennium", baseCost: 1200000, perBed: 3200, type: "EPR" },
  { label: "Dedalus Lorenzo", baseCost: 800000, perBed: 2200, type: "PAS/EPR" },
  { label: "TPP SystmOne", baseCost: 1000000, perBed: 2500, type: "EPR" },
  { label: "System C Careflow", baseCost: 250000, perBed: 450, type: "PAS/EPR" },
  { label: "MEDITECH Expanse", baseCost: 600000, perBed: 1500, type: "EPR" },
  { label: "InterSystems TrakCare", baseCost: 500000, perBed: 1200, type: "EPR" },
  { label: "Allscripts / Altera", baseCost: 350000, perBed: 700, type: "EPR" },
  { label: "IMS MAXIMS", baseCost: 250000, perBed: 450, type: "PAS" },
  { label: "Civica Paris", baseCost: 180000, perBed: 260, type: "PAS" },
  { label: "Cambio COSMIC", baseCost: 300000, perBed: 550, type: "EPR" },
  { label: "RiO (Servelec/CGI)", baseCost: 400000, perBed: 800, type: "PAS/EPR" },
  // ── Departmental tier ──
  { label: "Nervecentre", baseCost: 250000, perBed: 600, type: "e-Obs" },
  { label: "VitalPAC (System C)", baseCost: 220000, perBed: 500, type: "e-Obs" },
  { label: "Patientrack", baseCost: 180000, perBed: 350, type: "e-Obs" },
  { label: "CliniSys Winpath LIMS", baseCost: 150000, perBed: 200, type: "LIMS" },
  { label: "Sectra PACS", baseCost: 400000, perBed: 800, type: "PACS" },
  { label: "Agfa Enterprise Imaging", baseCost: 350000, perBed: 700, type: "PACS" },
  { label: "Philips Vue PACS", baseCost: 320000, perBed: 650, type: "PACS" },
  { label: "Varian ARIA", baseCost: 800000, perBed: 1400, type: "Oncology" },
  { label: "Elekta Mosaiq", baseCost: 600000, perBed: 1100, type: "Oncology" },
  { label: "System C Badgernet", baseCost: 80000, perBed: 100, type: "Maternity/Neonatal" },
  { label: "K2 Medical Athena", baseCost: 100000, perBed: 130, type: "Maternity/Neonatal" },
  { label: "Euroking Maternity", baseCost: 70000, perBed: 90, type: "Maternity/Neonatal" },
  { label: "WellSky (JAC) Pharmacy", baseCost: 120000, perBed: 150, type: "Pharmacy" },
  { label: "Ascribe Pharmacy (EMIS)", baseCost: 90000, perBed: 110, type: "Pharmacy" },
  { label: "BigHand", baseCost: 100000, perBed: 120, type: "Dictation" },
  { label: "G2 Speech", baseCost: 75000, perBed: 90, type: "Dictation" },
  { label: "Bluespier Theatres", baseCost: 90000, perBed: 130, type: "Theatres" },
  { label: "Galaxy Theatres (System C)", baseCost: 80000, perBed: 110, type: "Theatres" },
  { label: "Olympus EndoBase", baseCost: 60000, perBed: 80, type: "Endoscopy" },
  { label: "Unisoft Endoscopy", baseCost: 55000, perBed: 70, type: "Endoscopy" },
  { label: "Wellsoft EDIS", baseCost: 80000, perBed: 100, type: "ED" },
  { label: "Symphony EDIS (Ascom)", baseCost: 75000, perBed: 95, type: "ED" },
  { label: "Philips IntelliSpace Cardiology", baseCost: 220000, perBed: 350, type: "Cardiology" },
  // ── Standalone tier ──
  { label: "EMIS Health (Community)", baseCost: 120000, perBed: 180, type: "Clinical" },
  { label: "TPP SystmOne (Community module)", baseCost: 90000, perBed: 130, type: "Clinical" },
  { label: "Hyland OnBase ECM", baseCost: 100000, perBed: 140, type: "ECM" },
  { label: "Therefore (Canon)", baseCost: 60000, perBed: 80, type: "ECM" },
  { label: "Civica eDM", baseCost: 55000, perBed: 70, type: "ECM" },
  { label: "Kodak Clinical Documentation", baseCost: 50000, perBed: 60, type: "ECM" },
  { label: "Ulysses Safeguard", baseCost: 35000, perBed: 40, type: "Risk Mgmt" },
  { label: "InPhase", baseCost: 30000, perBed: 35, type: "Risk Mgmt" },
  { label: "Concept Evolution (FSI)", baseCost: 45000, perBed: 55, type: "Estates" },
  { label: "Asckey CAFM", baseCost: 35000, perBed: 40, type: "Estates" },
  { label: "Hicom Specialty Registries", baseCost: 40000, perBed: 50, type: "Specialty" },
  { label: "Apex Audiology", baseCost: 25000, perBed: 30, type: "Specialty" },
  { label: "Bedrock (Leeds Care Record)", baseCost: 50000, perBed: 60, type: "Specialty" },
  { label: "Concentric Health (Consent)", baseCost: 20000, perBed: 25, type: "Consent" },
  { label: "Refero (Video Consultation)", baseCost: 30000, perBed: 30, type: "Consent" },
  { label: "Ardentia / Insource BI", baseCost: 60000, perBed: 80, type: "BI" },
  { label: "QlikView NHS analytics", baseCost: 50000, perBed: 60, type: "BI" },
  { label: "TeleTracking Patient Flow", baseCost: 80000, perBed: 100, type: "Patient Flow" },
  { label: "BedView Bed Management", baseCost: 40000, perBed: 50, type: "Patient Flow" },
  { label: "Allocate / RLDatix HealthRoster", baseCost: 90000, perBed: 110, type: "Workforce" },
  { label: "Civica Open Roster", baseCost: 60000, perBed: 70, type: "Workforce" },
];
export function tierCatMatch(sysType, tier) {
  if (tier === "enterprise") return ["EPR", "PAS/EPR", "PAS"].includes(sysType);
  if (tier === "departmental") return ["e-Obs", "LIMS", "PACS", "Oncology", "Maternity/Neonatal", "Pharmacy", "Dictation", "Theatres", "Endoscopy", "ED", "Cardiology"].includes(sysType);
  return ["Clinical", "ECM", "Risk Mgmt", "Estates", "Specialty", "Consent", "BI", "Patient Flow", "Workforce"].includes(sysType);
}
export function systemCost(sys, beds) { return Math.round(((sys.baseCost || 250000) + (sys.perBed || 0) * beds) / 1000) * 1000; }

// Tier membership map in the same shape as the US vendors module.
export const TIER_TYPES = {
  enterprise: ["EPR", "PAS/EPR", "PAS"],
  departmental: ["e-Obs", "LIMS", "PACS", "Oncology", "Maternity/Neonatal", "Pharmacy", "Dictation", "Theatres", "Endoscopy", "ED", "Cardiology"],
  niche: ["Clinical", "ECM", "Risk Mgmt", "Estates", "Specialty", "Consent", "BI", "Patient Flow", "Workforce"],
};

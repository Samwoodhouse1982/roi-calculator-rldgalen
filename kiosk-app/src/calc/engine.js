// ── Model constants ──
export const STAFF_PER_BED = 3.2;
export const CORPORATE_STAFF_BASE = 20;       // Base admin/corporate staff per facility
export const CORPORATE_STAFF_PER_BED = 0.15;  // Scales with size, caps at ~120 for large facilities
export const BLENDED_HOURLY_RATE = 95;
export const WORKING_WEEKS = 50;
export const TICKETS_PER_SYSTEM = 2.5;
export const SWITCH_PENALTY_PER_SYSTEM = 0.04;  // Bartek et al JIMI 2023: beta=0.03; 4% conservative
export const SURVIVING_SYSTEM_TICKET_FACTOR = 0.6;
export const SAR_BASE_DAYS = 1.5;
export const SAR_DAYS_PER_SYSTEM_BEFORE = 0.4;
export const SAR_DAYS_PER_SYSTEM_AFTER = 0.15;

// Clinical engagement factors
export const ACTIVE_USER_PCT = 0.65;  // Sinsky 2016; KLAS Arch Collaborative           // 65% of total staff are regular EHR/system users
                                                // Remainder: porters, HCAs, casual/bank, non-clinical support
                                                // Evidence: Sinsky 2016/KLAS analytics ~60-70% active EHR users in typical US hospital
export const SYSTEM_EXPOSURE_PCT = 0.35;  // Modeled: role-based access       // Average clinician interacts with ~35% of legacy systems
                                                // An oncologist uses 4-5 of 15 systems, not all 15
                                                // Nurses touch more (40-50%), specialists fewer (20-30%)
                                                // 35% is the blended average across roles
export const MED_ERRORS_PER_BED = 15;  // AHRQ PSI data; IOM estimates 6.5 medication errors per 100 admissions
export const PATIENTS_HARMED_PER_BED = 0.28;  // HHS OIG 2022: 25% of Medicare patients experience adverse events
export const EXCESS_BED_DAYS_PER_BED = 0.32;  // Bates/Classen: 1.74-3.15 excess days per ADE; Zhan & Miller JAMA 2003


// ── US Reimbursement & Compliance Constants ──
// CMS Penalty Programs (verified from CMS program pages, FY2025/2026)
export const CMS_HRRP_MAX_PENALTY = 0.03;          // 3% max HRRP penalty (Section 1886(q) SSA)
export const CMS_HRRP_AVG_PENALTY = 0.0033;        // 0.33% average penalty (Advisory Board FY2025)
export const CMS_HAC_PENALTY = 0.01;               // 1% HAC Reduction Program (bottom quartile)
export const CMS_VBP_WITHHOLD = 0.02;              // 2% VBP withholding (budget neutral, AHA)
export const CMS_VBP_REDISTRIBUTION = 1700000000;  // $1.7bn redistributed FY2026

// Revenue Cycle / Denial Benchmarks (HFMA, MDaudit, Kodiak Solutions 2024-2025)
export const DENIAL_RATE_BASELINE = 0.118;          // 11.8% initial denial rate (Kodiak 2024)
export const DENIAL_NET_REVENUE_LOSS = 0.048;       // 4.8% net revenue lost to denials (HFMA Pulse Survey)
export const DENIAL_AVG_INPATIENT = 10000;          // $10,000 avg denied inpatient claim (MDaudit 2024)
export const DENIAL_RECOVERY_PER_BN = 10000000;     // $10m recoverable per $1bn revenue (Advisory Board 2024)

// Malpractice (Mello et al 2010, Health Affairs; AMA MLM 2024)
export const MALPRACTICE_SYSTEM_COST = 55600000000; // $55.6bn total system cost (2008 dollars)
export const MALPRACTICE_AVG_PREMIUM_PER_BED = 8500; // ~$10,870 premium-only per bed (Mello 2010 adjusted); conservative at $8,500

// Readmission benchmarks (AHRQ HCUP 2023; Vest et al JAMIA 2019; Pattar et al JAMA 2025)
export const READMISSION_RATE_NATIONAL = 0.139;     // 13.9% 30-day all-cause (AHRQ HCUP 2023)
export const READMISSION_RATE_MEDICARE = 0.170;     // 17.0% Medicare 30-day rate
export const READMIT_REDUCTION_EHR = 0.008;         // 0.8pp absolute reduction, single-vendor EHR (Vest JAMIA 2019)
export const READMIT_REDUCTION_META = 0.17;         // 17% relative reduction, EHR interventions (Pattar JAMA 2025, 116 RCTs)

// Excess bed day costs (KFF/AHA 2023; Bates et al; Zhan & Miller JAMA 2003)
export const COST_PER_EXCESS_BED_DAY = 3132;
export const US_AVG_ALOS = 4.7;                      // Average length of stay, days (AHA 2023)
export const US_AVG_REVENUE_PER_ADMISSION = 15200;    // Average inpatient revenue per admission (AHA/HCUP 2023)
export const DEFAULT_OCCUPANCY = 0.65;                // 65% national average (AHA 2023)
export const EXCESS_DAYS_PER_ADE = 2.2;             // 1.74-3.15 range, midpoint (Bates/Classen/Hug)
export const PREVENTABLE_ADE_PER_100_ADMITS = 1.8;  // Bates et al ADE Prevention Study

// Duplicate testing (ONC; PMC studies; Walker Health Affairs 2005)
export const DUPLICATE_TEST_RATE = 0.25;            // 20-30% of lab tests are duplicates (ONC/expert consensus)
export const DUPLICATE_IMAGING_RATE = 0.28;         // 28.2% of transferred patients get duplicate imaging (PMC)
export const DUPLICATE_TESTING_NATIONAL_COST = 43000000000; // $43bn/yr (RAND/ONC estimates)

// Communication failures (CRICO 2016; Joint Commission; Ponemon 2014)
export const COMM_FAILURE_PCT_CLAIMS = 0.30;        // 30% of malpractice claims involve communication failure (CRICO)
export const COMM_FAILURE_COST_5YR = 1700000000;    // $1.7bn over 5 years (CRICO, 23,658 claims)
export const COMM_WASTE_PER_HOSPITAL = 1375000;     // $1-1.75m/yr avg (Ponemon Institute)


// ── Academic Medical Center Constants ──
export const RESEARCH_SYSTEMS_PER_100_BEDS = 3.5;     // IRB, CTMS, biobank, research repos, registry systems
export const RESEARCH_SYSTEM_AVG_COST = 180000;        // Avg annual cost of a research/academic system
export const GME_COMPLIANCE_COST_PER_BED = 850;        // ACGME reporting, residency tracking, procedure logging
export const TEACHING_OVERHEAD_PCT = 0.12;             // 12% additional system complexity for teaching workflows

// ── M&A / Multi-Hospital Constants ──
export const DUPLICATE_SYSTEM_RATE = 0.30;             // 30% of systems are duplicated across facilities post-M&A
export const DUPLICATE_INFRA_COST_PER_FACILITY = 250000;

// Fragmentation attribution factors
export const DENIAL_FRAGMENTATION_ATTRIBUTION = 0.30;  // 30% of denials are documentation/fragmentation-related (HFMA denial reason analysis)
                                                         // Remaining 65%: coding errors, clinical documentation, payer rules
                                                         // Advisory Board 2024: documentation gaps from fragmented systems
                                                         // are the #2 root cause of denials after authorization issues
export const PATHOLOGY_COST_PER_BED = 8500;

// Legal & compliance
export const EDISCOVERY_CASES_PER_100_BEDS = 12;       // Malpractice, employment, slip-and-fall, contract disputes
export const EDISCOVERY_HRS_PER_CASE_BEFORE = 28;      // 3.5 days x 8 hrs: searching across multiple legacy systems
export const EDISCOVERY_HRS_PER_CASE_AFTER = 6;        // 0.75 days x 8 hrs: single archive search
export const EDISCOVERY_HOURLY_RATE = 55;               // HIM / legal records staff blended rate
export const CYBER_BREACH_AVG_COST = 10930000;          // $10.93m avg healthcare breach (IBM/Ponemon 2023)
export const CYBER_LEGACY_RISK_FACTOR = 0.04;

// Readmission cost avoidance (Vest et al JAMIA 2019; Pattar et al JAMA 2025)
export const READMIT_COST_PER_ADMISSION = 15200;       // Average cost of a readmission (AHA/HCUP 2023)
export const READMIT_FRAGMENTATION_ATTRIBUTION = 0.30;  // 30% of excess readmissions attributable to information
                                                         // fragmentation across legacy systems (care transitions,
                                                         // incomplete discharge summaries, missed follow-ups).
                                                         // Remaining 70%: patient acuity, social determinants,
                                                         // medication non-adherence.

// ── M&A / Multi-Hospital Constants ──
export const CROSS_FACILITY_STANDARDISATION_PCT = 0.15; // 15% of operational costs addressable through standardization

// ROI Calculator Engine
export const SCENARIO = {
  CONSERVATIVE: { decom_pct: 0.85, realization: 0.20, safety: 0.15 },
  EXPECTED:     { decom_pct: 1.00, realization: 0.30, safety: 0.25 },
  STRETCH:      { decom_pct: 1.10, realization: 0.40, safety: 0.35 },
};
export const CX = { LOW: 0.7, TYPICAL: 1.0, HIGH: 1.45 };
export const DQ = { CLEAN: 0.75, MIXED: 1.0, POOR: 1.4 };

export function tierCost(tier, beds, cx) {
  const base = tier === "enterprise" ? 300000 : tier === "departmental" ? 75000 : 14000;
  const perBed = tier === "enterprise" ? 700 : tier === "departmental" ? 160 : 20;
  return Math.round(((base + beds * perBed) * cx) / 1000) * 1000;
}
export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function calc(inp, mode, ov = {}, flagships = []) {
  const sc = SCENARIO[mode], cx = CX[inp.complexity_level], dq = DQ[inp.data_quality_level];
  const isArchiveOnly = inp.journey === "HAVE_EPR";
  const ent = ov.enterprise != null ? ov.enterprise : inp.tiers.enterprise;
  const dep = ov.departmental != null ? ov.departmental : inp.tiers.departmental;
  const nic = ov.niche != null ? ov.niche : inp.tiers.niche;
  const tieredLegacy = ent + dep + nic;
  const entCost = ov.entCost != null ? ov.entCost : tierCost("enterprise", inp.bed_count, cx);
  const depCost = ov.depCost != null ? ov.depCost : tierCost("departmental", inp.bed_count, cx);
  const nicCost = ov.nicCost != null ? ov.nicCost : tierCost("niche", inp.bed_count, cx);
  const tieredEstate = ent * entCost + dep * depCost + nic * nicCost;
  // Flagships. Each flagship can optionally represent multiple instances of
  // the same system (e.g. an IDN with 3-4 Epic deployments — one per hospital).
  // f.instances defaults to 1 if missing, so existing flagship state without
  // the instances field still calculates correctly.
  const flagshipTotal = flagships.reduce((s,f) => s + (f.cost || 0) * (f.instances || 1), 0);
  const flagshipDecomSave = flagships.filter(f => f.retire).reduce((s,f) => s + (f.cost || 0) * (f.instances || 1), 0);
  const flagshipCount = flagships.reduce((s,f) => s + (f.instances || 1), 0);
  const flagshipRetireCount = flagships.filter(f => f.retire).reduce((s,f) => s + (f.instances || 1), 0);
  const portfolioSystems = inp._portfolioSystems || 0;
  const legacy = tieredLegacy + flagshipCount + portfolioSystems;
  const estimatedEstate = tieredEstate + flagshipTotal + (inp._portfolioCost || 0);
  const totalEstate = inp._knownSpend > 0 ? inp._knownSpend : estimatedEstate;
  const blendedCost = legacy > 0 ? Math.round(totalEstate / legacy) : 0;
  const rawDecom = tieredLegacy * inp.decom_retire_rate * sc.decom_pct;
  const portfolioDecom = Math.round(portfolioSystems * inp.decom_retire_rate * sc.decom_pct);
  const decom = Math.min(Math.round(rawDecom), tieredLegacy) + flagshipRetireCount + portfolioDecom;
  const decomFrac = tieredLegacy > 0 ? Math.min(Math.round(rawDecom), tieredLegacy) / tieredLegacy : 0;
  const entDecom = Math.min(Math.round(ent * decomFrac), ent);
  const depDecom = Math.min(Math.round(dep * decomFrac), dep);
  const nicDecom = clamp(Math.min(Math.round(rawDecom), tieredLegacy) - entDecom - depDecom, 0, nic);
  const tieredDecomSave = entDecom * entCost + depDecom * depCost + nicDecom * nicCost;
  // Issue 1: If knownSpend provided, scale decom savings proportionally
  const spendScale = inp._knownSpend > 0 && estimatedEstate > 0 ? inp._knownSpend / estimatedEstate : 1.0;
  const portfolioDecomSave = Math.round((inp._portfolioCost || 0) * inp.decom_retire_rate * sc.decom_pct);
  const decomSave = Math.round(tieredDecomSave * spendScale) + Math.round(flagshipDecomSave * sc.decom_pct) + portfolioDecomSave;
  // Clinical capacity - staff count
  const corpPerOrg = Math.min(120, Math.round(CORPORATE_STAFF_BASE + (inp.bed_count / Math.max(1, inp.org_count)) * CORPORATE_STAFF_PER_BED));
  const totalStaff = Math.round(inp.bed_count * STAFF_PER_BED + inp.org_count * corpPerOrg + (inp._portfolioStaff || 0));
  const clinicians = ov.clinicians != null ? ov.clinicians : Math.round(totalStaff * ACTIVE_USER_PCT);
  // ^ Only 65% of total staff are regular system users
  //   Remainder: porters, HCAs, casual/bank, non-clinical support

  // System navigation overhead - based on systems each clinician actually touches
  const systemsPerUser = Math.max(2, Math.round(legacy * SYSTEM_EXPOSURE_PCT));
  // ^ Average clinician interacts with ~35% of legacy estate
  //   Oncologist uses 4-5 of 15, not all 15. Nurse uses more.
  const switchPenalty = Math.max(0, systemsPerUser - 1) * SWITCH_PENALTY_PER_SYSTEM;
  // Base minutes wasted per clinician per week navigating legacy systems
  // HAVE_EPR (8 mins): clinicians still look up historical data in unarchived legacy systems,
  //   re-key results, and context-switch between EHR and legacy interfaces.
  //   Slightly lower than EVALUATING because the primary workflow is in the EHR.
  //   Evidence: Ratwani et al JAMIA 2018 (EHR usability and workarounds); time-motion studies
  //   show 5-12 mins/day on legacy lookups even with a live EHR (Westbrook et al 2020).
  // EVALUATING (12 mins): no single EHR, all clinical work spans multiple legacy systems.
  const baseMin = isArchiveOnly ? 8 : 12;
  const cappedPenalty = Math.min(switchPenalty, 4.0);
  const complexityBoost = inp._complexityBoost || 1.0;
  const minsWasted = ov.minsWasted != null ? ov.minsWasted : Math.round(baseMin * dq * cx * complexityBoost * (1 + cappedPenalty));
  const residual = isArchiveOnly ? 1 : 2;
  const hrsSaved = Math.round((clinicians * Math.max(0, minsWasted - residual) * WORKING_WEEKS) / 60);
  const timeSave = Math.round(hrsSaved * BLENDED_HOURLY_RATE * sc.realization);
  const ticketsBaselineMonthly = ov.ticketsBaseline != null ? ov.ticketsBaseline : Math.round(legacy * TICKETS_PER_SYSTEM * dq);
  const ticketsAfter = Math.min(Math.round((legacy - decom) * TICKETS_PER_SYSTEM * dq * SURVIVING_SYSTEM_TICKET_FACTOR), ticketsBaselineMonthly);
  const ticketsReductionPct = Math.round((ticketsBaselineMonthly - ticketsAfter) / Math.max(1, ticketsBaselineMonthly) * 100);
  const sarDaysBefore = ov.sarDaysBefore != null ? ov.sarDaysBefore : Math.round((SAR_BASE_DAYS + legacy * SAR_DAYS_PER_SYSTEM_BEFORE * dq) * 10) / 10;
  const sarDaysAfter = Math.min(Math.round((SAR_BASE_DAYS + (legacy - decom) * SAR_DAYS_PER_SYSTEM_AFTER) * 10) / 10, sarDaysBefore);
  const sarReductionPct = Math.round((sarDaysBefore - sarDaysAfter) / Math.max(1, sarDaysBefore) * 100);
  const hasClinicalScope = legacy >= 3 && inp.bed_count > 0;
  let safetyMedErrorsAvoided=0, safetyPatientsProtected=0, safetyBedDaysAvoided=0, safetyMedErrorsBaseline=0;
  if (hasClinicalScope) {
    // Fragmentation scaling factor (modelled assumption)
    // Ranges from 0.6 (1 system, low fragmentation) to 1.2 (20+ systems, high fragmentation).
    // Rationale: safety risk increases with the number of disconnected data sources.
    // A single legacy system creates moderate risk (baseline 0.6); each additional system
    // increases the probability of missed information, communication gaps, and duplicate
    // orders. The factor plateaus at 20 systems (diminishing marginal risk per system).
    // Applied to medication errors, patients harmed, and excess bed days.
    const frag = 0.6 + Math.min(legacy, 20) / 20 * 0.6;
    safetyMedErrorsBaseline = Math.round(inp.bed_count * MED_ERRORS_PER_BED * frag * dq);
    const harmedBl = Math.round(inp.bed_count * PATIENTS_HARMED_PER_BED * frag * dq);
    const bedDaysBl = Math.round(inp.bed_count * EXCESS_BED_DAYS_PER_BED * frag * dq);
    safetyMedErrorsAvoided = Math.round(safetyMedErrorsBaseline * sc.safety);
    safetyPatientsProtected = Math.round(harmedBl * sc.safety);
    safetyBedDaysAvoided = Math.round(bedDaysBl * sc.safety);
  }
  // ── Reimbursement & Compliance Impact ──
  // Admissions and revenue (evidence-based derivation)
  const occupancy = inp._occupancy || DEFAULT_OCCUPANCY;
  const admissionsPerYear = Math.round(inp.bed_count * (365 / US_AVG_ALOS) * occupancy);
  const estAnnualRevenueCalc = admissionsPerYear * US_AVG_REVENUE_PER_ADMISSION;
  // Medicare DRG revenue estimate (if not provided by user)
  const estMedicareDrgRevenue = Math.round(estAnnualRevenueCalc * (inp._medicarePct ?? 0.42));
  const medicareDrg = inp._medicareDrgRevenue > 0 ? inp._medicareDrgRevenue : estMedicareDrgRevenue;

  // HRRP penalty exposure
  const hrrpExposure = medicareDrg * CMS_HRRP_AVG_PENALTY;
  const hrrpReduction = Math.round(hrrpExposure * sc.safety * (inp._penaltyWeight ?? 1.0));

  // Readmission cost avoidance
  // Vest JAMIA 2019: 0.8pp absolute reduction in 30-day readmissions from single-vendor EHR
  // This is separate from HRRP penalty: HRRP = CMS penalty %, readmission avoidance = actual care costs
  const medicareAdmissions = Math.round(admissionsPerYear * (inp._medicarePct ?? 0.42));
  const currentReadmissions = Math.round(medicareAdmissions * READMISSION_RATE_MEDICARE);
  const readmissionsAvoided = Math.round(medicareAdmissions * READMIT_REDUCTION_EHR * READMIT_FRAGMENTATION_ATTRIBUTION * sc.safety);
  // Only count readmission cost avoidance under VBC/mixed (FFS readmissions = revenue, not cost)
  const vbcWeight = inp._qualityBonus != null ? inp._qualityBonus : 0;
  const readmissionCostAvoidance = Math.round(readmissionsAvoided * READMIT_COST_PER_ADMISSION * vbcWeight);

  // HAC penalty exposure (bottom quartile = 1% of all Medicare payments)
  const hacExposure = medicareDrg * CMS_HAC_PENALTY * 0.25; // 25% probability of being in bottom quartile
  const hacReduction = Math.round(hacExposure * sc.safety * (inp._penaltyWeight ?? 1.0));

  // VBP improvement potential
  const vbpPool = medicareDrg * CMS_VBP_WITHHOLD;
  const vbpImprovement = Math.round(vbpPool * 0.15 * sc.safety * (inp._qualityBonus ?? 0.5) * (inp._penaltyWeight ?? 1.0));

  // Denial rate reduction (FFS pathway)
  const estAnnualRevenue = estAnnualRevenueCalc; // from admissions-based model above
  const denialBaseline = estAnnualRevenue * DENIAL_NET_REVENUE_LOSS;
  const denialRecovery = Math.round(denialBaseline * 0.20 * DENIAL_FRAGMENTATION_ATTRIBUTION * sc.decom_pct * (inp._denialWeight ?? 1.0));

  // Malpractice premium reduction (modeled assumption)
  const malpracticePremium = inp.bed_count * MALPRACTICE_AVG_PREMIUM_PER_BED;
  const malpracticeReduction = Math.round(malpracticePremium * 0.05 * sc.safety); // 5% reduction - conservative (CRICO: 30% of claims involve comms failure)

  // Excess bed days avoided (unified with safety section)
  const preventableADEs = Math.round(admissionsPerYear / 100 * PREVENTABLE_ADE_PER_100_ADMITS);
  // Use safety section's bed day estimate when available for consistency
  const excessDaysAvoided = hasClinicalScope ? safetyBedDaysAvoided : Math.round(preventableADEs * EXCESS_DAYS_PER_ADE * sc.safety);
  const excessDayCostAvoided = Math.round(excessDaysAvoided * COST_PER_EXCESS_BED_DAY);

  // Duplicate testing reduction
  const estLabSpend = inp.bed_count * PATHOLOGY_COST_PER_BED; // ~$8,500 per bed in lab/imaging spend
  const duplicateWaste = estLabSpend * DUPLICATE_TEST_RATE;
  const duplicateReduction = Math.round(duplicateWaste * 0.50 * sc.decom_pct); // 50% of duplicates addressable

  // ── Academic Medical Center Module ──
  const isAcademic = inp._providerType === "academic";
  const researchSystems = isAcademic ? Math.round(inp.bed_count / 100 * RESEARCH_SYSTEMS_PER_100_BEDS) : 0;
  const researchSystemCost = researchSystems * RESEARCH_SYSTEM_AVG_COST;
  const researchDecomSave = Math.round(researchSystemCost * 0.60 * sc.decom_pct); // 60% retirable
  const gmeComplianceCost = isAcademic ? Math.round(inp.bed_count * GME_COMPLIANCE_COST_PER_BED) : 0;
  const gmeEfficiency = Math.round(gmeComplianceCost * 0.25 * sc.decom_pct); // 25% efficiency gain
  const teachingOverhead = isAcademic ? Math.round(totalEstate * TEACHING_OVERHEAD_PCT * 0.30 * sc.decom_pct) : 0; // 30% of 12% extra complexity

  // ── M&A / Multi-Hospital Module ──
  const isMultiHospital = inp._providerType === "multi_hospital";
  const duplicateSystems = isMultiHospital ? Math.round(legacy * DUPLICATE_SYSTEM_RATE) : 0;
  const duplicateSystemCost = isMultiHospital ? Math.round(duplicateSystems * blendedCost) : 0;
  const duplicateElimination = Math.round(duplicateSystemCost * sc.decom_pct);
  const duplicateInfraCost = isMultiHospital ? inp.org_count * DUPLICATE_INFRA_COST_PER_FACILITY : 0;
  const infraConsolidation = Math.round(duplicateInfraCost * 0.60 * sc.decom_pct); // 60% consolidatable
  const standardizationSave = isMultiHospital ? Math.round(totalEstate * CROSS_FACILITY_STANDARDISATION_PCT * sc.decom_pct) : 0;

  // ── Legal & Compliance ──
  const litigationCases = Math.round(inp.bed_count / 100 * EDISCOVERY_CASES_PER_100_BEDS);
  const ediscoverySaveBefore = litigationCases * EDISCOVERY_HRS_PER_CASE_BEFORE * EDISCOVERY_HOURLY_RATE;
  const ediscoverySaveAfter = litigationCases * EDISCOVERY_HRS_PER_CASE_AFTER * EDISCOVERY_HOURLY_RATE;
  const ediscoverySaving = Math.round((ediscoverySaveBefore - ediscoverySaveAfter) * sc.decom_pct);
  const cyberSystemsRetired = decom;
  const cyberRiskReduction = Math.round(cyberSystemsRetired * CYBER_LEGACY_RISK_FACTOR * 100); // percentage points

  // Module totals
  const academicSavings = researchDecomSave + gmeEfficiency + teachingOverhead;
  // Network consolidation - only counts genuinely INCREMENTAL savings beyond decommissioning:
  //   - infraConsolidation: shared data centre, network, monitoring tools (NOT per-system costs)
  //   - standardizationSave: governance, vendor mgmt, training overhead from running one estate vs N
  // duplicateElimination is NOT summed here - retiring duplicate instances is already captured
  // in decomSave (each retired system's cost is recovered there). Keeping the computed value
  // in the returned object for informational display (number of duplicates identified).
  const mergeSavings = infraConsolidation + standardizationSave;

  // Total reimbursement impact
  const reimbursementImpact = hrrpReduction + hacReduction + vbpImprovement + denialRecovery;
  const qualitySavings = malpracticeReduction + excessDayCostAvoided + duplicateReduction + ediscoverySaving + readmissionCostAvoidance;

  const annual = decomSave + timeSave;
  const annualWithReimbursement = annual + reimbursementImpact + qualitySavings + academicSavings + mergeSavings;
  // Phased ramp - both 3-year (40/80/100) and 5-year (20/40/60/80/100) variants pre-computed
  // so the Results page can switch between projection windows without recomputing.
  const y1Pct = 0.40, y2Pct = 0.80, y3Pct = 1.00;
  const yr1 = Math.round(annual * y1Pct);
  const yr2 = Math.round(annual * y2Pct);
  const yr3 = Math.round(annual * y3Pct);
  const total3 = yr1 + yr2 + yr3;
  const yr1R = Math.round(annualWithReimbursement * y1Pct);
  const yr2R = Math.round(annualWithReimbursement * y2Pct);
  const yr3R = Math.round(annualWithReimbursement * y3Pct);
  const total3WithReimbursement = yr1R + yr2R + yr3R;
  // 5-year ramp: 20/40/60/80/100. Sum = 3.0 x steady state (vs 3-year ramp's 2.2 x)
  const ramp5 = [0.20, 0.40, 0.60, 0.80, 1.00];
  const yr5Vals = ramp5.map(p => Math.round(annual * p));
  const yr5ValsR = ramp5.map(p => Math.round(annualWithReimbursement * p));
  const total5 = yr5Vals.reduce((s, v) => s + v, 0);
  const total5WithReimbursement = yr5ValsR.reduce((s, v) => s + v, 0);
  return {
    legacy, org_count: inp.org_count, ent, dep, nic, entCost, depCost, nicCost, blendedCost, totalEstate,
    decom, entDecom, depDecom, nicDecom, decomSave,
    totalStaff, clinicians, systemsPerUser, minsWasted, hrsSaved, timeSave, baseMin,
    ticketsBaselineMonthly, ticketsAfter, ticketsReductionPct,
    sarDaysBefore, sarDaysAfter, sarReductionPct,
    hasClinicalScope, safetyMedErrorsAvoided, safetyPatientsProtected,
    safetyBedDaysAvoided, safetyMedErrorsBaseline,
    fteEquivalent: Math.round(hrsSaved * sc.realization / 2080 * 10) / 10,
    annual, total3, yr1, yr2, yr3, y1Pct, y2Pct, y3Pct, realization: sc.realization, decomFactor: sc.decom_pct, safetyFactor: sc.safety, isArchiveOnly,
    flagshipTotal, flagshipDecomSave: Math.round(flagshipDecomSave * sc.decom_pct),
    flagshipCount, flagshipRetireCount,
    // Reimbursement & compliance
    admissionsPerYear, estAnnualRevenueCalc, occupancy, medicareDrg, hrrpExposure, hrrpReduction, hacExposure, hacReduction,
    vbpPool, vbpImprovement, denialBaseline, denialRecovery,
    malpracticePremium, malpracticeReduction,
    preventableADEs, excessDaysAvoided, excessDayCostAvoided,
    duplicateWaste, duplicateReduction,
    reimbursementImpact, qualitySavings,
    litigationCases, ediscoverySaving, cyberSystemsRetired, cyberRiskReduction,
    medicareAdmissions, currentReadmissions, readmissionsAvoided, readmissionCostAvoidance,
    // Academic module
    isAcademic, researchSystems, researchSystemCost, researchDecomSave,
    gmeComplianceCost, gmeEfficiency, teachingOverhead, academicSavings,
    // M&A module
    isMultiHospital, duplicateSystems, duplicateSystemCost, duplicateElimination,
    duplicateInfraCost, infraConsolidation, standardizationSave, mergeSavings,
    annualWithReimbursement, total3WithReimbursement, yr1R, yr2R, yr3R,
    yr5Vals, yr5ValsR, total5, total5WithReimbursement, ramp5,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   PRESETS
   ═══════════════════════════════════════════════════════════════════════ */

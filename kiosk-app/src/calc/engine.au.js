// Australia engine - ported verbatim from web/au/roi-calculator.html
// (post-audit model: surviving-estate efficiency basis, capped stretch,
// 30% aged-care funding attribution, wired ABF-revenue override). Field
// names are US-engine-shaped natively; the compatibility block at the end
// of the return object fills the few gaps the shared kiosk results UI
// expects. Numeric parity with web/au is enforced by the comparison
// harness in the repo history.

const RAMP5 = [0.20, 0.40, 0.60, 0.80, 1.00];

const SCENARIO = {
  CONSERVATIVE: { decom_pct: 0.85, realisation: 0.20, safety: 0.15 },
  EXPECTED:     { decom_pct: 1.00, realisation: 0.30, safety: 0.25 },
  STRETCH:      { decom_pct: 1.10, realisation: 0.40, safety: 0.35 },
};
const CX = { LOW: 0.7, TYPICAL: 1.0, HIGH: 1.45 };
const DQ = { CLEAN: 0.75, MIXED: 1.0, POOR: 1.4 };

function tierCost(tier, beds, cx) {
  const base = tier === "enterprise" ? 250000 : tier === "departmental" ? 65000 : 12000;
  const perBed = tier === "enterprise" ? 600 : tier === "departmental" ? 140 : 18;
  const maxCost = tier === "enterprise" ? 8000000 : tier === "departmental" ? 500000 : 80000;
  return Math.min(maxCost, Math.round(((base + beds * perBed) * cx) / 1000) * 1000);
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
// ── Model constants ──
const STAFF_PER_BED = 3.0;              // NSW Health SDPR Expression of Interest (EOI): 75,500 clinical EMR users / 25,632 beds = ~3.0
const CORPORATE_STAFF_BASE = 20;       // Base admin/corporate staff per facility
const CORPORATE_STAFF_PER_BED = 0.10;  // Scales with size, caps at ~100 for large networks
const BLENDED_HOURLY_RATE = 65;
const WORKING_WEEKS = 48;
const TICKETS_PER_SYSTEM = 2.5;
const SWITCH_PENALTY_PER_SYSTEM = 0.04;  // Bartek et al JIMI 2023: 3% switch cost (beta=0.03); 4% conservative for multi-system switching
const SURVIVING_SYSTEM_TICKET_FACTOR = 0.6;
const SAR_BASE_DAYS = 3.0;              // Base coordination overhead (cross-LHD, redaction, quality review)
const SAR_DAYS_PER_SYSTEM_BEFORE = 0.8;  // Per-system search, extraction, reconciliation
const SAR_DAYS_PER_SYSTEM_AFTER = 0.15;

// Clinical engagement factors
const ACTIVE_USER_PCT = 0.65;           // Sinsky et al 2016 (49% physician time on EHR); KLAS Arch Collaborative (500k+ clinicians). 65% conservative
const SYSTEM_EXPOSURE_PCT = 0.35;       // Modeled assumption: role-based access patterns mean each clinician touches ~1/3 of the legacy estate
const MED_ERRORS_PER_BED = 14;  // ACSQHC sentinel event data
const PATIENTS_HARMED_PER_BED = 3.2;   // AIHW admin data: 5.4% of separations; ~60 seps/bed at ALOS 5.5 * 5.4% = 3.2
const EXCESS_BED_DAYS_PER_BED = 8.0;   // QAHCS (Quality in Australian Health Care Study)/AIHW: AEs account for ~8% of bed days; ~50% preventable
const FRAGMENTATION_ATTRIBUTION = 0.35;  // 35% of preventable AEs attributable to information/communication failure (ACSQHC)


// ── Australian ABF & Efficiency Constants ──
// Validated against AIHW 2023-24, IHACPA 2025-26 Determination, VMIA 2025-26, QAHCS, Productivity Commission May 2024
const AU_AVG_ALOS = 5.7;                       // Average overnight ALOS, days (AIHW 2023-24: 5.9 public, 5.1 private; 5.7 blended)
const AU_NWAU_PRICE = 7258;                    // National Efficient Price per NWAU (IHACPA 2025-26 Determination)
const AU_NWAU_PER_SEPARATION = 1.5;            // Average NWAUs per acute overnight separation (derived from IHACPA price weights)
const DEFAULT_OCCUPANCY = 0.90;                // ~90%: AMA Public Hospital Report Card - no major public hospital at or below the safe 85% level, many at 90-100%+
const ABF_ADMIN_OVERHEAD_PCT = 0.08;           // Reference: 8% of hospital costs are IT/admin overhead (not directly used in calc)
const PRIVATE_PATIENT_LEAKAGE = 0.15;          // ~15% of private episodes go unbilled (VAGO 2019; conservative)
const PRIVATE_EPISODE_AVG_VALUE = 4200;        // A$4,200 avg private episode value (APRA: avg PHI benefit $3,824 Dec 2024 + MBS)
const INDEMNITY_COST_PER_BED = 20000;          // VMIA 2025-26: $380.9M / ~16k VIC beds = $23.8k. A$20k conservative national average. Supplementary: Mello 2010, NPDB 2023, TDC 2025
const INDEMNITY_REDUCTION_PCT = 0.03;          // 3% reduction (modelled assumption; no direct AU evidence; conservative)
const COST_PER_EXCESS_BED_DAY = 3100;          // A$3,100 per diem (IHACPA long-stay outlier weights; validated)
const EXCESS_DAYS_PER_ADE = 2.0;               // ACSQHC midpoint (validated)
const PREVENTABLE_ADE_PER_100_ADMITS = 2.0;    // Runciman et al 2003; Lim et al 2022 systematic review (validated)
const DUPLICATE_TEST_RATE = 0.22;              // 22% (Banker et al 2024; RCPA guidelines; validated)
const PATHOLOGY_COST_PER_BED = 12000;          // A$12,000/bed pathology/imaging (AIHW hospital expenditure; direct costs)
const COMM_FAILURE_PCT_INCIDENTS = 0.35;       // 35% of incidents (ACSQHC: 24-60% range; 35% conservative midpoint)

// ── Legal & Compliance Constants (AU) ──
const AU_EDISCOVERY_CASES_PER_100_BEDS = 8;    // Lower than US (less litigious); medico-legal, coronial, complaints
const AU_EDISCOVERY_HRS_PER_CASE_BEFORE = 24;  // 3 days: searching across fragmented legacy systems
const AU_EDISCOVERY_HRS_PER_CASE_AFTER = 5;    // Single archive search
const AU_EDISCOVERY_HOURLY_RATE = 45;           // HIM / health information staff (AU rates)
const AU_CYBER_BREACH_AVG_COST = 4260000;       // A$4.26m avg Australian breach, all industries (IBM Cost of a Data Breach 2024); healthcare typically above average - conservative

// ── Readmission Constants (AU) ──
const AU_READMISSION_RATE = 0.10;               // ~10% 30-day all-cause unplanned readmission; Australian studies report 6.2-10.9% (VIC/SA linked-data studies, Aust Health Review). Context count only - dollar savings use the 0.6pp reduction below
const AU_READMIT_REDUCTION = 0.006;             // 0.6pp absolute reduction (Vest et al JAMIA 2019, conservative)
const AU_READMIT_COST = 11500;                  // A$11,500 avg readmission cost (IHACPA NWAU-derived)
const AU_READMIT_FRAGMENTATION_ATTRIBUTION = 0.30; // 30% attributable to information fragmentation

// ── Teaching Hospital Constants ──
const RESEARCH_SYSTEMS_PER_100_BEDS = 3.5;     // IRB, CTMS, biobank, research repos, registry systems
const RESEARCH_SYSTEM_AVG_COST = 180000;        // Avg annual cost of a research/academic system
const TEACHING_COMPLIANCE_COST_PER_BED = 650;   // Registrar training systems, procedural logging, AMC reporting
const TEACHING_OVERHEAD_PCT = 0.12;             // 12% additional system complexity for teaching workflows

// ── Network Consolidation Constants ──
const DUPLICATE_SYSTEM_RATE = 0.35;             // 35% of systems are duplicated across facilities post-M&A
const DUPLICATE_INFRA_COST_PER_FACILITY = 350000;

// ── Aged Care Constants ──
const AC_REVENUE_PER_PLACE = 160000;       // AN-ACC subsidy (~A$117k) + resident fees (~A$43k) = ~A$160k/yr
const AC_STAFF_PER_PLACE = 1.5;            // Headcount (not FTE) per place: 215 care-min/day mandate ≈ 0.72 direct-care FTE, grossed up for part-time fraction, leave cover and non-care staff. Yields staffing cost ≈72% of revenue, matching StewartBrown FY25 sector ratios
const AC_BLENDED_HOURLY = 42;              // AIN/PCW ~A$32, EN ~A$40, RN ~A$50, admin ~A$38; weighted to care workers
const AC_AGENCY_SPEND_PCT = 0.10;          // 10% of staffing budget typically on agency/casual
const AC_AGENCY_REDUCTION = 0.15;          // 15% reduction through better rostering integration
const AC_ANACC_UPLIFT = 0.03;             // 3% AN-ACC funding uplift from better clinical documentation
const AC_COMPLIANCE_FTE_PER_FACILITY = 0.5; // QI reporting, SIRS, Star Ratings, audit prep
const AC_COMPLIANCE_COST_PER_FTE = 65000;  // Annual cost of compliance admin staff
const AC_HARM_COST_PER_PLACE = 3000;       // Falls A$35k, pressure injuries A$10k, med incidents A$15k; blended ~A$3k/place/yr
const AC_FRAGMENTATION_ATTRIBUTION = 0.25; // 25% of avoidable harm attributable to information fragmentation
const AC_FUNDING_ATTRIBUTION = 0.30;       // 30% of AN-ACC uplift / agency efficiency attributable to system consolidation (contributing factor, not sole cause; consistent with readmission attribution)
const AC_PPH_RATE_PER_PLACE = 0.15;        // 15% of aged-care residents have a preventable hospital admission/yr (AIHW Australian Health Performance Framework; midpoint of ACSC + falls/fractures + UTI/dehydration data)
const AC_PPH_COST = 8000;                  // A$8,000 avg cost per preventable admission (AIHW IHACPA NWAU-derived; ACSC episode mid-range)
const AC_PPH_FRAGMENTATION_ATTRIBUTION = 0.30; // 30% attributable to information fragmentation (consistent with acute readmissions; RACF medication-reconciliation evidence)
const AC_FALL_FRACTURE_COST = 35000;       // AIHW injury hospitalisation data
const AC_PRESSURE_INJURY_COST = 10000;     // Extended treatment course
const AC_MED_INCIDENT_COST = 15000;        // Hospitalisation from medication incident
const AC_OCCUPANCY_DEFAULT = 0.92;         // Residential aged care occupancy ~90-95%

// ── NDIS Constants ──
const NDIS_REVENUE_PER_PARTICIPANT = 48000;  // NDIA Q4 2024-25: average annualised PAYMENTS per non-SIL participant ~A$45.9k (average plan budgets are higher: A$82.5k incl SIL). Conservative payments basis used
const NDIS_STAFF_PER_PARTICIPANT = 0.20;     // Mid-range: 100 staff per 500 participants
const NDIS_BLENDED_HOURLY = 42;              // Support workers ~A$36, coordinators ~A$48, therapy ~A$62; blended
const NDIS_CLAIMS_IMPROVEMENT = 0.05;        // 5% improvement in claims recovery from reduced rejections
const NDIS_UTILISATION_BASELINE = 0.70;      // Typical utilisation of staff hours
const NDIS_UTILISATION_UPLIFT = 0.04;        // 4% uplift through better rostering integration
const NDIS_COMPLIANCE_FTE_PER_100 = 0.3;     // FTE per 100 participants in compliance admin
const NDIS_COMPLIANCE_COST_PER_FTE = 60000;  // Annual cost of compliance admin staff
const NDIS_TURNOVER_RATE = 0.275;            // 27.5% annual turnover (mid-range of 25-30%)
const NDIS_TURNOVER_COST = 6500;             // A$5-8k per replacement (recruitment + training)
const NDIS_TURNOVER_REDUCTION = 0.10;        // 10% reduction in turnover through lower admin burden
const NDIS_STAFFING_COST_PCT = 0.815;        // 81.5% of revenue to staffing (NDIS Provider Outlook 2025) // Per-LHD/facility duplicate infrastructure (data centre, network, service desk, training)

// Provider type multipliers (modelled assumptions, clearly labelled)

const PROVIDER_PRESET_MAP = {
  rural_remote: "SMALL",
  regional: "TYPICAL",
  metropolitan: "LARGE",
  tertiary: "LARGE",
  state_network: "REGIONAL",
  statewide: "STATEWIDE",
  aged_care: "AC_MID",
  ndis_provider: "NDIS_MID",
};
const PROVIDER_MULTIPLIERS = {
  rural_remote:     { abf_pct: 0.80, private_pct: 0.05, complexity_boost: 0.7 },
  regional:         { abf_pct: 0.75, private_pct: 0.12, complexity_boost: 1.0 },
  metropolitan:     { abf_pct: 0.70, private_pct: 0.18, complexity_boost: 1.2 },
  tertiary:         { abf_pct: 0.65, private_pct: 0.25, complexity_boost: 1.5 },
  state_network:    { abf_pct: 0.72, private_pct: 0.15, complexity_boost: 1.3 },
  statewide:        { abf_pct: 0.70, private_pct: 0.12, complexity_boost: 1.5 },
  // Aged Care & NDIS
  aged_care:        { abf_pct: 0, private_pct: 0, complexity_boost: 1.0 },
  ndis_provider:    { abf_pct: 0, private_pct: 0, complexity_boost: 1.0 },
};

// ABF model multipliers
const REIMBURSE_MULTIPLIERS = {
  public:  { private_weight: 0.5, efficiency_weight: 1.2 },
  mixed:   { private_weight: 1.0, efficiency_weight: 1.0 },
  private: { private_weight: 1.5, efficiency_weight: 0.7 },
};
function calc(inp, mode, ov = {}, flagships = []) {
  const sc = SCENARIO[mode], cx = CX[inp.complexity_level], dq = DQ[inp.data_quality_level];
  // Scenario factor overrides - allow slider on the report to drive all three scenario factors
  const realisation = (ov.realisation != null) ? ov.realisation : sc.realisation;
  const decomPct = (ov.decom_pct != null) ? ov.decom_pct : sc.decom_pct;
  const safetyPct = (ov.safety != null) ? ov.safety : sc.safety;
  const isArchiveOnly = inp.journey === "HAVE_EPR";
  const sector = (inp._providerType || "") === "aged_care" ? "aged_care"
               : (inp._providerType || "") === "ndis_provider" ? "ndis" : "hospital";
  const isAgedCare = sector === "aged_care";
  const isNDIS = sector === "ndis";
  const ent = ov.enterprise != null ? ov.enterprise : inp.tiers.enterprise;
  const dep = ov.departmental != null ? ov.departmental : inp.tiers.departmental;
  const nic = ov.niche != null ? ov.niche : inp.tiers.niche;
  const tieredLegacy = ent + dep + nic;
  let entCost = ov.entCost != null ? ov.entCost : tierCost("enterprise", inp.bed_count, cx);
  let depCost = ov.depCost != null ? ov.depCost : tierCost("departmental", inp.bed_count, cx);
  let nicCost = ov.nicCost != null ? ov.nicCost : tierCost("niche", inp.bed_count, cx);
  // "I know my spend" mode: distribute the stated annual spend across tiers
  // with the web calculators' 5:2:1 per-system weighting, unless explicit
  // tier-cost overrides are present.
  if ((inp._knownSpend || 0) > 0 && ov.entCost == null && ov.depCost == null && ov.nicCost == null) {
    const wUnits = 5 * ent + 2 * dep + 1 * nic;
    if (wUnits > 0) {
      const unit = inp._knownSpend / wUnits;
      entCost = Math.round(unit * 5); depCost = Math.round(unit * 2); nicCost = Math.round(unit);
    }
  }
  const tieredEstate = ent * entCost + dep * depCost + nic * nicCost;
  // Flagships
  const flagshipTotal = flagships.reduce((s,f) => s + (f.cost || 0), 0); // All flagships affect estate cost
  const flagshipDecomSave = flagships.filter(f => f.retire).reduce((s,f) => s + (f.cost || 0), 0); // All retiring flagships contribute savings
  const flagshipCount = flagships.length; // All flagships are additive to tier count
  const flagshipRetireCount = flagships.filter(f => f.retire).length;
  const portfolioSystems = inp._portfolioSystems || 0;
  const legacy = tieredLegacy + flagshipCount + portfolioSystems;
  const totalEstate = tieredEstate + flagshipTotal + (inp._portfolioCost ?? 0);
  const blendedCost = legacy > 0 ? Math.round(totalEstate / legacy) : 0;
  const rawDecom = tieredLegacy * inp.decom_retire_rate * decomPct;
  const decom = Math.min(Math.round(rawDecom), tieredLegacy) + flagshipRetireCount + (Math.round(portfolioSystems * inp.decom_retire_rate * decomPct) || 0);
  const decomFrac = tieredLegacy > 0 ? Math.min(Math.round(rawDecom), tieredLegacy) / tieredLegacy : 0;
  const entDecom = Math.min(Math.round(ent * decomFrac), ent);
  const depDecom = Math.min(Math.round(dep * decomFrac), dep);
  const nicDecom = clamp(Math.min(Math.round(rawDecom), tieredLegacy) - entDecom - depDecom, 0, nic);
  // Flagship/portfolio retirement factors are capped at 100%: the Stretch
  // scenario's 1.10x models retiring MORE systems than planned, but a single
  // named contract can never save more than its own annual value.
  const portfolioDecomSave = Math.round((inp._portfolioCost ?? 0) * Math.min(1, inp.decom_retire_rate * decomPct));
  const portfolioDecom = Math.round(portfolioSystems * Math.min(1, inp.decom_retire_rate * decomPct));
  const decomSave = entDecom * entCost + depDecom * depCost + nicDecom * nicCost + Math.round(flagshipDecomSave * Math.min(1, decomPct)) + portfolioDecomSave;
  const corpPerOrg = Math.min(100, Math.round(CORPORATE_STAFF_BASE + (inp.bed_count / Math.max(1, inp.org_count)) * CORPORATE_STAFF_PER_BED));
  const staffPerUnit = isAgedCare ? AC_STAFF_PER_PLACE : isNDIS ? NDIS_STAFF_PER_PARTICIPANT : STAFF_PER_BED;
  const hourlyRate = isAgedCare ? AC_BLENDED_HOURLY : isNDIS ? NDIS_BLENDED_HOURLY : BLENDED_HOURLY_RATE;
  const totalStaff = Math.round(inp.bed_count * staffPerUnit + (sector === "hospital" ? inp.org_count * corpPerOrg : 0) + (inp._portfolioStaff ?? 0));
  const clinicians = ov.clinicians != null ? ov.clinicians : Math.round(totalStaff * ACTIVE_USER_PCT);
  const systemsPerUser = Math.max(2, Math.round(legacy * SYSTEM_EXPOSURE_PCT));
  const switchPenalty = Math.max(0, systemsPerUser - 1) * SWITCH_PENALTY_PER_SYSTEM;
  // Base minutes wasted per clinician per week navigating legacy systems
  // HAVE_EPR (8 mins): clinicians still look up historical data in unarchived systems,
  //   re-key results, and context-switch. Lower than EVALUATING because the main
  //   workflow is already on the EMR. Evidence: Westbrook et al 2020 time-motion studies.
  // EVALUATING (12 mins): no single EMR, all clinical work spans multiple systems.
  const baseMin = isArchiveOnly ? 8 : 12;
  const cappedPenalty = Math.min(switchPenalty, 4.0); // Cap: prevents >60 min/wk at extreme system counts
  const complexityBoost = inp._complexityBoost ?? 1.0;
  const minsWasted = ov.minsWasted != null ? ov.minsWasted : Math.round(baseMin * dq * cx * complexityBoost * (1 + cappedPenalty));
  const residual = isArchiveOnly ? 1 : 2;
  const hrsSaved = Math.round((clinicians * Math.max(0, minsWasted - residual) * WORKING_WEEKS) / 60);
  const timeSave = Math.round(hrsSaved * hourlyRate * realisation);
  const ticketsBaselineMonthly = ov.ticketsBaseline != null ? ov.ticketsBaseline : Math.round(legacy * TICKETS_PER_SYSTEM * dq);
  const ticketsAfter = Math.min(Math.round((legacy - decom) * TICKETS_PER_SYSTEM * dq * SURVIVING_SYSTEM_TICKET_FACTOR), ticketsBaselineMonthly);
  const ticketsReductionPct = Math.round((ticketsBaselineMonthly - ticketsAfter) / Math.max(1, ticketsBaselineMonthly) * 100);
  const sarSystemsCapped = Math.min(legacy, 20); // Records requests search core clinical systems, not every niche tool
  const sarDaysBefore = ov.sarDaysBefore != null ? ov.sarDaysBefore : Math.round((SAR_BASE_DAYS + sarSystemsCapped * SAR_DAYS_PER_SYSTEM_BEFORE * dq) * 10) / 10;
  const sarDaysAfter = Math.min(Math.round((SAR_BASE_DAYS + Math.min(legacy - decom, 20) * SAR_DAYS_PER_SYSTEM_AFTER) * 10) / 10, sarDaysBefore);
  const sarReductionPct = Math.round((sarDaysBefore - sarDaysAfter) / Math.max(1, sarDaysBefore) * 100);
  const hasClinicalScope = legacy >= 3 && inp.bed_count > 0;
  let safetyMedErrorsAvoided=0, safetyPatientsProtected=0, safetyBedDaysAvoided=0, safetyMedErrorsBaseline=0;
  if (hasClinicalScope) {
    const frag = 0.6 + Math.min(legacy, 20) / 20 * 0.6;
    safetyMedErrorsBaseline = Math.round(inp.bed_count * MED_ERRORS_PER_BED * frag * dq);
    const harmedBl = Math.round(inp.bed_count * PATIENTS_HARMED_PER_BED * FRAGMENTATION_ATTRIBUTION * frag * dq);
    const bedDaysBl = Math.round(inp.bed_count * EXCESS_BED_DAYS_PER_BED * FRAGMENTATION_ATTRIBUTION * frag * dq);
    safetyMedErrorsAvoided = Math.round(safetyMedErrorsBaseline * safetyPct);
    safetyPatientsProtected = Math.round(harmedBl * safetyPct);
    safetyBedDaysAvoided = Math.round(bedDaysBl * safetyPct);
  }
  // ── Sector-Specific Impact ──
  let occupancy=0, admissionsPerYear=0, estAnnualRevenueCalc=0, estMedicareDrgRevenue=0, medicareDrg=0;
  let abfEfficiencyGain=0, hrrpExposure=0, hrrpReduction=0, hacExposure=0, hacReduction=0;
  let vbpPool=0, vbpImprovement=0, denialBaseline=0, denialRecovery=0;
  let privatePct=0, privateLeakage=0, privateRevRecovery=0;
  let malpracticePremium=0, malpracticeReduction=0;
  let preventableADEs=0, excessDaysAvoided=0, excessDayCostAvoided=0;
  let estLabSpend=0, duplicateWaste=0, duplicateReduction=0;
  // Sector-specific
  let acAnaccUplift=0, acAgencyReduction=0, acComplianceSaving=0, acHarmAvoidance=0, acPPHAvoidance=0;
  let ndisClaimsRecovery=0, ndisUtilisationUplift=0, ndisComplianceSaving=0, ndisRetentionSaving=0;

  if (isAgedCare) {
    // AN-ACC funding optimisation. Both funding lines carry the 30%
    // fragmentation attribution: system consolidation is a contributing
    // factor to documentation-driven uplift and rostering efficiency, not
    // the sole cause — consistent with the attribution applied to the
    // quality and readmission lines.
    const totalRevenue = inp.bed_count * AC_REVENUE_PER_PLACE;
    acAnaccUplift = Math.round(totalRevenue * 0.45 * AC_ANACC_UPLIFT * AC_FUNDING_ATTRIBUTION * decomPct);
    // Agency staff cost reduction
    const acStaffCost = inp.bed_count * AC_STAFF_PER_PLACE * AC_BLENDED_HOURLY * 1824;
    acAgencyReduction = Math.round(acStaffCost * AC_AGENCY_SPEND_PCT * AC_AGENCY_REDUCTION * AC_FUNDING_ATTRIBUTION * decomPct);
    // Compliance efficiency
    acComplianceSaving = Math.round(inp.org_count * AC_COMPLIANCE_FTE_PER_FACILITY * AC_COMPLIANCE_COST_PER_FTE * decomPct * 0.5);
    // Avoidable cost of harm
    acHarmAvoidance = Math.round(inp.bed_count * AC_HARM_COST_PER_PLACE * AC_FRAGMENTATION_ATTRIBUTION * safetyPct);
    // Preventable hospitalisations from aged care (UTIs, dehydration, falls without injury, ACSCs)
    acPPHAvoidance = Math.round(inp.bed_count * AC_PPH_RATE_PER_PLACE * AC_PPH_COST * AC_PPH_FRAGMENTATION_ATTRIBUTION * safetyPct);

  } else if (isNDIS) {
    // Claims accuracy
    const ndisRevenue = inp.bed_count * NDIS_REVENUE_PER_PARTICIPANT;
    // 8% of NDIS claims are rejected; 5% improvement in rejection rate through better documentation
    ndisClaimsRecovery = Math.round(ndisRevenue * 0.08 * NDIS_CLAIMS_IMPROVEMENT * decomPct);
    // Utilisation improvement
    const ndisStaff = Math.round(inp.bed_count * NDIS_STAFF_PER_PARTICIPANT);
    const baseHrs = ndisStaff * 1824 * NDIS_UTILISATION_BASELINE;
    const improvedHrs = ndisStaff * 1824 * (NDIS_UTILISATION_BASELINE + NDIS_UTILISATION_UPLIFT * decomPct);
    ndisUtilisationUplift = Math.round((improvedHrs - baseHrs) * NDIS_BLENDED_HOURLY);
    // Compliance cost reduction
    ndisComplianceSaving = Math.round((inp.bed_count / 100) * NDIS_COMPLIANCE_FTE_PER_100 * NDIS_COMPLIANCE_COST_PER_FTE * decomPct * 0.5);
    // Staff retention saving
    const ndisTurnoverCost = ndisStaff * NDIS_TURNOVER_RATE * NDIS_TURNOVER_COST;
    ndisRetentionSaving = Math.round(ndisTurnoverCost * NDIS_TURNOVER_REDUCTION * decomPct);

  } else {
    // Hospital sector - original AU calculations
    occupancy = inp._occupancy ?? DEFAULT_OCCUPANCY;
    // ABF-funded share of admitted revenue varies by provider profile
    // (rural 80% ... tertiary 65%); 0.70 retained as the fallback.
    const abfShare = inp._abfPct || 0.70;
    // If the user entered their actual ABF revenue, derive admission volume
    // from it (revenue is a better activity proxy than beds); otherwise
    // estimate from beds x turnover x occupancy. This makes the fine-tune
    // "ABF revenue (optional)" input genuinely drive the admissions-based
    // lines (private revenue recovery, preventable ADEs, readmissions).
    admissionsPerYear = inp._medicareDrgRevenue > 0
      ? Math.round(inp._medicareDrgRevenue / (abfShare * AU_NWAU_PER_SEPARATION * AU_NWAU_PRICE))
      : Math.round(inp.bed_count * (365 / AU_AVG_ALOS) * occupancy);
    estAnnualRevenueCalc = admissionsPerYear * AU_NWAU_PER_SEPARATION * AU_NWAU_PRICE;
    estMedicareDrgRevenue = Math.round(estAnnualRevenueCalc * abfShare);
    medicareDrg = inp._medicareDrgRevenue > 0 ? inp._medicareDrgRevenue : estMedicareDrgRevenue;
    // Consolidation/admin efficiency is claimed on the SURVIVING estate only:
    // the retired share is already fully counted in decomSave, so the
    // combined estate-derived claims can never exceed the estate's annual
    // cost. Funding-model efficiency weight (public 1.2 / mixed 1.0 /
    // private 0.7) applies here.
    abfEfficiencyGain = Math.round(Math.max(0, totalEstate - decomSave) * 0.15 * decomPct * (inp._efficiencyWeight ?? 1.0));
    privatePct = inp._privatePct ?? 0.15;
    privateLeakage = Math.round(admissionsPerYear * privatePct * PRIVATE_PATIENT_LEAKAGE * PRIVATE_EPISODE_AVG_VALUE);
    privateRevRecovery = Math.round(privateLeakage * 0.30 * decomPct * (inp._privateWeight ?? 1.0));
    malpracticePremium = inp.bed_count * INDEMNITY_COST_PER_BED;
    malpracticeReduction = Math.round(malpracticePremium * INDEMNITY_REDUCTION_PCT * safetyPct);
    preventableADEs = Math.round(admissionsPerYear / 100 * PREVENTABLE_ADE_PER_100_ADMITS);
    excessDaysAvoided = hasClinicalScope ? safetyBedDaysAvoided : Math.round(preventableADEs * EXCESS_DAYS_PER_ADE * safetyPct);
    excessDayCostAvoided = Math.round(excessDaysAvoided * COST_PER_EXCESS_BED_DAY);
    estLabSpend = inp.bed_count * PATHOLOGY_COST_PER_BED;
    duplicateWaste = estLabSpend * DUPLICATE_TEST_RATE;
    duplicateReduction = Math.round(duplicateWaste * 0.50 * decomPct);
  }

  // ── Teaching Hospital Module ──
  const isAcademic = inp._providerType === "tertiary";
  // Research system count is user-overridable (pencil edit on the academic
  // card) — it is modelled from bed count, not entered in the systems step,
  // so it must be visible and correctable.
  const researchSystems = isAcademic ? (ov.researchSystems != null ? ov.researchSystems : Math.round(inp.bed_count / 100 * RESEARCH_SYSTEMS_PER_100_BEDS)) : 0;
  const researchSystemCost = researchSystems * RESEARCH_SYSTEM_AVG_COST;
  const researchDecomSave = Math.round(researchSystemCost * 0.60 * Math.min(1, decomPct)); // 60% retirable; capped - can't save more than the systems cost
  const teachingComplianceCost = isAcademic ? Math.round(inp.bed_count * TEACHING_COMPLIANCE_COST_PER_BED) : 0;
  const teachingEfficiency = Math.round(teachingComplianceCost * 0.25 * decomPct); // 25% efficiency gain
  // Surviving-estate basis, same reasoning as abfEfficiencyGain: the retired
  // share of the estate is already fully claimed in decomSave.
  const teachingOverhead = isAcademic ? Math.round(Math.max(0, totalEstate - decomSave) * TEACHING_OVERHEAD_PCT * 0.30 * decomPct) : 0; // 30% of 12% extra complexity

  // ── Network Consolidation Module ──
  const isMultiHospital = inp._providerType === "state_network" || inp._providerType === "statewide";
  const survivingSystems = legacy - decom;
  const duplicateSystems = isMultiHospital ? Math.round(survivingSystems * DUPLICATE_SYSTEM_RATE) : 0;
  const duplicateSystemCost = isMultiHospital ? Math.round(duplicateSystems * depCost) : 0; // Use dep tier cost - duplicates are departmental/niche, not enterprise
  const duplicateElimination = Math.round(duplicateSystemCost * decomPct);
  const lhdCount = inp._lhdCount || Math.max(1, Math.round(inp.org_count / 15)); // LHDs/HHSs, not individual hospitals
  const duplicateInfraCost = isMultiHospital ? lhdCount * DUPLICATE_INFRA_COST_PER_FACILITY : 0;
  const infraConsolidation = Math.round(duplicateInfraCost * 0.60 * decomPct); // 60% consolidatable
  // standardisationSave removed - identical formula to abfEfficiencyGain (both totalEstate*15%), was double-counting
  const standardisationSave = 0;

  // ── Legal & Compliance ──
  const litigationCases = isAgedCare || isNDIS ? 0 : Math.round(inp.bed_count / 100 * AU_EDISCOVERY_CASES_PER_100_BEDS);
  const ediscoverySaveBefore = litigationCases * AU_EDISCOVERY_HRS_PER_CASE_BEFORE * AU_EDISCOVERY_HOURLY_RATE;
  const ediscoverySaveAfter = litigationCases * AU_EDISCOVERY_HRS_PER_CASE_AFTER * AU_EDISCOVERY_HOURLY_RATE;
  const ediscoverySaving = Math.round((ediscoverySaveBefore - ediscoverySaveAfter) * decomPct);
  const cyberSystemsRetired = Math.max(0, decom - 1); // -1 for the new archive system

  // ── Readmission cost avoidance (hospital sector only) ──
  const auReadmissions = isAgedCare || isNDIS ? 0 : Math.round(admissionsPerYear * AU_READMISSION_RATE);
  const auReadmissionsAvoided = Math.round(admissionsPerYear * AU_READMIT_REDUCTION * AU_READMIT_FRAGMENTATION_ATTRIBUTION * safetyPct);
  const auReadmissionCostAvoidance = Math.round(auReadmissionsAvoided * AU_READMIT_COST);

  // Module totals
  const academicSavings = researchDecomSave + teachingEfficiency + teachingOverhead;
  const mergeSavings = duplicateElimination + infraConsolidation + standardisationSave;

  // Total reimbursement impact
  const reimbursementImpact = isAgedCare ? (acAnaccUplift + acAgencyReduction + acComplianceSaving)
                           : isNDIS ? (ndisClaimsRecovery + ndisUtilisationUplift + ndisComplianceSaving + ndisRetentionSaving)
                           : abfEfficiencyGain + privateRevRecovery;
  const qualitySavings = isAgedCare ? (acHarmAvoidance + acPPHAvoidance)
                     : isNDIS ? 0
                     : malpracticeReduction + excessDayCostAvoided + duplicateReduction + ediscoverySaving + auReadmissionCostAvoidance;

  const annual = decomSave + timeSave;
  const annualWithReimbursement = annual + reimbursementImpact + qualitySavings + academicSavings + mergeSavings;
  // Phased ramp: configurable 3-year or 5-year
  const rampN = inp._rampYears || 3;
  const rampPcts = rampN === 5
    ? [0.20, 0.40, 0.60, 0.80, 1.00]
    : [0.40, 0.80, 1.00];
  const y1Pct = rampPcts[0], y2Pct = rampPcts[1], y3Pct = rampPcts[2] || 1.0;
  const yrValues = rampPcts.map(p => Math.round(annual * p));
  const yr1 = yrValues[0], yr2 = yrValues[1], yr3 = yrValues[2] || 0;
  const total3 = yrValues.reduce((a,b) => a+b, 0);
  // Canonical alias - prefer totalRamp going forward; total3 kept for backward-compat
  const totalRamp = total3;
  const yrRValues = rampPcts.map(p => Math.round(annualWithReimbursement * p));
  const yr1R = yrRValues[0], yr2R = yrRValues[1], yr3R = yrRValues[2] || 0;
  const total3WithReimbursement = yrRValues.reduce((a,b) => a+b, 0);
  const totalRampWithReimbursement = total3WithReimbursement;
  return {
    legacy, ent, dep, nic, entCost, depCost, nicCost, blendedCost, totalEstate,
    decom, entDecom, depDecom, nicDecom, decomSave,
    totalStaff, clinicians, systemsPerUser, minsWasted, hrsSaved, timeSave, baseMin,
    ticketsBaselineMonthly, ticketsAfter, ticketsReductionPct,
    sarDaysBefore, sarDaysAfter, sarReductionPct,
    hasClinicalScope, safetyMedErrorsAvoided, safetyPatientsProtected,
    safetyBedDaysAvoided, safetyMedErrorsBaseline,
    annual, total3, totalRamp, yr1, yr2, yr3, y1Pct, y2Pct, y3Pct, rampN, rampPcts, yrValues, yrRValues, realisation, scenarioDefaultRealisation: sc.realisation, decomFactor: decomPct, safetyFactor: safetyPct, isArchiveOnly,
    flagshipTotal, flagshipDecomSave: Math.round(flagshipDecomSave * Math.min(1, decomPct)),
    flagshipCount, flagshipRetireCount,
    // ABF efficiency and compliance
    admissionsPerYear, estAnnualRevenueCalc, occupancy, medicareDrg,
    abfEfficiencyGain, privateRevRecovery,
    hrrpExposure, hrrpReduction, hacExposure, hacReduction,
    vbpPool, vbpImprovement, denialBaseline, denialRecovery,
    malpracticePremium, malpracticeReduction,
    preventableADEs, excessDaysAvoided, excessDayCostAvoided,
    duplicateWaste, duplicateReduction,
    reimbursementImpact, qualitySavings,
    // Academic module
    isAcademic, researchSystems, researchSystemCost, researchDecomSave,
    teachingComplianceCost, teachingEfficiency, teachingOverhead, academicSavings,
    // M&A module
    isMultiHospital, duplicateSystems, duplicateSystemCost, duplicateElimination,
    duplicateInfraCost, infraConsolidation, standardisationSave, mergeSavings,
    litigationCases, ediscoverySaving, cyberSystemsRetired,
    auReadmissions, auReadmissionsAvoided, auReadmissionCostAvoidance,
    sector, isAgedCare, isNDIS,
    acAnaccUplift, acAgencyReduction, acComplianceSaving, acHarmAvoidance, acPPHAvoidance,
    ndisClaimsRecovery, ndisUtilisationUplift, ndisComplianceSaving, ndisRetentionSaving,
    annualWithReimbursement, total3WithReimbursement, totalRampWithReimbursement, yr1R, yr2R, yr3R,
    // Phase 1: Benefit categorisation
    fteEquivalent: Math.round(hrsSaved * realisation / 1824 * 10) / 10, // Realised FTE: hrs × realisation / 1,824 (38hr × 48wk)
    cashable: decomSave + abfEfficiencyGain + privateRevRecovery + duplicateElimination + infraConsolidation
      + acAnaccUplift + acAgencyReduction + ndisClaimsRecovery + ndisUtilisationUplift + ndisRetentionSaving,
    nonCashable: timeSave + acComplianceSaving + ndisComplianceSaving + (isAcademic ? teachingEfficiency + teachingOverhead + researchDecomSave : 0),
    costAvoidance: malpracticeReduction + excessDayCostAvoided + duplicateReduction + ediscoverySaving + auReadmissionCostAvoidance
      + acHarmAvoidance + acPPHAvoidance,
    // ── Compatibility fields for the shared kiosk results UI ──
    realization: realisation,
    readmissionsAvoided: auReadmissionsAvoided,
    readmissionCostAvoidance: auReadmissionCostAvoidance,
    yr5ValsR: RAMP5.map(p => Math.round(annualWithReimbursement * p)),
    total5WithReimbursement: RAMP5.reduce((s, p) => s + Math.round(annualWithReimbursement * p), 0),
  };
}
export { calc, SCENARIO, CX, DQ, tierCost, PROVIDER_MULTIPLIERS, REIMBURSE_MULTIPLIERS };

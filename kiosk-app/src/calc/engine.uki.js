// UK & Ireland engine - ported verbatim from web/uki/roi-calculator.html
// (constants + calc()). Field names match the US engine where concepts are
// shared, plus compatibility fields (end of the return object) so the shared
// results UI renders either market. Numeric parity with the web/uki
// calculator is verified by the comparison harness (see repo history).

const RAMP5 = [0.20, 0.40, 0.60, 0.80, 1.00];

// ── Model constants ──
const STAFF_PER_BED = 2.8;
const CORPORATE_STAFF_BASE = 20;       // Base admin/corporate staff per organisation
const CORPORATE_STAFF_PER_BED = 0.12;  // Scales with size, caps at ~80 for large Trusts
const BLENDED_HOURLY_RATE = 55;
const WORKING_WEEKS = 48;
const TICKETS_PER_SYSTEM = 2.5;
const SWITCH_PENALTY_PER_SYSTEM = 0.04;  // Bartek et al JIMI 2023: 3% switch cost (beta=0.03); 4% conservative
const SURVIVING_SYSTEM_TICKET_FACTOR = 0.6;
const SAR_BASE_DAYS = 1.5;
const SAR_DAYS_PER_SYSTEM_BEFORE = 0.4;
const SAR_DAYS_PER_SYSTEM_AFTER = 0.15;

// Clinical engagement factors
const ACTIVE_USER_PCT = 0.65;           // Sinsky et al 2016; KLAS Arch Collaborative (500k+ clinicians). 65% conservative
const SYSTEM_EXPOSURE_PCT = 0.35;       // Modeled assumption: role-based access patterns
const MED_ERRORS_PER_BED = 18;          // Camacho et al, BMJ Qual Saf 2024 (10.1136/bmjqs-2023-016675): transition medication errors per 100k admissions, scaled to per-bed
const PATIENTS_HARMED_PER_BED = 0.315;  // Camacho et al 2024: patient episodes experiencing >=1 medication error at a transition, per-bed equivalent
const EXCESS_BED_DAYS_PER_BED = 0.365;  // Camacho et al 2024: excess bed days from harm due to transition errors, per-bed equivalent
// ── Quality / safety financial constants ──
const COST_PER_EXCESS_BED_DAY = 400;          // £400/day NHS Reference Costs (general acute, conservative blended)
const INDEMNITY_COST_PER_BED = 7500;          // £7,500/bed clinical negligence exposure attributable to fragmented information
                                              // Source: NHS Resolution £3.6bn settlements (NAO Oct 2025) / ~140k acute beds × 30% communication failure attribution (CRICO 2016)
const INDEMNITY_REDUCTION_PCT = 0.05;         // 5% reduction from clinical archive / consolidated EPR (conservative)
const COST_PER_DUPLICATE_TEST = 35;           // £35/test - NHS pathology blended (lab + imaging average)
const DUPLICATE_TEST_RATE = 0.18;             // 18% of tests potentially duplicate when records fragmented (Bates et al)
const TESTS_PER_BED_PER_YEAR = 22;            // NHS Reference Costs: pathology/imaging tests per bed/year baseline



const SCENARIO = {
  CONSERVATIVE: { decom_pct: 0.85, realisation: 0.20, safety: 0.15 },
  EXPECTED:     { decom_pct: 1.00, realisation: 0.30, safety: 0.25 },
  STRETCH:      { decom_pct: 1.10, realisation: 0.40, safety: 0.35 },
};
const CX = { LOW: 0.7, TYPICAL: 1.0, HIGH: 1.45 };
const DQ = { CLEAN: 0.75, MIXED: 1.0, POOR: 1.4 };

function tierCost(tier, beds, cx) {
  const base = tier === "enterprise" ? 300000 : tier === "departmental" ? 75000 : 14000;
  const perBed = tier === "enterprise" ? 700 : tier === "departmental" ? 160 : 20;
  return Math.round(((base + beds * perBed) * cx) / 1000) * 1000;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }


export function calc(inp, mode, ov = {}, flagships = []) {
  const sc = SCENARIO[mode], cx = CX[inp.complexity_level], dq = DQ[inp.data_quality_level];
  // Scenario factor overrides - allow slider on the report to drive all three scenario factors
  const realisation = (ov.realisation != null) ? ov.realisation : sc.realisation;
  const decomPct = (ov.decom_pct != null) ? ov.decom_pct : sc.decom_pct;
  const safetyPct = (ov.safety != null) ? ov.safety : sc.safety;
  const isArchiveOnly = inp.journey === "HAVE_EPR";
  const ent = ov.enterprise != null ? ov.enterprise : inp.tiers.enterprise;
  const dep = ov.departmental != null ? ov.departmental : inp.tiers.departmental;
  const nic = ov.niche != null ? ov.niche : inp.tiers.niche;
  const tieredLegacy = ent + dep + nic;
  const entCost = ov.entCost != null ? ov.entCost : tierCost("enterprise", inp.bed_count, cx);
  const depCost = ov.depCost != null ? ov.depCost : tierCost("departmental", inp.bed_count, cx);
  const nicCost = ov.nicCost != null ? ov.nicCost : tierCost("niche", inp.bed_count, cx);
  const tieredEstate = ent * entCost + dep * depCost + nic * nicCost;
  // Flagships
  const flagshipTotal = flagships.reduce((s,f) => s + (f.cost || 0), 0);
  const flagshipDecomSave = flagships.filter(f => f.retire).reduce((s,f) => s + (f.cost || 0), 0);
  const flagshipCount = flagships.length;
  const flagshipRetireCount = flagships.filter(f => f.retire).length;
  const legacy = tieredLegacy + flagshipCount;
  const totalEstate = tieredEstate + flagshipTotal;
  const blendedCost = legacy > 0 ? Math.round(totalEstate / legacy) : 0;
  const rawDecom = tieredLegacy * inp.decom_retire_rate * decomPct;
  const decom = Math.min(Math.round(rawDecom), tieredLegacy) + flagshipRetireCount;
  const decomFrac = tieredLegacy > 0 ? Math.min(Math.round(rawDecom), tieredLegacy) / tieredLegacy : 0;
  const entDecom = Math.min(Math.round(ent * decomFrac), ent);
  const depDecom = Math.min(Math.round(dep * decomFrac), dep);
  const nicDecom = clamp(Math.min(Math.round(rawDecom), tieredLegacy) - entDecom - depDecom, 0, nic);
  const decomSave = entDecom * entCost + depDecom * depCost + nicDecom * nicCost + Math.round(flagshipDecomSave * decomPct);
  const corpPerOrg = Math.min(80, Math.round(CORPORATE_STAFF_BASE + (inp.bed_count / Math.max(1, inp.org_count)) * CORPORATE_STAFF_PER_BED));
  const totalStaff = Math.round(inp.bed_count * STAFF_PER_BED + inp.org_count * corpPerOrg);
  const clinicians = ov.clinicians != null ? ov.clinicians : Math.round(totalStaff * ACTIVE_USER_PCT);
  const systemsPerUser = Math.max(2, Math.round(legacy * SYSTEM_EXPOSURE_PCT));
  const switchPenalty = Math.min(Math.max(0, systemsPerUser - 1) * SWITCH_PENALTY_PER_SYSTEM, 4.0);
  const baseMin = isArchiveOnly ? 5 : 12;
  const minsWasted = ov.minsWasted != null ? ov.minsWasted : Math.round(baseMin * dq * cx * (1 + switchPenalty));
  const residual = isArchiveOnly ? 1 : 2;
  const hrsSaved = Math.round((clinicians * Math.max(0, minsWasted - residual) * WORKING_WEEKS) / 60);
  const timeSave = Math.round(hrsSaved * BLENDED_HOURLY_RATE * realisation);
  const ticketsBaselineMonthly = ov.ticketsBaseline != null ? ov.ticketsBaseline : Math.round(legacy * TICKETS_PER_SYSTEM * dq);
  const ticketsAfter = Math.min(Math.round((legacy - decom) * TICKETS_PER_SYSTEM * dq * SURVIVING_SYSTEM_TICKET_FACTOR), ticketsBaselineMonthly);
  const ticketsReductionPct = Math.round((ticketsBaselineMonthly - ticketsAfter) / Math.max(1, ticketsBaselineMonthly) * 100);
  const sarDaysBefore = ov.sarDaysBefore != null ? ov.sarDaysBefore : Math.round((SAR_BASE_DAYS + legacy * SAR_DAYS_PER_SYSTEM_BEFORE * dq) * 10) / 10;
  const sarDaysAfter = Math.min(Math.round((SAR_BASE_DAYS + (legacy - decom) * SAR_DAYS_PER_SYSTEM_AFTER) * 10) / 10, sarDaysBefore);
  const sarReductionPct = Math.round((sarDaysBefore - sarDaysAfter) / Math.max(1, sarDaysBefore) * 100);
  const hasClinicalScope = legacy >= 3 && inp.bed_count > 0;
  let safetyMedErrorsAvoided=0, safetyPatientsProtected=0, safetyBedDaysAvoided=0, safetyMedErrorsBaseline=0, safetyPatientsHarmedBaseline=0, safetyBedDaysBaseline=0;
  if (hasClinicalScope) {
    const frag = 0.6 + Math.min(legacy, 20) / 20 * 0.6;
    safetyMedErrorsBaseline = Math.round(inp.bed_count * MED_ERRORS_PER_BED * frag * dq);
    safetyPatientsHarmedBaseline = Math.round(inp.bed_count * PATIENTS_HARMED_PER_BED * frag * dq);
    safetyBedDaysBaseline = Math.round(inp.bed_count * EXCESS_BED_DAYS_PER_BED * frag * dq);
    safetyMedErrorsAvoided = Math.round(safetyMedErrorsBaseline * safetyPct);
    safetyPatientsProtected = Math.round(safetyPatientsHarmedBaseline * safetyPct);
    safetyBedDaysAvoided = Math.round(safetyBedDaysBaseline * safetyPct);
  }
  // Quality / safety financial value (only when clinical scope present)
  let excessDayCostAvoided = 0, malpracticeReduction = 0, duplicateTestSaving = 0;
  if (hasClinicalScope) {
    excessDayCostAvoided = Math.round(safetyBedDaysAvoided * COST_PER_EXCESS_BED_DAY);
    malpracticeReduction = Math.round(inp.bed_count * INDEMNITY_COST_PER_BED * INDEMNITY_REDUCTION_PCT * safetyPct);
    duplicateTestSaving = Math.round(inp.bed_count * TESTS_PER_BED_PER_YEAR * DUPLICATE_TEST_RATE * COST_PER_DUPLICATE_TEST * safetyPct);
  }
  const qualitySavings = excessDayCostAvoided + malpracticeReduction + duplicateTestSaving;

  const annual = decomSave + timeSave + qualitySavings;
  // Phased ramp: 3yr [40,80,100] or 5yr [20,40,60,80,100]
  const rampYears = inp._rampYears || 3;
  const rampPcts = rampYears === 5 ? [0.20, 0.40, 0.60, 0.80, 1.00] : [0.40, 0.80, 1.00];
  const yrValues = rampPcts.map(p => Math.round(annual * p));
  const totalRamp = yrValues.reduce((a, b) => a + b, 0);
  // Backwards compatibility for existing references
  const y1Pct = rampPcts[0], y2Pct = rampPcts[1] || 0, y3Pct = rampPcts[2] || 0;
  const yr1 = yrValues[0], yr2 = yrValues[1] || 0, yr3 = yrValues[2] || 0;
  const total3 = totalRamp;
  return {
    legacy, ent, dep, nic, entCost, depCost, nicCost, blendedCost, totalEstate,
    decom, entDecom, depDecom, nicDecom, decomSave,
    totalStaff, clinicians, systemsPerUser, minsWasted, hrsSaved, timeSave, baseMin,
    ticketsBaselineMonthly, ticketsAfter, ticketsReductionPct,
    sarDaysBefore, sarDaysAfter, sarReductionPct,
    hasClinicalScope, safetyMedErrorsAvoided, safetyPatientsProtected,
    safetyBedDaysAvoided, safetyMedErrorsBaseline, safetyPatientsHarmedBaseline, safetyBedDaysBaseline,
    excessDayCostAvoided, malpracticeReduction, duplicateTestSaving, qualitySavings,
    annual, total3, totalRamp, rampYears, rampPcts, yrValues, yr1, yr2, yr3, y1Pct, y2Pct, y3Pct, realisation, scenarioDefaultRealisation: sc.realisation, decomFactor: decomPct, safetyFactor: safetyPct, isArchiveOnly,
    fteEquivalent: Math.round(hrsSaved * realisation / 1820 * 10) / 10,  // NHS FTE = 1820 hrs (8.4 hrs/day x 5 days x 52 weeks - leave)
    flagshipTotal, flagshipDecomSave: Math.round(flagshipDecomSave * decomPct),
    flagshipCount, flagshipRetireCount,
    // ── Compatibility fields for the shared kiosk results UI (US engine shape).
    // UKI has no reimbursement/academic/network modules; annual IS the total.
    realization: realisation,
    annualWithReimbursement: annual,
    reimbursementImpact: 0, academicSavings: 0, mergeSavings: 0, duplicateSystems: 0,
    yr1R: yrValues[0], yr2R: yrValues[1] || 0, yr3R: yrValues[2] || 0,
    total3WithReimbursement: totalRamp,
    yr5ValsR: RAMP5.map(p => Math.round(annual * p)),
    total5WithReimbursement: RAMP5.reduce((s, p) => s + Math.round(annual * p), 0),
  };
}

export { SCENARIO, CX, DQ, tierCost };

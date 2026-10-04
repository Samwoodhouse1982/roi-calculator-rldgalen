import React from 'react';
import { C } from '../theme';
import { EUR_PER_GBP } from '../calc/profiles.uki';

// Results-page methodology copy for the UKI touchscreen's non-NHS audience
// profiles (calc/profiles.uki.js). The NHS profile keeps the original copy
// in ResultsPage.jsx. Same structure and evidence, but every money figure
// comes from the profile, the sources say how the NHS benchmarks are used,
// and clinical negligence is explained rather than counted.
export function profileResultsCopy(p, r, { fmtK, fmtNum }) {
  const f = p.figures, s = f.costScale;
  const euro = s !== 1;
  const m = n => fmtK(Math.round(n));
  const rate = String(EUR_PER_GBP);
  // How the NHS benchmarks are used for this profile, in a few forms.
  const basis = euro ? `UK NHS benchmarks converted to euro at €${rate} per £1` : "NHS benchmarks used as a proxy";
  const basisShort = euro ? `converted at €${rate} per £1` : "used as a proxy";
  const tiers = `Enterprise (${m(300000 * s)} base + ${m(700 * s)}/bed), Departmental (${m(75000 * s)} + ${m(160 * s)}/bed), Standalone (${m(14000 * s)} + ${m(20 * s)}/bed)`;
  const residual = r.isArchiveOnly ? 1 : 2;
  const sarLaw = euro
    ? "the GDPR right of access covers every system where a patient's data may be held (Data Protection Commission guidance)"
    : "the ICO requires searching every system where patient data may be held";

  return {
    decomSource: `Tier costs use bed-scaled annual benchmarks: ${tiers}, scaled by estate complexity. These are ${basis}, calibrated against the contract register of a large acute NHS Trust (~1,385 beds, 42 legacy systems, 2024/25 data). Named systems and "I know my spend" replace them with your actual contract values.`,

    capFormula: `clinicians × (mins/wk - residual) × 48 working_weeks / 60 × ${m(f.hourlyRate)} × scenario.realisation`,
    capPlug: `${fmtNum(r.clinicians)} active clinicians × ${Math.max(0, r.minsWasted - residual)} reducible mins/wk (${r.minsWasted} - ${residual} residual) × 48 working wks / 60\n= ${fmtNum(r.hrsSaved)} hrs × ${m(f.hourlyRate)}/hr × ${Math.round((r.realization || 0.3) * 100)}% realisation\n= ${fmtK(r.timeSave)}/yr`,
    capSource: `Active clinicians = total staff (beds × 2.8, the NHS Digital workforce ratio) × 65% active rate (Sinsky et al 2016, KLAS Arch Collaborative 500k+ clinicians). Each clinician touches ~35% of legacy estate (role-based access, modelled). Switch penalty 4% per system: Bartek et al JIMI 2023 (2.78M EHR audit-log events, β=0.03), corroborated by Westbrook et al JAMIA 2010. ${m(f.hourlyRate)}/hr blended: NHS Agenda for Change mid-band including on-costs, ${basisShort}. Realisation rate: NHS Productive Ward reported 20-40%.`,

    safetyFormula: `Excess bed days × ${m(f.bedDayCost)}/day + Duplicate tests avoided × ${m(f.testCost)}`,
    safetyPlug: `Excess bed days: ${fmtNum(r.safetyBedDaysAvoided || 0)} days × ${m(f.bedDayCost)} = ${fmtK(r.excessDayCostAvoided || 0)}/yr\n${(r.duplicateTestSaving || 0) > 0 ? `Duplicate tests: beds × 22 tests/yr × 18% duplicate rate × ${m(f.testCost)} × scenario.safety = ${fmtK(r.duplicateTestSaving)}/yr\n` : ""}= ${fmtK(r.qualitySavings || 0)}/yr total`,
    safetySource: `Harm rates: Camacho et al 2024 (BMJ Quality & Safety), measured across NHS England and applied per bed: ~1.8M medication errors at care transitions a year, 31,500 patients harmed, 36,500 excess bed days. Excess bed day cost: ${m(f.bedDayCost)}/day (NHS Reference Costs, general acute, ${basisShort}). Duplicate testing: Bates et al (18% duplicate rate when records are fragmented), ${m(f.testCost)}/test (NHS pathology blended, ${basisShort}). ${p.indemnityNote} Classification: cost avoidance, harm that doesn't occur, not direct budget reductions.`,

    opsSource: `Ticket benchmarks: ITIL service desk reporting in NHS trusts (2.5 tickets/system/month for legacy clinical systems), used as a proxy; surviving systems generate fewer tickets through consolidated support. SAR turnaround: ${sarLaw}. 1.5 day base + 0.4 days per system, validated against a benchmarked NHS Trust (42 systems ≈ 18 working days per SAR).`,

    tiles: [
      { color: C.accent, title: "System costing", num: "01", body: <>Each legacy system is classified into three tiers with annual cost scaled by bed count and estate complexity: {tiers.replace("/bed)", "/bed, e.g. a legacy PAS or EPR)")}. These are {basis}. The formulas were calibrated against the complete contract register of a large acute NHS Trust (~1,385 beds, 42 legacy systems, 2024/25 data). Named flagship systems and "I know my spend" mode replace the benchmarks with your actual contract values.</> },
      { color: C.amber, title: "Clinical capacity", num: "02", body: <>Staffing uses 2.8 clinical FTEs per bed (the NHS Digital workforce ratio). Two evidence-based filters apply: 65% of staff are regular system users (Sinsky et al 2016; KLAS Arch Collaborative, 500k+ clinicians), and each user touches ~35% of the legacy estate. A 4% task-switching penalty per system (Bartek et al JIMI 2023, 2.78M EHR audit-log events; corroborated by Westbrook et al JAMIA 2010) determines minutes wasted. Hours freed are valued at {m(f.hourlyRate)}/hr (NHS Agenda for Change mid-band with on-costs, {basisShort}) with a 20-40% realisation rate (NHS Productive Ward), reflecting that freed time creates capacity, not automatic cash savings.</> },
      { color: C.purple, title: "Patient safety", num: "03", body: <>Harm rates come from Camacho et al 2024 (BMJ Quality & Safety), measured across NHS England: 18 medication errors at care transitions per bed a year, 0.315 patients harmed and 0.365 excess bed days per bed. A fragmentation index (0.6-1.2, capped at 20 systems) scales risk by the number of legacy systems, and your data quality setting adjusts it further. The error and patients-protected counts provide context; only the financial lines in the next tile enter the ROI total.</> },
      { color: C.rose, title: "Quality cost avoidance", num: "04", body: <>Two financial lines convert safety improvement into value: excess bed days avoided at {m(f.bedDayCost)}/day (NHS Reference Costs, general acute, {basisShort}) and duplicate testing avoided (22 tests/bed/yr × 18% duplicate rate when records are fragmented (Bates et al) × {m(f.testCost)}/test). {p.indemnityNote} Both are classified as cost avoidance: harm that doesn't occur, not direct budget reductions.</> },
      { color: "#2ecc71", title: "Confidence levels", num: "05", body: <>The Conservative / Moderate / Optimistic toggle on this report re-runs the whole model with a different multiplier set. Conservative: 85% of planned retirements land, 20% time realisation, 15% safety reduction. Moderate: 100% / 30% / 25%. Optimistic: 110% / 40% / 35%. The corridors come from NHS EPR programme consensus (decommission), NHS Productive Ward (realisation 20-40%) and Camacho et al 2024 / Gate et al 2023 (25-50% error reductions from consolidation). A benchmarked NHS Trust's stated savings target fell between Conservative and Moderate.</> },
      { color: "#8e44ad", title: "Real-world validation", num: "06", body: <>The model was validated against the complete application footprint of a large acute NHS Trust (~1,385 beds, dual-site merged estate): 42 unique systems (3 enterprise, 15 departmental, 24 standalone) with £16.75m/yr total contract value. Defaults alone reproduced £11.9m/yr (−26% vs the £16m target); with tier cost overrides or "I know my spend" mode the model landed within 2.5%. Four systems accounted for 78% of spend, exactly the pattern the named-flagship feature captures.</> },
      { color: C.accent, title: "Year-by-year ramp", num: "07", body: <>Savings are phased to reflect progressive legacy system retirement as data is migrated and interfaces are decommissioned. The 3-year view models 40% / 80% / 100% of steady state across Years 1-3. The 5-year view models 20% / 40% / 60% / 80% / 100% for a slower, more conservative cadence typical of larger groups and multi-site programmes. The top-of-page timescale toggle switches between these views and re-scales every figure on the report. Galen payback is calculated as migration cost ÷ (annual decommission savings minus annual archive cost).</> },
      { color: C.blue, title: "Key sources", num: "08", body: <>Camacho et al 2024, BMJ Quality & Safety (transition medication errors, harm, excess bed days) · NHS Digital workforce statistics 2023/24 · NHS Employers Agenda for Change 2024/25 · NHS Reference Costs (bed-day, pathology) · Bartek et al JIMI 2023 & Westbrook et al JAMIA 2010 (system-switching cost) · {euro ? "Data Protection Commission guidance (subject access requests)" : "ICO guidance (SAR search obligations)"} · Benchmarked acute NHS Trust contract register (2024/25){euro ? ` · Euro figures converted at a planning rate of €${rate} per £1` : ""}.</> },
    ],
  };
}

import React, { useState, useRef, useEffect } from 'react';
import { LeadCapture } from '../components/LeadCapture';
import { C, F, fmtK, fmtNum } from '../theme';
import { UKI, AU } from '../market';
import { Icon } from '../components/Icons';
import { Card } from '../components';

// Build-time flag: '1' when built with `--mode embed`. Used only to attach
// embed-specific classNames; kiosk DOM is unchanged.
const EMBED = import.meta.env.VITE_EMBED === '1';

/**
 * Animates a numeric value to a target over `duration` ms with ease-out cubic.
 *
 * Two behaviours rolled into one:
 *   - First render with target X: animates 0 -> X (dramatic intro count-up,
 *     used by the hero when the report first appears).
 *   - Subsequent target changes (e.g. user taps a different timescale on
 *     the toggle): animates from the CURRENT displayed value to the new
 *     target. Going Year 1 ($2M) -> 5-yr total ($15M) rolls smoothly up;
 *     going Annual ($5M) -> Year 1 ($2M) rolls smoothly down. Previously
 *     this hook always animated 0 -> target, which on timescale switch
 *     made the number visually drop to 0 for one frame before counting
 *     up to the new value - not what you want.
 *
 * The valRef tracks the latest animated value across renders so we know
 * where to start the next animation from.
 */
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const valRef = useRef(0);

  useEffect(() => {
    if (target == null) return;
    const from = valRef.current;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * ease);
      setVal(next);
      valRef.current = next;
      if (t < 1) requestAnimationFrame(tick);
      else { setVal(target); valRef.current = target; }
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return { val };
}

function AnimK({ value }) {
  const { val } = useCountUp(value, 1200);
  return <span style={{ display: "inline-block" }}>{fmtK(val)}</span>;
}

/**
 * Generic animated value renderer. Useful when the number is wrapped in
 * surrounding text (e.g. 'X FTE freed' or 'X patients protected') and the
 * raw fmtK formatter doesn't fit. Pass any format function: receives the
 * animated value, returns the displayed string.
 */
function AnimVal({ value, format }) {
  const { val } = useCountUp(value, 1200);
  return <span style={{ display: "inline-block" }}>{format ? format(val) : val}</span>;
}

function Methodology({ children, formula, plug, source }) {
  const [open, setOpen] = useState(false);
  // If new props provided, use the structured layout; otherwise fall back to children
  const structured = formula || plug || source;
  return <div style={{ marginTop: 8 }}>
    <div onClick={() => setOpen(!open)} style={{ fontSize: F.tiny, color: C.accent, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ transition: "transform .2s", transform: open ? "rotate(90deg)" : "none" }}>▶</span> How we calculated this
    </div>
    {open && <div style={{ marginTop: 8, padding: "14px 18px", background: C.bg, borderRadius: 14, fontSize: F.tiny, color: C.textMid, lineHeight: 1.7, border: `1px solid ${C.borderLight}` }}>
      {structured ? <>
        {formula && <>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Formula</div>
          <div style={{ fontFamily: "ui-monospace,monospace", fontSize: F.tiny, color: C.text, background: C.surface, padding: "8px 10px", borderRadius: 6, marginBottom: 12, lineHeight: 1.6 }}>{formula}</div>
        </>}
        {plug && <>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Your numbers</div>
          <div style={{ fontFamily: "ui-monospace,monospace", fontSize: F.tiny, color: C.text, background: C.accentPale, padding: "8px 10px", borderRadius: 6, marginBottom: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{plug}</div>
        </>}
        {source && <>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Source</div>
          <div style={{ fontSize: F.tiny, color: C.textMid, fontStyle: "italic", lineHeight: 1.6 }}>{source}</div>
        </>}
      </> : children}
    </div>}
  </div>;
}

function JumpLink({ label, onClick }) {
  return <div onClick={onClick} style={{ fontSize: F.tiny, color: C.accent, cursor: "pointer", fontWeight: 600, marginTop: 8, textAlign: "center" }}>{label} ↓</div>;
}

export function ResultsPage({ r, galenMigrationCost, galenAnnualCost, viewTimescale, setViewTimescale, onAdjust, onStartOver, leadContext }) {
  if (!r) return null;
  // viewTimescale is controlled by the TimescaleBar in App.jsx and received
  // as a prop, so the bar can be rendered above the scroll container (where
  // it stays visible during scroll). The bar can't be inside ResultsPage with
  // position: sticky because the PageTransition + rfade animation ancestors
  // create containing blocks that scope sticky positioning incorrectly.
  const TS_MULT = { year1: 0.40, total3: 2.20, total5: 3.00, annual: 1.00 };
  const TS_SUFFIX = { year1: " (Year 1)", total3: " (3-yr)", total5: " (5-yr)", annual: "/yr" };
  const TS_LABEL = { year1: "Year 1", total3: "3-yr total", total5: "5-yr total", annual: "Annual avg" };
  const ts = { mult: TS_MULT[viewTimescale], suffix: TS_SUFFIX[viewTimescale], label: TS_LABEL[viewTimescale] };
  // Helper to scale a /yr value to the current timescale. The suffix
  // ('/yr', '(3-yr)', etc) is NOT appended here — every figure on the page
  // reacts to the toggle bar at the top, and repeating '(3-yr)' on each
  // tile, row, and segment would be redundant noise. The toggle is the
  // single source of timeframe context.
  const fmtKts = (v) => fmtK(Math.round((v || 0) * ts.mult));
  // Kept as an alias for callsites that already used it (KPI tiles).
  // Identical behaviour to fmtKts now.
  const fmtKs = fmtKts;
  // Derived projection window for the time-series chart + Galen ROI box.
  // Switches to 5 when the user picks 5-yr total at the top; otherwise stays
  // on the 3-year ramp visualisation.
  const projYears = viewTimescale === 'total5' ? 5 : 3;
  const [tappedBar, setTappedBar] = useState(null);
  // Which methodology tile is currently expanded into the large slot of the
  // Bento grid at the bottom of the report. Defaults to 0 (System costing).
  const [methSelectedIdx, setMethSelectedIdx] = useState(0);
  const decomRef = useRef(null);
  const capacityRef = useRef(null);
  const reimbRef = useRef(null);
  const safetyRef = useRef(null);
  const networkRef = useRef(null);
  const academicRef = useRef(null);
  const projRef = useRef(null);
  const scrollTo = ref => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Use the engine's comprehensive total - all components sum exactly to this
  const totalAnnual = r.annualWithReimbursement || 0;
  // Non-overlapping segments that sum to totalAnnual
  const seg = {
    decom:    r.decomSave || 0,
    capacity: r.timeSave || 0,
    reimb:    r.reimbursementImpact || 0,
    safety:   r.qualitySavings || 0,
    academic: r.academicSavings || 0,
    network:  r.mergeSavings || 0,
  };
  // FTE freed scales with timescale just like hours freed and dollar figures.
  // For 3-yr total view, this represents cumulative FTE-equivalent capacity
  // freed across 3 years (e.g. 5.2 FTE/yr steady state × 2.20 ramp factor =
  // 11.4 FTE-years cumulative). For Year 1, it's first-year FTE during ramp
  // (5.2 × 0.40 = 2.08 FTE).
  const fteRaw = r.hrsSaved ? r.hrsSaved * (r.realization || 0.3) / (UKI ? 1820 : AU ? 1824 : 2080) : 0; // hrs/yr FTE basis - matches each engine's fteEquivalent (NHS 1820, AU 1824, US 2080)
  const fteScaled = fteRaw * ts.mult;
  // UKI keeps one decimal at any magnitude to line up with the full web
  // calculator's "FTE equivalent" stat (e.g. 2.4); US rounds to whole FTE
  // once >= 1, as it always has.
  const fte = (UKI || AU) ? Math.round(fteScaled * 10) / 10 : fteScaled >= 1 ? Math.round(fteScaled) : Math.round(fteScaled * 10) / 10;
  const fmtFte = (UKI || AU)
    ? (v => Number.isInteger(v) ? fmtNum(v) : v.toFixed(1))
    : (v => v < 1 ? v.toFixed(1) : fmtNum(v));
  const hasGalen = galenMigrationCost > 0;
  const payback = hasGalen ? galenMigrationCost / Math.max(1, r.decomSave - galenAnnualCost) : 0;

  return <div style={{ animation: "rfade .5s ease-out" }}>
    <style>{`@keyframes rfade { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes glow { 0%,100% { text-shadow: 0 0 30px ${C.glowA}; } 50% { text-shadow: 0 0 60px ${C.glowB}; } }
      @keyframes numPulse { 0% { transform: scale(1); } 40% { transform: scale(1.08); } 100% { transform: scale(1); } }`}</style>

    {/* Timescale bar now rendered in App.jsx above the scroll container so
        it stays visible during scroll. ResultsPage only consumes viewTimescale
        as a prop and scales every figure accordingly. */}

    {/* Hero */}
    <div style={{ textAlign: "center", marginBottom: 20, padding: "24px 0" }}>
      <div className={EMBED ? "embed-hero-eyebrow" : undefined} style={{ fontSize: F.body, fontWeight: 600, color: C.textMuted, letterSpacing: 4, textTransform: "uppercase", marginBottom: 16 }}>
        {viewTimescale === 'annual' ? 'Estimated annual savings'
          : viewTimescale === 'year1' ? 'Estimated Year 1 savings'
          : viewTimescale === 'total3' ? 'Estimated 3-year cumulative savings'
          : 'Estimated 5-year cumulative savings'}
      </div>
      <div style={{ fontSize: F.hero, fontWeight: 800, color: C.accent, lineHeight: 1, letterSpacing: EMBED ? "-0.015em" : "-4px", animation: "glow 3s ease-in-out infinite" }}><AnimK value={Math.round(totalAnnual * ts.mult)} /></div>
      <div style={{ fontSize: F.h3, color: C.textMid, marginTop: 14 }}>
        {viewTimescale === 'annual' ? 'per year at steady state'
          : viewTimescale === 'year1' ? 'in Year 1 (40% of steady state during ramp)'
          : viewTimescale === 'total3' ? 'cumulative across the first 3 years'
          : 'cumulative across the first 5 years'}
      </div>
    </div>

    {/* Composition bar - every segment sums exactly to the topline */}
    <div style={{ marginBottom: 32, padding: "0 12px" }}>
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
        {seg.decom > 0 && <div style={{ flex: seg.decom, background: C.chart.decom }} />}
        {seg.capacity > 0 && <div style={{ flex: seg.capacity, background: C.chart.capacity }} />}
        {seg.reimb > 0 && <div style={{ flex: seg.reimb, background: C.chart.reimb }} />}
        {seg.safety > 0 && <div style={{ flex: seg.safety, background: C.chart.safety }} />}
        {seg.academic > 0 && <div style={{ flex: seg.academic, background: C.chart.academic }} />}
        {seg.network > 0 && <div style={{ flex: seg.network, background: C.chart.network }} />}
      </div>
      <div className={EMBED ? "embed-comp-legend" : undefined} style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        <CompositionItem color={C.accent} dotColor={C.chart.decom} label="Decommission" amount={Math.round(seg.decom * ts.mult)} pct={Math.round(seg.decom / Math.max(1, totalAnnual) * 100)} />
        <CompositionItem color={C.amber} dotColor={C.chart.capacity} label="Capacity" amount={Math.round(seg.capacity * ts.mult)} pct={Math.round(seg.capacity / Math.max(1, totalAnnual) * 100)} />
        {seg.reimb > 0 && <CompositionItem color={C.blue} dotColor={C.chart.reimb} label={AU ? (r.isAgedCare ? "AN-ACC & funding" : r.isNDIS ? "Claims & utilisation" : "ABF & revenue") : "Reimbursement"} amount={Math.round(seg.reimb * ts.mult)} pct={Math.round(seg.reimb / Math.max(1, totalAnnual) * 100)} />}
        {seg.safety > 0 && <CompositionItem color={C.purple} dotColor={C.chart.safety} label={AU && r.isAgedCare ? "Quality & harm" : "Patient safety"} amount={Math.round(seg.safety * ts.mult)} pct={Math.round(seg.safety / Math.max(1, totalAnnual) * 100)} />}
        {seg.academic > 0 && <CompositionItem color="#e67e22" dotColor={C.chart.academic} label="Academic" amount={Math.round(seg.academic * ts.mult)} pct={Math.round(seg.academic / Math.max(1, totalAnnual) * 100)} />}
        {seg.network > 0 && <CompositionItem color="#8e44ad" dotColor={C.chart.network} label="Network" amount={Math.round(seg.network * ts.mult)} pct={Math.round(seg.network / Math.max(1, totalAnnual) * 100)} />}
      </div>
    </div>

    {/* KPI grid - each card maps to a segment above, tappable to jump to detail */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
      <KpiCard label="Legacy decommission" amount={Math.round(seg.decom * ts.mult)} sub={`${r.decom} of ${r.legacy} systems retired`} color={C.accent} iconKey="unlock" onClick={() => scrollTo(decomRef)} />
      <KpiCard label="Clinical capacity" value={<AnimVal value={Math.round(fte * 10)} format={(v) => fmtFte(v / 10) + " FTE freed"} />} sub={<><AnimK value={Math.round(seg.capacity * ts.mult)} /> value</>} color={C.amber} iconKey="clock" onClick={() => scrollTo(capacityRef)} />
      {seg.reimb > 0 && <KpiCard label={AU ? (r.isAgedCare ? "Funding & efficiency" : r.isNDIS ? "Revenue & efficiency" : "ABF & revenue") : "Reimbursement impact"} amount={Math.round(seg.reimb * ts.mult)} sub={AU ? (r.isAgedCare ? "AN-ACC + agency + compliance" : r.isNDIS ? "Claims + utilisation + retention" : "ABF efficiency + private revenue") : "CMS penalties + denial recovery"} color={C.blue} iconKey="dollar" onClick={() => scrollTo(reimbRef)} />}
      {seg.safety > 0 && <KpiCard label={AU && r.isAgedCare ? "Quality & harm avoided" : "Patient safety"} amount={Math.round(seg.safety * ts.mult)} sub={AU && r.isAgedCare ? "Avoidable harm + preventable admissions" : <><AnimVal value={Math.round(r.safetyPatientsProtected * ts.mult)} format={fmtNum} /> patients protected{r.readmissionsAvoided > 0 ? <>, <AnimVal value={Math.round(r.readmissionsAvoided * ts.mult)} format={(v) => v.toString()} /> readmissions avoided</> : ""}</>} color={C.purple} iconKey="shield" onClick={() => scrollTo(safetyRef)} />}
      {seg.network > 0 && <KpiCard label="Network consolidation" amount={Math.round(seg.network * ts.mult)} sub={`${r.duplicateSystems} duplicate systems across ${r.org_count || ""} facilities`} color="#8e44ad" iconKey="network" onClick={() => scrollTo(networkRef)} />}
      {seg.academic > 0 && <KpiCard label={AU ? "Academic programme" : "Academic program"} amount={Math.round(seg.academic * ts.mult)} sub={AU ? "Research + teaching efficiency" : "Research + GME + teaching"} color="#e67e22" iconKey="graduation" onClick={() => scrollTo(academicRef)} />}
    </div>

    {/* Lead capture - web/embed only; the kiosk is an attended sales surface
        with its own follow-up flow, so it never shows a form. */}
    {EMBED && <LeadCapture r={r} leadContext={leadContext} />}



    {/* ═══ DETAIL SECTIONS ═══ */}

    {/* Year-by-year projection - first section.
        The projection window (3-year vs 5-year ramp) is now controlled by the
        top-level timescale toggle: total5 -> 5-year ramp, anything else -> 3-year. */}
    <div ref={projRef}>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <CTitle iconKey="calendar">{projYears}-year cumulative projection</CTitle>
          <div style={{ fontSize: F.tiny, color: C.textMuted, fontWeight: 600 }}>
            {viewTimescale === 'total5' ? '5-year ramp (20/40/60/80/100%)' : '3-year ramp (40/80/100%)'}
          </div>
        </div>

        {/* Cumulative total banner - uses proper 3-year (40/80/100) or 5-year (20/40/60/80/100) ramp */}
        {(() => {
          const total = projYears === 5
            ? (r.total5WithReimbursement || r.total5 || 0)
            : (r.total3WithReimbursement || r.total3 || 0);
          const firstYearPct = projYears === 5 ? 0.20 : 0.40;
          return <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
            <div style={{ fontSize: F.tiny, color: C.textMuted, marginBottom: 4 }}>{projYears}-year cumulative savings</div>
            <div style={{ fontSize: 56, fontWeight: 800, color: C.accent, letterSpacing: EMBED ? "-0.015em" : "-2px" }}>{fmtK(total)}</div>
            <div style={{ fontSize: F.tiny, color: C.textMid, marginTop: 6 }}>Builds from {fmtK(Math.round((r.annualWithReimbursement || r.annual || 0) * firstYearPct))} in Year 1 to {fmtK(r.annualWithReimbursement || r.annual || 0)}/yr at steady state</div>
          </div>;
        })()}

        {/* Year cards - uses real ramp values from engine */}
        {(() => {
          const allYrs = projYears === 5 ? [
            { yr: "Year 1", val: (r.yr5ValsR || r.yr5Vals || [0])[0], pct: 20 },
            { yr: "Year 2", val: (r.yr5ValsR || r.yr5Vals || [0,0])[1], pct: 40 },
            { yr: "Year 3", val: (r.yr5ValsR || r.yr5Vals || [0,0,0])[2], pct: 60 },
            { yr: "Year 4", val: (r.yr5ValsR || r.yr5Vals || [0,0,0,0])[3], pct: 80 },
            { yr: "Year 5", val: (r.yr5ValsR || r.yr5Vals || [0,0,0,0,0])[4], pct: 100 },
          ] : [
            { yr: "Year 1", val: r.yr1R || r.yr1, pct: 40 },
            { yr: "Year 2", val: r.yr2R || r.yr2, pct: 80 },
            { yr: "Year 3", val: r.yr3R || r.yr3, pct: 100 },
          ];
          return <div style={{ display: "flex", gap: projYears === 5 ? 8 : 14, marginBottom: 20 }}>
            {allYrs.map(y => <div key={y.yr} style={{ flex: 1, padding: projYears === 5 ? "14px 10px" : "18px 20px", background: C.bg, borderRadius: 16, textAlign: "center" }}>
              <div style={{ fontSize: F.tiny, color: C.textMuted, marginBottom: 4 }}>{y.yr}</div>
              <div style={{ fontSize: projYears === 5 ? F.body : F.h2, fontWeight: 800, color: C.accent }}>{fmtK(y.val)}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{y.pct}%</div>
            </div>)}
          </div>;
        })()}

        {/* Interactive stacked bar chart */}
        {(() => {
          const yr3Val = r.yr3R || r.yr3 || 0;
          const yrs = projYears === 5 ? [
            { yr: "Yr 1", pct: 0.2 },
            { yr: "Yr 2", pct: 0.4 },
            { yr: "Yr 3", pct: 0.6 },
            { yr: "Yr 4", pct: 0.8 },
            { yr: "Yr 5", pct: 1.0 },
          ] : [
            { yr: "Yr 1", pct: 0.4 },
            { yr: "Yr 2", pct: 0.8 },
            { yr: "Yr 3", pct: 1.0 },
          ];
          const segments = [
            { key: "Decommission", color: C.chart.decom, val: seg.decom },
            { key: "Capacity", color: C.chart.capacity, val: seg.capacity },
            { key: AU ? (r.isAgedCare ? "AN-ACC & funding" : r.isNDIS ? "Claims & utilisation" : "ABF & revenue") : "Reimbursement", color: C.chart.reimb, val: seg.reimb },
            { key: AU && r.isAgedCare ? "Quality & harm" : "Patient safety", color: C.chart.safety, val: seg.safety },
            { key: "Network", color: C.chart.network, val: seg.network },
            { key: "Academic", color: C.chart.academic, val: seg.academic },
          ].filter(s => s.val > 0);
          const barH = 160;
          return <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: projYears === 5 ? 6 : 10, alignItems: "flex-end", minHeight: barH + 30, padding: "50px 12px 0", overflow: "visible" }}>
              {yrs.map((y, yi) => {
                const h = Math.round(barH * y.pct);
                return <div key={y.yr} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "100%", height: h, display: "flex", flexDirection: "column", position: "relative" }}>
                    {segments.map((s, si) => <div key={s.key}
                      onClick={() => setTappedBar(tappedBar === yi+"-"+si ? null : yi+"-"+si)}
                      style={{ flex: s.val, background: s.color, minHeight: 2, cursor: "pointer", position: "relative", opacity: tappedBar && tappedBar !== yi+"-"+si ? 0.4 : 1, transition: "opacity .2s",
                        borderRadius: si === 0 ? "10px 10px 0 0" : si === segments.length - 1 ? "0 0 4px 4px" : 0, overflow: "visible" }}>
                      {tappedBar === yi+"-"+si && <div style={{
                        position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
                        padding: "8px 14px", background: "#222", borderRadius: 10, whiteSpace: "nowrap", zIndex: 20,
                        fontSize: 12, fontWeight: 700, color: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                        pointerEvents: "none"
                      }}>{s.key}: {fmtK(Math.round(s.val * y.pct))}</div>}
                    </div>)}
                  </div>
                  <div style={{ fontSize: F.tiny, color: C.textMuted, marginTop: 6, fontWeight: 600 }}>{y.yr}</div>
                </div>;
              })}
            </div>
            {tappedBar && <div style={{ textAlign: "center", marginTop: 8, fontSize: F.tiny, color: C.textMuted }}>Tap again to dismiss · tap another segment to compare</div>}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
              {segments.map(s => <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                <span style={{ fontSize: 10, color: C.textMuted }}>{s.key}</span>
              </div>)}
            </div>
          </div>;
        })()}

        <Methodology
          formula={"steady_state_annual \u00d7 ramp_percent[year]"}
          plug={projYears === 5 
            ? `Year 1: ${fmtK(totalAnnual)} \u00d7 20% = ${fmtK(Math.round(totalAnnual * 0.20))}\nYear 2: ${fmtK(totalAnnual)} \u00d7 40% = ${fmtK(Math.round(totalAnnual * 0.40))}\nYear 3: ${fmtK(totalAnnual)} \u00d7 60% = ${fmtK(Math.round(totalAnnual * 0.60))}\nYear 4: ${fmtK(totalAnnual)} \u00d7 80% = ${fmtK(Math.round(totalAnnual * 0.80))}\nYear 5: ${fmtK(totalAnnual)} \u00d7 100% = ${fmtK(totalAnnual)}`
            : `Year 1: ${fmtK(totalAnnual)} \u00d7 40% = ${fmtK(Math.round(totalAnnual * 0.40))}\nYear 2: ${fmtK(totalAnnual)} \u00d7 80% = ${fmtK(Math.round(totalAnnual * 0.80))}\nYear 3: ${fmtK(totalAnnual)} \u00d7 100% = ${fmtK(totalAnnual)}`}
          source={"Phased ramp reflects progressive legacy system retirement. Data is migrated and interfaces decommissioned over time. Year 1 captures early-phase savings as the highest-cost systems are retired first; later years reach steady state once all targeted systems are fully retired."}
        />
      </Card>
    </div>

    {/* Four detail sections in a 2×2 grid below the stacked bar chart.
        When seg.reimb is 0 the Reimbursement card is hidden and the grid
        falls to 3 cards arranged 2+1. Cards stretch to equal height per row
        thanks to height: 100% on each Card style. */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

    {/* Decommission */}
    <div ref={decomRef}>
      <Card style={{ height: '100%', borderLeft: `3px solid ${C.accent}` }}>
        <CTitle iconKey="unlock" color={C.accent}>Decommission savings</CTitle>
        <div style={{ fontSize: F.tiny, color: C.textMid, marginBottom: 14, lineHeight: 1.5 }}>Annual licensing, support, and infrastructure costs eliminated when legacy systems are retired and data archived into Galen.</div>
        <Row label="Legacy systems in scope" value={r.legacy} />
        <Row label="Systems retired" value={r.decom} />
        <Row label="Total estate cost" value={fmtKts(r.totalEstate)} />
        <Row label={viewTimescale === 'annual' ? "Annual savings from retirement" : "Savings from retirement"} value={fmtKts(r.decomSave)} accent />
        <Methodology
          formula={"\u03a3 (tier_count \u00d7 tier_cost) \u00d7 decom_rate \u00d7 scenario.decom + retired_flagships \u00d7 scenario.decom"}
          plug={`${r.entDecom} enterprise \u00d7 ${fmtK(r.entCost)} + ${r.depDecom} departmental \u00d7 ${fmtK(r.depCost)} + ${r.nicDecom} standalone \u00d7 ${fmtK(r.nicCost)}\n${r.flagshipRetireCount > 0 ? `+ ${r.flagshipRetireCount} retired flagship${r.flagshipRetireCount === 1 ? "" : "s"} \u00d7 scenario.decom (${Math.round((r.decomFactor||1) * 100)}%)` : ""}\n= ${fmtK(r.decomSave)}/yr (${Math.round(r.decom / Math.max(1, r.legacy) * 100)}% of ${r.legacy} systems retired)`}
          source={UKI
            ? "Tier costs use bed-scaled annual benchmarks: Enterprise (£300k base + £700/bed), Departmental (£75k + £160/bed), Standalone (£14k + £20/bed), scaled by estate complexity. Calibrated against the contract register of a large acute NHS Trust (~1,385 beds, 42 legacy systems, 2024/25 data) — defaults cover ~80% of actual estate value."
            : AU
            ? "Tier costs use scale-adjusted annual benchmarks: Enterprise (A$250k base + A$600/bed), Departmental (A$65k + A$140/bed), Standalone (A$12k + A$18/bed), scaled by complexity and provider profile. Sources: AU state contract-derived pricing, NSW SDPR programme data, vendor case studies."
            : "Tier costs use bed-scaled annual benchmarks: Enterprise ($300k base + $700/bed), Departmental ($75k + $160/bed), Standalone ($14k + $20/bed). Sources: KLAS 2025 EHR & vendor benchmarks, Becker's Hospital Review IT spend reports, AHA Hospital IT Survey."}
        />
      </Card>
    </div>

    {/* Capacity */}
    <div ref={capacityRef}>
      <Card style={{ height: '100%', borderLeft: `3px solid ${C.amber}` }}>
        <CTitle iconKey="clock" color={C.amber}>Clinical capacity</CTitle>
        <div style={{ fontSize: F.tiny, color: C.textMid, marginBottom: 14, lineHeight: 1.5 }}>Clinician time freed by eliminating context-switching between legacy systems, valued at blended hourly rate with conservative realization.</div>
        <Row label="Total staff" value={fmtNum(r.totalStaff)} />
        <Row label="Active system users (65%)" value={fmtNum(r.clinicians)} />
        <Row label="Systems per user (~35% exposure)" value={r.systemsPerUser} />
        <Row label="Time wasted per person/week" value={`${r.minsWasted} mins`} />
        <Row label="Hours freed" value={fmtNum(Math.round(r.hrsSaved * ts.mult))} />
        <Row label="Full-time equivalent (FTE)" value={fmtFte(fte)} accent />
        <Row label="Capacity value" value={fmtKts(seg.capacity)} accent />
        <Methodology
          formula={UKI
            ? "clinicians \u00d7 (mins/wk - residual) \u00d7 48 working_weeks / 60 \u00d7 \u00a355 \u00d7 scenario.realisation"
            : AU
            ? `staff \u00d7 (mins/wk - residual) \u00d7 48 working_weeks / 60 \u00d7 A$${r.isAgedCare || r.isNDIS ? 42 : 65} \u00d7 scenario.realisation`
            : "clinicians \u00d7 (mins/wk - residual) \u00d7 working_weeks / 60 \u00d7 $95 \u00d7 scenario.realization"}
          plug={UKI
            ? `${fmtNum(r.clinicians)} active clinicians \u00d7 ${Math.max(0, r.minsWasted - (r.isArchiveOnly ? 1 : 2))} reducible mins/wk (${r.minsWasted} - ${r.isArchiveOnly ? 1 : 2} residual) \u00d7 48 working wks / 60\n= ${fmtNum(r.hrsSaved)} hrs \u00d7 \u00a355/hr \u00d7 ${Math.round((r.realization || 0.3) * 100)}% realisation\n= ${fmtK(r.timeSave)}/yr`
            : AU
            ? `${fmtNum(r.clinicians)} active system users \u00d7 ${Math.max(0, r.minsWasted - (r.isArchiveOnly ? 1 : 2))} reducible mins/wk (${r.minsWasted} - ${r.isArchiveOnly ? 1 : 2} residual) \u00d7 48 working wks / 60\n= ${fmtNum(r.hrsSaved)} hrs \u00d7 A$${r.isAgedCare || r.isNDIS ? 42 : 65}/hr \u00d7 ${Math.round((r.realization || 0.3) * 100)}% realisation\n= ${fmtK(r.timeSave)}/yr`
            : `${fmtNum(r.clinicians)} active clinicians \u00d7 ${Math.max(0, r.minsWasted - (r.isArchiveOnly ? 1 : 2))} reducible mins/wk (${r.minsWasted} - ${r.isArchiveOnly ? 1 : 2} residual) \u00d7 50 working wks / 60\n= ${fmtNum(r.hrsSaved)} hrs \u00d7 $95/hr \u00d7 ${Math.round((r.realization || 0.3) * 100)}% realization\n= ${fmtK(r.timeSave)}/yr`}
          source={UKI
            ? "Active clinicians = total staff (beds \u00d7 2.8, NHS Digital workforce statistics 2023/24) \u00d7 65% active rate (Sinsky et al 2016, KLAS Arch Collaborative 500k+ clinicians). Each clinician touches ~35% of legacy estate (role-based access, modelled). Switch penalty 4% per system: Bartek et al JIMI 2023 (PRIMARY: 2.78M EHR audit-log events, \u03b2=0.03), corroborated by Westbrook et al JAMIA 2010 and Nuffield Trust 2020. \u00a355/hr blended: NHS Agenda for Change mid-band including on-costs, weighted towards nursing. Realisation rate: NHS Productive Ward reported 20-40%."
            : AU
            ? (r.isAgedCare || r.isNDIS
              ? "Staffing from sector ratios (aged care 1.5 headcount/place per the 215 care-minute mandate; NDIS 0.2 staff/participant) × 65% active system users (Sinsky et al 2016, KLAS Arch Collaborative). Switch penalty 4% per system (Bartek et al JIMI 2023). A$42/hr care-sector blended award rate."
              : "Staffing: NSW Health SDPR (3.0 clinical staff per acute bed) × 65% active rate (Sinsky et al 2016, KLAS Arch Collaborative 500k+ clinicians). Each user touches ~35% of the legacy estate. Switch penalty 4% per system: Bartek et al JIMI 2023 (2.78M EHR audit-log events, β=0.03), corroborated by Westbrook et al JAMIA 2010. A$65/hr blended (AIHW workforce data).")
            : "Active clinicians = total staff (beds \u00d7 3.2) \u00d7 65% active rate (Sinsky et al 2016, KLAS Arch Collaborative 500k+ clinicians). Each clinician touches ~35% of legacy estate (role-based access, modeled). Switch penalty 4% per system: Bartek et al JIMI 2023 (PRIMARY: 2.78M EHR audit-log events, \u03b2=0.03), corroborated by Westbrook et al JAMIA 2010. $95/hr blended: AHA RN/MD/tech weighted."}
        />
      </Card>
    </div>

    {/* Reimbursement */}
    {seg.reimb > 0 && <div ref={reimbRef}>
      <Card style={{ height: '100%', borderLeft: `3px solid ${C.blue}` }}>
        <CTitle iconKey="dollar" color={C.blue}>{AU ? (r.isAgedCare ? "AN-ACC funding & efficiency" : r.isNDIS ? "NDIS revenue & efficiency" : "ABF efficiency & revenue") : "Reimbursement & compliance"}</CTitle>
        <div style={{ fontSize: F.tiny, color: C.textMid, marginBottom: 14, lineHeight: 1.5 }}>{AU ? (r.isAgedCare ? "Funding accuracy, agency staffing reduction and compliance efficiency enabled by consolidated records - 30% attributed to system consolidation." : r.isNDIS ? "Claims accuracy, billable utilisation, staff retention and compliance efficiency from consolidated client records." : "Consolidation efficiency on the surviving estate plus private patient revenue recovery from complete documentation.") : "CMS penalty program recovery and denial reduction from improved documentation through system consolidation."}</div>
        {AU && (r.abfEfficiencyGain || 0) > 0 && <Row label="ABF consolidation efficiency" value={fmtKts(r.abfEfficiencyGain)} />}
        {AU && (r.privateRevRecovery || 0) > 0 && <Row label="Private patient revenue recovery" value={fmtKts(r.privateRevRecovery)} />}
        {AU && (r.acAnaccUplift || 0) > 0 && <Row label="AN-ACC funding uplift" value={fmtKts(r.acAnaccUplift)} />}
        {AU && (r.acAgencyReduction || 0) > 0 && <Row label="Agency staffing reduction" value={fmtKts(r.acAgencyReduction)} />}
        {AU && (r.acComplianceSaving || 0) > 0 && <Row label="Compliance efficiency" value={fmtKts(r.acComplianceSaving)} />}
        {AU && (r.ndisClaimsRecovery || 0) > 0 && <Row label="Claims accuracy recovery" value={fmtKts(r.ndisClaimsRecovery)} />}
        {AU && (r.ndisUtilisationUplift || 0) > 0 && <Row label="Billable utilisation uplift" value={fmtKts(r.ndisUtilisationUplift)} />}
        {AU && (r.ndisComplianceSaving || 0) > 0 && <Row label="Compliance efficiency" value={fmtKts(r.ndisComplianceSaving)} />}
        {AU && (r.ndisRetentionSaving || 0) > 0 && <Row label="Staff retention saving" value={fmtKts(r.ndisRetentionSaving)} />}
        {r.hrrpReduction > 0 && <Row label="Hospital Readmissions Reduction Program (HRRP) recovery" value={fmtKts(r.hrrpReduction)} />}
        {r.hacReduction > 0 && <Row label="Hospital-Acquired Condition (HAC) improvement" value={fmtKts(r.hacReduction)} />}
        {r.vbpImprovement > 0 && <Row label="Value-Based Purchasing (VBP) opportunity" value={fmtKts(r.vbpImprovement)} />}
        {r.denialRecovery > 0 && <Row label="Denial recovery" value={fmtKts(r.denialRecovery)} />}
        <Row label={AU ? (r.isAgedCare ? "Total funding & efficiency" : r.isNDIS ? "Total revenue & efficiency" : "Total ABF & revenue impact") : "Total reimbursement impact"} value={fmtKts(seg.reimb)} accent />
        <Methodology
          formula={AU
            ? (r.isAgedCare ? "Revenue × 45% × 3% AN-ACC uplift × 30% attribution + Staff cost × 10% agency × 15% × 30% attribution + 0.5 FTE/facility × A$65k × 50%"
              : r.isNDIS ? "Revenue × 8% rejection × 5% recovery + Utilisation uplift 4% + Compliance 0.3 FTE/100 × A$60k × 50% + Turnover 27.5% × A$6.5k × 10%"
              : "Surviving estate × 15% × scenario.decom + Private leakage × 30% recovery")
            : "HRRP penalty reduction + HAC penalty reduction + VBP improvement + Denial recovery"}
          plug={AU
            ? (r.isAgedCare ? `AN-ACC uplift: ${fmtK(r.acAnaccUplift)}/yr\nAgency reduction: ${fmtK(r.acAgencyReduction)}/yr\nCompliance: ${fmtK(r.acComplianceSaving)}/yr\n= ${fmtK(seg.reimb)}/yr total`
              : r.isNDIS ? `Claims accuracy: ${fmtK(r.ndisClaimsRecovery)}/yr\nUtilisation uplift: ${fmtK(r.ndisUtilisationUplift)}/yr\nCompliance: ${fmtK(r.ndisComplianceSaving)}/yr\nRetention: ${fmtK(r.ndisRetentionSaving)}/yr\n= ${fmtK(seg.reimb)}/yr total`
              : `ABF efficiency: ${fmtK(r.abfEfficiencyGain)}/yr (15% of the SURVIVING estate - retired systems are already counted in decommission savings)\nPrivate revenue: ${fmtK(r.privateRevRecovery)}/yr (${fmtNum(r.admissionsPerYear || 0)} admissions \u00d7 private mix \u00d7 15% unbilled \u00d7 30% recovered)\n= ${fmtK(seg.reimb)}/yr total`)
            : `HRRP: ${fmtK(r.hrrpReduction)}/yr (Medicare DRG ${fmtK(r.medicareDrg)} \u00d7 0.33% avg penalty \u00d7 scenario.safety)\nHAC: ${fmtK(r.hacReduction)}/yr (DRG \u00d7 1% \u00d7 25% bottom-quartile probability)\nVBP: ${fmtK(r.vbpImprovement)}/yr (DRG \u00d7 2% withhold \u00d7 15% improvement potential)\nDenials: ${fmtK(r.denialRecovery)}/yr (revenue \u00d7 4.8% denial rate \u00d7 fragmentation attribution)\n= ${fmtK(seg.reimb)}/yr total`}
          source={AU
            ? (r.isAgedCare ? "AN-ACC model (since Oct 2022): 3% uplift on the 45% documentation-responsive share of revenue, 30% attributed to system consolidation. Agency: ~10% of staffing on agency/casual cover, 15% reducible via integrated rostering, 30% attribution. Compliance: QI Program, SIRS and Star Ratings collation (~0.5 FTE/facility). Revenue: A$160k/place (AN-ACC subsidy $117,396 + resident fees, health.gov.au / StewartBrown FY25)."
              : r.isNDIS ? "NDIA Q4 2024-25 (revenue basis: average annualised payments per non-SIL participant ~A$45.9k). Claims: ~8% baseline rejection, documentation-driven recovery. Utilisation: 70% billable baseline. Turnover: 27.5% at A$6.5k replacement (A$5-8k benchmark)."
              : "ABF efficiency: 15% of the surviving legacy estate's admin cost (IHACPA NWAU pricing context; NSW SDPR programme data). Private revenue: ~15% of privately insured episodes in public hospitals go unbilled (VAGO 2019); 30% recoverable; APRA Dec 2024 average episode benefit $3,824 + MBS.")
            : "HRRP: CMS Section 1886(q) Social Security Act (3% max penalty, 0.33% avg FY2025 - Advisory Board). HAC: CMS HAC Reduction Program (1% reduction for bottom 25%). VBP: CMS Hospital Value-Based Purchasing (2% withhold pool). Denials: HFMA 2024 + AHIP industry data ($262bn annually denied, 4.8% net loss). Fragmentation attribution: Vest et al JAMIA 2019."}
        />
      </Card>
    </div>}

    {/* Patient safety — hidden for AU NDIS (no quality module) */}
    {(!AU || (r.qualitySavings || 0) > 0) && <div ref={safetyRef}>
      <Card style={{ height: '100%', borderLeft: `3px solid ${C.purple}` }}>
        <CTitle iconKey="shield" color={C.purple}>{AU && r.isAgedCare ? "Quality & avoidable harm" : "Patient safety impact"}</CTitle>
        <div style={{ fontSize: F.tiny, color: C.textMid, marginBottom: 14, lineHeight: 1.5 }}>{AU && r.isAgedCare ? "Cost avoidance from reducing falls, pressure injuries, medication incidents and preventable hospital admissions - 25-30% attributed to information fragmentation." : "Cost avoidance from preventing adverse events attributable to fragmented clinical information across legacy systems."}</div>
        {/* Per-bed harm counts use acute-hospital rates; aged care has its own lines */}
        {!(AU && (r.isAgedCare || r.isNDIS)) && <>
        <Row label="Medication errors avoided" value={fmtNum(Math.round(r.safetyMedErrorsAvoided * ts.mult))} />
        <Row label="Patients protected from harm" value={fmtNum(Math.round(r.safetyPatientsProtected * ts.mult))} />
        <Row label="Excess bed days avoided" value={fmtNum(Math.round(r.safetyBedDaysAvoided * ts.mult))} />
        </>}
        {AU && r.isAgedCare && (r.acHarmAvoidance || 0) > 0 && <Row label="Avoidable harm (falls / pressure / medication)" value={fmtKts(r.acHarmAvoidance)} />}
        {AU && r.isAgedCare && (r.acPPHAvoidance || 0) > 0 && <Row label="Preventable hospital admissions" value={fmtKts(r.acPPHAvoidance)} />}
        {AU && !r.isAgedCare && (r.excessDayCostAvoided || 0) > 0 && <Row label="Excess bed-day cost avoided" value={fmtKts(r.excessDayCostAvoided)} />}
        {AU && (r.duplicateReduction || 0) > 0 && <Row label="Duplicate testing reduction" value={fmtKts(r.duplicateReduction)} />}
        {AU && (r.ediscoverySaving || 0) > 0 && <Row label="Medico-legal (e-Discovery) savings" value={fmtKts(r.ediscoverySaving)} />}
        {r.readmissionsAvoided > 0 && <Row label={"Readmissions avoided (" + Math.round(r.readmissionsAvoided * ts.mult) + " patients)"} value={r.readmissionCostAvoidance > 0 ? fmtKts(r.readmissionCostAvoidance) : "quality metric"} />}
        {r.malpracticeReduction > 0 && <Row label={UKI ? "Clinical negligence indemnity reduction" : AU ? "Medical indemnity reduction" : "Malpractice reduction"} value={fmtKts(r.malpracticeReduction)} />}
        {UKI && (r.duplicateTestSaving || 0) > 0 && <Row label="Duplicate testing avoided" value={fmtKts(r.duplicateTestSaving)} />}
        {(r.qualitySavings || 0) > 0 && <Row label="Total cost avoidance" value={fmtKts(r.qualitySavings)} accent />}
        <Methodology
          formula={UKI
            ? "Excess bed days \u00d7 \u00a3400/day + Indemnity (beds \u00d7 \u00a37,500 \u00d7 5%) \u00d7 scenario.safety + Duplicate tests avoided \u00d7 \u00a335"
            : AU
            ? (r.isAgedCare ? "Places \u00d7 A$3,000 harm cost \u00d7 25% fragmentation \u00d7 scenario.safety + Places \u00d7 15% PPH \u00d7 A$8,000 \u00d7 30% \u00d7 scenario.safety"
              : "Excess bed days \u00d7 A$3,100 + Indemnity (beds \u00d7 A$20,000 \u00d7 3%) \u00d7 scenario.safety + Duplicate tests + e-Discovery + Readmissions \u00d7 A$11,500")
            : "Excess bed days \u00d7 $3,132/day + Malpractice premium \u00d7 5% \u00d7 scenario.safety + Readmissions avoided \u00d7 $15,200"}
          plug={UKI
            ? `Excess bed days: ${fmtNum(r.safetyBedDaysAvoided || 0)} days \u00d7 \u00a3400 = ${fmtK(r.excessDayCostAvoided || 0)}/yr\n${r.malpracticeReduction > 0 ? `Indemnity: beds \u00d7 \u00a37,500 exposure \u00d7 5% reduction \u00d7 scenario.safety = ${fmtK(r.malpracticeReduction)}/yr\n` : ""}${(r.duplicateTestSaving || 0) > 0 ? `Duplicate tests: beds \u00d7 22 tests/yr \u00d7 18% duplicate rate \u00d7 \u00a335 \u00d7 scenario.safety = ${fmtK(r.duplicateTestSaving)}/yr\n` : ""}= ${fmtK(r.qualitySavings || 0)}/yr total`
            : AU
            ? (r.isAgedCare ? `Avoidable harm: ${fmtK(r.acHarmAvoidance || 0)}/yr\nPreventable admissions: ${fmtK(r.acPPHAvoidance || 0)}/yr\n= ${fmtK(r.qualitySavings || 0)}/yr total`
              : `Excess bed days: ${fmtK(r.excessDayCostAvoided || 0)}/yr\nIndemnity: ${fmtK(r.malpracticeReduction || 0)}/yr\nDuplicate testing: ${fmtK(r.duplicateReduction || 0)}/yr\ne-Discovery: ${fmtK(r.ediscoverySaving || 0)}/yr\nReadmissions: ${fmtK(r.readmissionCostAvoidance || 0)}/yr\n= ${fmtK(r.qualitySavings || 0)}/yr total`)
            : `Excess bed days: ${fmtNum(r.safetyBedDaysAvoided || 0)} days \u00d7 $3,132 = ${fmtK(r.excessDayCostAvoided || 0)}/yr\n${r.malpracticeReduction > 0 ? `Malpractice: beds \u00d7 $8,500 premium \u00d7 5% reduction \u00d7 scenario.safety = ${fmtK(r.malpracticeReduction)}/yr\n` : ""}${r.readmissionCostAvoidance > 0 ? `Readmissions: ${r.readmissionsAvoided} avoided \u00d7 $15,200 = ${fmtK(r.readmissionCostAvoidance)}/yr\n` : ""}= ${fmtK(r.qualitySavings || 0)}/yr total`}
          source={UKI
            ? "Harm rates: Camacho et al 2024 (BMJ Quality & Safety) \u2014 ~1.8M medication errors at care transitions across NHS England annually, 31,500 patients harmed, 36,500 excess bed days. Excess bed day cost: \u00a3400/day (NHS Reference Costs, general acute, conservative blended). Indemnity: NHS Resolution \u00a33.6bn annual settlements (NAO Oct 2025) with 30% communication-failure attribution (CRICO 2016). Duplicate testing: Bates et al (18% duplicate rate when records fragmented), \u00a335/test NHS pathology blended. Classification: cost avoidance \u2014 harm that doesn't occur, not direct budget reductions."
            : AU
            ? (r.isAgedCare ? "Harm cost A$3,000/place/yr blended (falls A$35k, pressure injuries A$10k, medication incidents A$15k; AIHW injury data), 25% attributed to information fragmentation (ACSQHC). Preventable admissions: 15% of residents/yr (AIHW Australian Health Performance Framework) at A$8,000 (IHACPA NWAU-derived), 30% attribution. Classification: cost avoidance."
              : "Excess bed days: QAHCS/AIHW baseline at A$3,100/day (IHACPA long-stay outlier weights), 35% attributed to information fragmentation (ACSQHC). Indemnity: 3% of A$20,000/bed exposure (VMIA 2025-26 benchmark). Duplicate testing: 22% duplicate rate (Banker et al 2024, RCPA) on A$12,000/bed pathology, 50% addressable. Readmissions: 6.2-10.9% Australian all-cause 30-day baseline, 0.6pp reduction (Vest et al JAMIA 2019), A$11,500/readmission. AU evidence: QLD DigiMat 12.9% decline in medication complications (Woods et al 2024); RCH Melbourne 22% mortality decrease post-EMR (South et al 2022). Classification: cost avoidance.")
            : "Excess bed days: HCUP/AHRQ ($3,132/day acute). Medication errors: Bates et al (1.8 preventable ADEs per 100 admits). Communication failures contribute to 30% of malpractice claims (CRICO 2016). Malpractice premium: Mello et al Health Affairs 2010, NPDB 2023, TDC Group 2025. Readmissions: CMS 15.6% baseline, Vest et al JAMIA 2019 (0.8pp reduction from EHR consolidation). Classification: cost avoidance \u2014 these represent harm that doesn't occur, not direct budget reductions."}
        />
      </Card>
    </div>}

    </div>

    {/* Network consolidation - only for multi-hospital/IDN */}
    {seg.network > 0 && <div ref={networkRef}>
      <Card style={{ marginBottom: 18, borderLeft: "3px solid #8e44ad" }}>
        <CTitle iconKey="network" color="#8e44ad">Network consolidation</CTitle>
        <div style={{ fontSize: F.tiny, color: C.textMid, marginBottom: 14, lineHeight: 1.5 }}>
          When a health system runs multiple hospitals, putting them all on <strong style={{ color: C.text }}>one shared archive</strong> saves money beyond just retiring duplicate systems. Two things drive these extra savings:
        </div>
        <ul style={{ margin: '0 0 12px 22px', padding: 0, fontSize: F.tiny, color: C.textMid, lineHeight: 1.55 }}>
          <li style={{ marginBottom: 6 }}><strong style={{ color: C.text }}>Shared infrastructure</strong> — one data center, network, and monitoring stack for the whole organization instead of one per hospital.</li>
          <li><strong style={{ color: C.text }}>Operational efficiency</strong> — one governance model, vendor contract, audit, and training program, not one of each per hospital.</li>
        </ul>
        <div style={{ fontSize: F.tiny, color: C.textMid, marginBottom: 14, lineHeight: 1.5 }}>
          These savings are <strong style={{ color: C.text }}>added to</strong> the decommissioning savings above and are included in the overall total at the top of this report. They are not the same numbers counted twice.
        </div>
        <div style={{ padding: "12px 16px", background: C.bg, borderRadius: 12, marginBottom: 14, fontSize: F.tiny, color: C.textMid, lineHeight: 1.6, border: `1px dashed ${C.borderLight}` }}>
          <strong style={{ color: C.textMid }}>About the duplicate systems:</strong> across your {r.org_count} facilities, about 30% of legacy systems are typically duplicates — the same software installed separately at each hospital ({fmtNum(r.duplicateSystems)} instances in your case; CHIME Digital Health Survey). The savings from retiring each duplicate are <strong style={{ color: C.text }}>already counted in the Decommission savings tile above</strong>; we list them here only to show why a multi-hospital network has so much consolidation upside. We are <strong style={{ color: C.text }}>not</strong> counting them again in this tile.
        </div>
        {r.infraConsolidation > 0 && <Row label="Shared infrastructure savings" value={fmtKts(r.infraConsolidation)} />}
        {r.standardizationSave > 0 && <Row label="Operational efficiency savings" value={fmtKts(r.standardizationSave)} />}
        <Row label="Total network consolidation savings" value={fmtKts(seg.network)} accent />
        <Methodology
          formula={"Shared infrastructure: facilities \u00d7 $250k duplicate hosting cost \u00d7 60% consolidatable + Operational efficiency: total estate \u00d7 15% \u00d7 scenario.decom"}
          plug={`Shared infrastructure: ${r.org_count} facilities \u00d7 $250k duplicate hosting / interfaces / support \u00d7 60% consolidatable = ${fmtK(r.infraConsolidation)}/yr\nOperational efficiency: ${fmtK(r.totalEstate)} estate \u00d7 15% \u00d7 scenario.decom = ${fmtK(r.standardizationSave)}/yr\n= ${fmtK(seg.network)}/yr total\n\nNote: the ${r.duplicateSystems} duplicate systems are NOT summed here. Their per-system licensing and support costs are recovered through Decommission savings above (each retired system's cost is captured there). Counting them again here would inflate the total.`}
          source={AU ? "Duplicate system rate: ~35% of systems are replicated across facilities post-merger. Shared infrastructure: A$350k per district (data centre, network, service desk, training), 60% consolidatable through a single archive. Sources: NSW/QLD health infrastructure programme data, vendor consolidation case studies." : "Duplicate system rate: ~30% of legacy systems are typically replicated across facilities in an IDN (CHIME Digital Health Survey, KLAS M&A Best Practices) — shown for context only. Shared infrastructure: AHA Hospital IT Survey post-merger ($250k per facility in duplicate hosting, network, monitoring). Operational efficiency 15%: Deloitte healthcare M&A studies (governance, vendor management, audit, and training overhead reduction from running one consolidated estate vs many separate ones)."}
        />
      </Card>
    </div>}

    {/* Academic program - only for academic medical centers */}
    {seg.academic > 0 && <div ref={academicRef}>
      <Card style={{ marginBottom: 18, borderLeft: "3px solid #e67e22" }}>
        <CTitle iconKey="graduation" color="#e67e22">Academic program savings</CTitle>
        <div style={{ fontSize: F.tiny, color: C.textMid, marginBottom: 14, lineHeight: 1.5 }}>Additional savings from retiring research databases, GME tracking systems, and teaching program administration tools.</div>
        {r.researchDecomSave > 0 && <Row label="Research system decommission" value={fmtKts(r.researchDecomSave)} />}
        {r.gmeEfficiency > 0 && <Row label="Graduate Medical Education (GME) compliance" value={fmtKts(r.gmeEfficiency)} />}
        {AU && (r.teachingEfficiency || 0) > 0 && <Row label="Teaching compliance efficiency" value={fmtKts(r.teachingEfficiency)} />}
        {r.teachingOverhead > 0 && <Row label="Teaching program overhead" value={fmtKts(r.teachingOverhead)} />}
        <Row label="Total academic savings" value={fmtKts(seg.academic)} accent />
        <Methodology
          formula={"Research decom + GME compliance efficiency + Teaching overhead reduction"}
          plug={`Research decom: ${r.researchSystems} research systems \u00d7 60% retirable \u00d7 scenario.decom = ${fmtK(r.researchDecomSave)}/yr\nGME efficiency: beds compliance \u00d7 25% improvement = ${fmtK(r.gmeEfficiency)}/yr\nTeaching overhead: 12% extra complexity \u00d7 30% addressable = ${fmtK(r.teachingOverhead)}/yr\n= ${fmtK(seg.academic)}/yr total`}
          source={"Research administration: AAMC benchmarks. GME compliance: ACGME requirements. Teaching hospital overhead: AHA Annual Survey teaching premium (~12% above non-teaching). Conservative addressability factors applied to reflect that consolidated audit trails reduce but do not eliminate complexity."}
        />
      </Card>
    </div>}

    {/* Galen */}
    {hasGalen && <div style={{ marginBottom: 24, padding: EMBED ? "clamp(18px, 3vw, 30px)" : "32px 36px", borderRadius: EMBED ? 18 : 24, background: `linear-gradient(135deg, ${C.accentPale}, ${C.surface})`, border: `1px solid ${C.accent}30` }}>
      <div style={{ fontSize: F.h3, fontWeight: 700, color: C.accent, marginBottom: 18 }}>Galen Clinical Archive: investment case</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Met label="Migration cost" value={fmtK(galenMigrationCost)} />
        <Met label="Clinical archive annual cost" value={fmtK(galenAnnualCost) + "/yr"} />
        <Met label="Payback period" value={payback.toFixed(1) + " yrs"} />
        <Met label={projYears + "-year return"} value={(() => {
          const yr3 = r.yr3R || r.yr3 || 0;
          const totalSav = projYears === 5
            ? (r.total3WithReimbursement || r.total3 || 0) + yr3 + yr3
            : (r.total3WithReimbursement || r.total3 || 0);
          const totalCost = galenMigrationCost + galenAnnualCost * projYears;
          return Math.round((totalSav - totalCost) / Math.max(1, totalCost) * 100) + "% ROI";
        })()} />
      </div>
      <div style={{ marginTop: 16, padding: "12px 16px", background: C.bg, borderRadius: 12, fontSize: F.tiny, color: C.textMuted, lineHeight: 1.6 }}>
        Payback = migration cost ÷ (annual decom savings minus annual archive cost). The {fmtK(r.decomSave)}/yr in decommission savings is only unlocked when legacy systems are safely retired. Galen enables this by providing continued access to historical data.
      </div>
    </div>}

    {/* Operational efficiency + Legal and compliance in a 2-column grid, just
        above the methodology carousel. Equal-height cards via height: 100%.
        UKI has no e-discovery/cyber module, so the Legal card is hidden and
        Operational efficiency spans the full width. */}
    <div style={{ display: 'grid', gridTemplateColumns: (UKI || (AU && !((r.ediscoverySaving || 0) > 0))) ? '1fr' : '1fr 1fr', gap: 18, marginBottom: 18 }}>

    {/* Operational efficiency */}
    <Card style={{ height: '100%', borderLeft: "3px solid #2ecc71" }}>
      <CTitle iconKey="clock" color="#2ecc71">Operational efficiency</CTitle>
      <div style={{ fontSize: F.tiny, color: C.textMid, marginBottom: 14, lineHeight: 1.5 }}>{UKI ? "IT service desk and subject access request (SAR) improvements from reducing the number of systems staff need to support and search." : "IT service desk and records request improvements from reducing the number of systems staff need to support and search."}</div>
      <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
        <div style={{ flex: 1, padding: "18px 20px", background: C.bg, borderRadius: 16, textAlign: "center" }}>
          <div style={{ fontSize: F.tiny, color: C.textMuted, marginBottom: 4 }}>Service desk tickets</div>
          <div style={{ fontSize: F.h2, fontWeight: 800, color: "#2ecc71" }}>{r.ticketsReductionPct}%</div>
          <div style={{ fontSize: F.tiny, color: C.textMuted }}>reduction</div>
          <div style={{ fontSize: F.tiny, color: C.textMid, marginTop: 8 }}>{r.ticketsBaselineMonthly}/mo → {r.ticketsAfter}/mo</div>
        </div>
        <div style={{ flex: 1, padding: "18px 20px", background: C.bg, borderRadius: 16, textAlign: "center" }}>
          <div style={{ fontSize: F.tiny, color: C.textMuted, marginBottom: 4 }}>{UKI ? "SAR turnaround" : "Records request turnaround"}</div>
          <div style={{ fontSize: F.h2, fontWeight: 800, color: "#2ecc71" }}>{r.sarReductionPct}%</div>
          <div style={{ fontSize: F.tiny, color: C.textMuted }}>faster</div>
          <div style={{ fontSize: F.tiny, color: C.textMid, marginTop: 8 }}>{r.sarDaysBefore} days → {r.sarDaysAfter} days</div>
        </div>
      </div>
      <Methodology
        formula={"Tickets/mo: legacy \u00d7 2.5 \u00d7 dq_factor (before) vs surviving \u00d7 2.5 \u00d7 60% (after). SAR: 1.5 base + 0.4/system (before) vs 0.15/surviving (after)"}
        plug={`Tickets baseline: ${r.legacy} legacy systems \u00d7 2.5/mo = ${fmtNum(r.ticketsBaselineMonthly)}/month\nTickets after: ${r.legacy - r.decom} surviving \u00d7 2.5/mo \u00d7 60% = ${fmtNum(r.ticketsAfter)}/month (${r.ticketsReductionPct}% reduction)\n${UKI ? "SAR turnaround" : "Records request"}: ${r.sarDaysBefore}d \u2192 ${r.sarDaysAfter}d (${r.sarReductionPct}% faster)`}
        source={UKI
          ? "Ticket benchmarks: ITIL service desk reporting in NHS trusts (2.5 tickets/system/month for legacy clinical systems); surviving systems generate fewer tickets through consolidated support. SAR turnaround: the ICO requires searching every system where patient data may be held \u2014 1.5 day base + 0.4 days per system, consistent with NHS information governance team reports and validated against a benchmarked Trust (42 systems \u2248 18 working days per SAR)."
          : AU
          ? "Ticket benchmarks: ITIL service desk metrics (2.5 tickets/system/month for legacy clinical systems); surviving systems generate fewer tickets through consolidated support. Records requests: 3.0 day base coordination (cross-LHD, redaction, quality review) + 0.8 days per system before consolidation vs 0.15 days per surviving system after."
          : "Ticket benchmarks: AHIMA support volume studies (2.5 tickets/system/month average for legacy clinical systems). Surviving system factor: post-archive systems run with reduced ticket volume due to consolidated access. SAR/records request: AHIMA multi-source record assembly benchmarks, HIPAA-compliant release timelines."}
      />
    </Card>

    {/* Legal & compliance — US and AU hospitals: the UKI engine has no
        e-discovery or cyber module, and AU aged care/NDIS zero it out. */}
    {!UKI && (!AU || (r.ediscoverySaving || 0) > 0) && <Card style={{ height: '100%', borderLeft: "3px solid #e74c3c" }}>
      <CTitle iconKey="shield" color="#e74c3c">Legal and compliance</CTitle>
      <div style={{ fontSize: F.tiny, color: C.textMid, marginBottom: 14, lineHeight: 1.5 }}>Medico-legal records assembly savings and cyber attack surface reduction from retiring legacy systems.</div>
      <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
        <div style={{ flex: 1, padding: "18px 20px", background: C.bg, borderRadius: 16, textAlign: "center" }}>
          <div style={{ fontSize: F.tiny, color: C.textMuted, marginBottom: 4 }}>e-Discovery savings</div>
          <div style={{ fontSize: F.h2, fontWeight: 800, color: "#e74c3c" }}>{fmtKts(r.ediscoverySaving)}</div>
          <div style={{ fontSize: F.tiny, color: C.textMid, marginTop: 6 }}>{Math.round(r.litigationCases * ts.mult)} cases{viewTimescale === 'annual' ? '/yr' : ''}, {fmtK(Math.round((r.ediscoverySaving / Math.max(1, r.litigationCases))))} saved per case</div>
        </div>
        <div style={{ flex: 1, padding: "18px 20px", background: C.bg, borderRadius: 16, textAlign: "center" }}>
          <div style={{ fontSize: F.tiny, color: C.textMuted, marginBottom: 4 }}>Cyber risk reduction</div>
          <div style={{ fontSize: F.h2, fontWeight: 800, color: "#e74c3c" }}>{r.cyberSystemsRetired}</div>
          <div style={{ fontSize: F.tiny, color: C.textMid, marginTop: 6 }}>attack surfaces eliminated</div>
        </div>
      </div>
      <Methodology
        formula={AU ? "e-Discovery: cases \u00d7 (24h before - 5h after) \u00d7 A$45/hr. Cyber: legacy systems eliminated = attack surfaces removed" : "e-Discovery: cases \u00d7 (28h before - 6h after) \u00d7 $55/hr. Cyber: legacy systems eliminated = attack surfaces removed"}
        plug={AU ? `e-Discovery: ${r.litigationCases} cases/yr \u00d7 19 hrs saved/case \u00d7 A$45/hr = ${fmtK(r.ediscoverySaving || 0)}/yr\nCyber: ${r.cyberSystemsRetired} attack surfaces eliminated` : `e-Discovery: ${r.litigationCases} cases/yr \u00d7 22 hrs saved/case \u00d7 $55/hr = ${fmtK(r.ediscoverySaving || 0)}/yr\nCyber: ${r.cyberSystemsRetired} attack surfaces eliminated`}
        source={AU
          ? "e-Discovery: ~8 medico-legal / coronial / complaint cases per 100 beds (lower than US). Records assembly: 24 hrs/case across fragmented systems vs 5 hrs from a consolidated archive, at A$45/hr health information staff rates. Cyber: average Australian data breach A$4.26m across all industries (IBM Cost of a Data Breach 2024); healthcare typically runs above average. Privacy Act 1988, Notifiable Data Breaches scheme."
          : "e-Discovery: ~12 litigation cases per 100 beds typical for US hospitals. Records assembly: 28 hrs/case (3.5 days) across fragmented systems vs 6 hrs from consolidated archive. HIM staff rate: $55/hr (BLS 2024). Cyber: avg healthcare breach $10.93m (IBM/Ponemon 2023). 90% of health systems attacked in 2024. Each legacy system on unsupported OS is an attack vector."}
      />
    </Card>}

    </div>

    {/* ═══ METHODOLOGY (animated Bento grid) ═══
        All 8 tiles share the same component; each tile is absolutely
        positioned with computed coordinates based on whether it's the
        currently-selected (large) tile or one of the 7 small slots. CSS
        transitions on top/left/width/height handle the smooth resize +
        reflow animation when the user taps a small tile. */}
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: F.body, fontWeight: 700, color: C.textMid, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="lightbulb" size={22} stroke={C.accent} /> Full methodology
        <span style={{ fontSize: F.tiny, fontWeight: 400, color: C.textMuted, marginLeft: "auto" }}>Tap a tile to expand</span>
      </div>
      <MethodologyBento
        selectedIdx={methSelectedIdx}
        onSelect={setMethSelectedIdx}
        tiles={UKI ? [
          { color: C.accent, title: "System costing", num: "01", body: <>Each legacy system is classified into three tiers with annual cost scaled by bed count and estate complexity: Enterprise (£300k base + £700/bed, e.g. a legacy PAS or EPR), Departmental (£75k + £160/bed), Standalone (£14k + £20/bed). The formulas were calibrated against the complete contract register of a large acute NHS Trust (~1,385 beds, 42 legacy systems, 2024/25 data) — defaults cover ~80% of actual estate value. Named flagship systems and "I know my spend" mode capture outlier contracts the generic formulas would miss.</> },
          { color: C.amber, title: "Clinical capacity", num: "02", body: <>Staffing uses 2.8 clinical FTEs per acute bed (NHS Digital workforce statistics 2023/24; Lord Carter review). Two evidence-based filters apply: 65% of staff are regular system users (Sinsky et al 2016; KLAS Arch Collaborative — 500k+ clinicians), and each user touches ~35% of the legacy estate. A 4% task-switching penalty per system (Bartek et al JIMI 2023, primary: 2.78M EHR audit-log events, β=0.03; corroborated by Westbrook et al JAMIA 2010 and Nuffield Trust 2020) determines minutes wasted. Hours freed are valued at £55/hr (NHS Agenda for Change mid-band with on-costs) with a 20-40% realisation rate (NHS Productive Ward), reflecting that freed time creates capacity, not automatic cash savings.</> },
          { color: C.purple, title: "Patient safety", num: "03", body: <>Harm rates come from Camacho et al 2024 (BMJ Quality & Safety): ~1.8M medication errors at care transitions across NHS England annually — 18 errors per bed/yr — with 31,500 patients harmed (0.315/bed) and 36,500 excess bed days (0.365/bed). A fragmentation index (0.6-1.2, capped at 20 systems) scales risk by the number of legacy systems, and your data quality setting adjusts it further. The error and patients-protected counts provide qualitative context; only the financial lines in the next tile enter the ROI total.</> },
          { color: C.rose, title: "Quality cost avoidance", num: "04", body: <>Three financial lines convert safety improvement into value: excess bed days avoided at £400/day (NHS Reference Costs, general acute, conservative blended); clinical negligence indemnity reduction (£7,500/bed exposure — NHS Resolution's £3.6bn annual settlements (NAO Oct 2025) across ~140k acute beds with 30% communication-failure attribution per CRICO 2016 — reduced 5%); and duplicate testing avoided (22 tests/bed/yr × 18% duplicate rate when records are fragmented (Bates et al) × £35/test NHS pathology blended). All are classified as cost avoidance: harm that doesn't occur, not direct budget reductions.</> },
          { color: "#2ecc71", title: "Confidence levels", num: "05", body: <>The Conservative / Moderate / Optimistic toggle on this report re-runs the whole model with a different multiplier set. Conservative: 85% of planned retirements land, 20% time realisation, 15% safety reduction. Moderate: 100% / 30% / 25%. Optimistic: 110% / 40% / 35%. The corridors come from NHS EPR programme consensus (decommission), NHS Productive Ward (realisation 20-40%) and Camacho et al 2024 / Gate et al 2023 (25-50% error reductions from consolidation). A benchmarked Trust's stated £16m/yr target fell between Conservative and Moderate — the corridor brackets real-world figures.</> },
          { color: "#8e44ad", title: "Real-world validation", num: "06", body: <>The model was validated against the complete application footprint of a large acute NHS Trust (~1,385 beds, dual-site merged estate): 42 unique systems (3 enterprise, 15 departmental, 24 standalone) with £16.75m/yr total contract value. Defaults alone reproduced £11.9m/yr (−26% vs the £16m target); with tier cost overrides or "I know my spend" mode the model landed within 2.5%. Four systems accounted for 78% of spend — exactly the pattern the named-flagship feature captures.</> },
          { color: C.accent, title: "Year-by-year ramp", num: "07", body: <>Savings are phased to reflect progressive legacy system retirement as data is migrated and interfaces are decommissioned. The 3-year view models 40% / 80% / 100% of steady state across Years 1-3. The 5-year view models 20% / 40% / 60% / 80% / 100% for a slower, more conservative cadence typical of larger Trusts and ICS-wide programmes. The top-of-page timescale toggle switches between these views and re-scales every figure on the report. Galen payback is calculated as migration cost ÷ (annual decommission savings minus annual archive cost).</> },
          { color: C.blue, title: "Key sources", num: "08", body: <>Camacho et al 2024, BMJ Quality & Safety (transition medication errors, harm, excess bed days) · National Audit Office Oct 2025 & NHS Resolution 2024/25 (clinical negligence) · NHS Digital workforce statistics 2023/24 · Lord Carter operational productivity review · NHS Employers Agenda for Change 2024/25 (£55/hr blended rate) · NHS Reference Costs (£400/bed-day, pathology) · Bartek et al JIMI 2023 & Westbrook et al JAMIA 2010 (system-switching cost) · Nuffield Trust 2020 (system navigation) · ICO guidance (SAR search obligations) · Benchmarked acute NHS Trust contract register (2024/25).</> },
        ] : AU ? [
          { color: C.accent, title: "System costing", num: "01", body: <>Each legacy system is classified into three tiers with annual cost scaled by organisation size and complexity: Enterprise (A$250k base + A$600/bed, e.g. a legacy EMR or PAS), Departmental (A$65k + A$140/bed), Standalone (A$12k + A$18/bed), with per-type market caps. Aged care and NDIS use sector catalogues (care platforms, medication/rostering, claims tools) at sector price points. Sources: AU state contract-derived pricing, NSW SDPR programme data, vendor case studies.</> },
          { color: C.amber, title: "Staff capacity", num: "02", body: <>Staffing uses sector ratios: hospitals 3.0 clinical staff per acute bed (NSW Health SDPR: 75,500 EMR users / 25,632 beds), aged care 1.5 headcount per place (215 care-minute mandate), NDIS 0.2 staff per participant. Two evidence-based filters apply: 65% of staff are regular system users (Sinsky et al 2016; KLAS Arch Collaborative) and each touches ~35% of the estate. A 4% task-switching penalty per system (Bartek et al JIMI 2023: 2.78M EHR audit-log events) sets minutes wasted, valued at A$65/hr (hospitals) or A$42/hr (care sectors) with a conservative realisation rate.</> },
          { color: C.blue, title: "Funding & revenue", num: "03", body: <>Hospitals: consolidation efficiency at 15% of the SURVIVING estate's admin cost (never overlapping decommission savings) plus private patient revenue recovery — ~15% of privately insured episodes in public hospitals go unbilled (VAGO 2019), 30% recoverable, valued from APRA's $3,824 average episode benefit. Aged care: 3% AN-ACC uplift on the 45% documentation-responsive revenue share, agency staffing reduction, and compliance efficiency — each with 30% attribution to system consolidation. NDIS: claims accuracy, billable utilisation, retention and compliance efficiency.</> },
          { color: C.purple, title: "Quality & safety", num: "04", body: <>Hospital harm baselines from QAHCS/AIHW with 35% attributed to information fragmentation (ACSQHC): excess bed days at A$3,100/day (IHACPA), medical indemnity at 3% of A$20,000/bed (VMIA 2025-26), duplicate testing at a 22% rate (Banker et al 2024, RCPA), readmissions at a ~10% Australian baseline with a 0.6pp reduction (Vest et al JAMIA 2019). Aged care uses falls/pressure/medication harm costs and preventable-admission rates (AIHW). AU outcome evidence: QLD DigiMat 12.9% decline in medication complications; RCH Melbourne 22% mortality decrease post-EMR. All classified as cost avoidance.</> },
          { color: "#2ecc71", title: "Confidence levels", num: "05", body: <>The Conservative / Moderate / Optimistic toggle re-runs the whole model with a different factor set. Conservative: 85% of planned retirements land, 20% time realisation, 15% safety capture. Moderate: 100% / 30% / 25%. Optimistic: 110% (capped at 100% of any single contract's value) / 40% / 35%. Every figure on this report — including the sector funding modules — scales through a genuine re-run, not a flat multiplier.</> },
          { color: "#8e44ad", title: "Scale & network", num: "06", body: <>Multi-facility programmes (LHDs/HHSs, statewide) add consolidation savings incremental to decommissioning: duplicate system elimination (35% duplication rate post-merger) and shared infrastructure at A$350k per district (data centre, network, service desk, training), 60% consolidatable through a single archive. Tertiary/teaching hospitals add a research-system module (3.5 systems per 100 beds — visible and editable, never silent) plus teaching compliance efficiency.</> },
          { color: C.accent, title: "Year-by-year ramp", num: "07", body: <>Savings are phased to reflect progressive legacy system retirement as data is migrated and interfaces are decommissioned. The 3-year view models 40% / 80% / 100% of steady state across Years 1-3. The 5-year view models 20% / 40% / 60% / 80% / 100% for the slower cadence typical of district and statewide programmes. The top-of-page timescale toggle switches between these views and re-scales every figure. Galen payback is calculated as migration cost ÷ (annual decommission savings minus annual archive cost).</> },
          { color: C.blue, title: "Key sources", num: "08", body: <>IHACPA NEP 2025-26 (A$7,258/NWAU) · AIHW admitted patient care 2023-24 · ACSQHC safety reports · QAHCS (Wilson et al) · VMIA 2025-26 indemnity benchmarks · APRA PHI benefits Dec 2024 · VAGO 2019 (unbilled private episodes) · NSW Health SDPR · AN-ACC funding model (health.gov.au) · StewartBrown FY25 aged-care survey · NDIA quarterly reports 2024-25 · Bartek et al JIMI 2023 · Vest et al JAMIA 2019 · Woods et al 2024 (QLD DigiMat) · South et al 2022 (RCH Melbourne).</> },
        ] : [
          { color: C.accent, title: "System costing", num: "01", body: <>Each legacy system is classified into three tiers (enterprise, departmental, or standalone) with costs scaled by bed count. Enterprise systems (e.g. legacy EHR) cost $150k to $1.5m+ base plus $650 to $7,500 per bed. Departmental systems run $80k to $350k plus $200 to $900 per bed. Standalone tools are $50k to $200k plus $120 to $620 per bed. Source: KLAS 2025 benchmarks, Becker's Hospital Review.</> },
          { color: C.amber, title: "Clinical capacity", num: "02", body: <>Not all staff use all systems. We apply two evidence-based filters: 65% of staff are regular system users (Sinsky et al 2016; KLAS Arch Collaborative — 500k+ clinicians analyzed), and each user interacts with ~35% of the legacy estate. A 4% productivity penalty per system touched (Bartek et al JIMI 2023, primary: 2.78M EHR audit-log events, β=0.03; corroborated by Westbrook et al JAMIA 2010) determines time wasted. Hours freed are valued at $95/hr with 30% realization, reflecting that freed time creates capacity, not direct savings.</> },
          { color: C.blue, title: "CMS reimbursement", num: "03", body: <>Three CMS penalty programs are modeled: Hospital Readmissions Reduction Program (HRRP, up to 3% of base DRG, FY2025 data), Hospital-Acquired Condition Reduction (HAC, 1% for bottom quartile), and Value-Based Purchasing (VBP, 2% withhold pool). Denial recovery uses HFMA's 4.8% net revenue loss benchmark. Better documentation from system consolidation improves coding accuracy, reduces denials, and lowers penalty exposure. Evidence: Pattar et al JAMA 2025, Vest et al JAMIA 2019.</> },
          { color: C.purple, title: "Patient safety", num: "04", body: <>ADE rates from <a href="https://qualityindicators.ahrq.gov/measures/psi_resources" target="_blank" rel="noopener" style={{color:"#0563C1",textDecoration:"underline"}}>AHRQ Patient Safety Indicators</a> and HHS OIG 2022 (25% of Medicare patients experience adverse events). Preventable ADEs: 1.8 per 100 admissions (Bates et al). Excess bed day cost: $3,132/day (KFF/AHA 2023). Readmission avoidance: Vest et al JAMIA 2019 found 0.8pp absolute reduction in 30-day readmissions from single-vendor EHR consolidation; we apply 30% fragmentation attribution. Communication failures account for 30% of malpractice claims (CRICO 2016). These are cost avoidance figures: harm that doesn't occur, not direct budget reductions.</> },
          { color: "#8e44ad", title: "Network savings", num: "05", body: <>For IDNs and multi-hospital systems, this captures savings <strong>incremental to decommissioning</strong> (not double-counted). Two components: shared infrastructure consolidation ($250k/facility for data center, network and monitoring tools that aren't tied to specific systems, 60% consolidatable through a single archive) and cross-facility operational efficiency (15% of estate cost addressable through unified governance, vendor management, audit and training). The 30% duplicate-instance rate (CHIME Digital Health Survey) is shown as context but excluded from the sum — retired duplicates are already captured in the decommissioning savings above.</> },
          { color: "#e67e22", title: "Academic impact", num: "06", body: <>Academic medical centers maintain additional legacy systems for research databases, GME (Graduate Medical Education) tracking, and teaching program administration. These are costed at the same tier-based rates with an additional compliance efficiency factor from consolidated audit trails. Based on AAMC benchmarks for academic system overhead and ACGME reporting requirements.</> },
          { color: C.accent, title: "Year-by-year ramp", num: "07", body: <>Savings are phased to reflect progressive legacy system retirement. The 3-year view models 40% / 80% / 100% of steady state across Years 1-3. The 5-year view models 20% / 40% / 60% / 80% / 100% to reflect a slower, more conservative implementation cadence typical of larger health systems. The top-of-page timescale toggle switches between these views and re-scales every figure on the report. Galen payback is calculated as migration cost ÷ (annual decom savings minus annual archive cost).</> },
          { color: C.blue, title: "Key sources", num: "08", body: <>KLAS Research (Best in KLAS 2025 Data Archiving) · HIMSS Analytics (system usage patterns) · AHRQ Patient Safety Indicators · CMS Hospital Compare (HRRP, HAC, VBP penalty data) · HFMA (denial management benchmarks) · KFF/AHA (cost per bed day) · CRICO Strategies (malpractice analysis) · Bates et al, JAMA (ADE rates) · Westbrook et al, JAMIA 2010 (system switching costs) · CHIME Digital Health Survey (duplicate systems in IDNs).</> },
        ]}
      />

    </div>

    {/* Actions */}
    <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "16px 0 24px" }}>
      <button onClick={onAdjust} style={{
        padding: EMBED ? "14px 32px" : "22px 44px", borderRadius: EMBED ? 14 : 18, border: `2px solid ${C.accent}`,
        background: "transparent", color: C.accent, fontSize: F.body, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit"
      }}>← Adjust inputs</button>
      <button onClick={onStartOver} style={{
        padding: EMBED ? "14px 32px" : "22px 44px", borderRadius: EMBED ? 14 : 18, border: `1px solid ${C.border}`,
        background: C.surface, color: C.textMid, fontSize: F.body, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit"
      }}>New case ↻</button>
    </div>
  </div>;
}

/**
 * KpiCard - displays one large numeric KPI with label and sub-text.
 *
 * Accepts EITHER:
 *   - amount (numeric): rendered as <AnimK> so it animates on timescale change
 *   - value (any JSX/string): rendered as-is (for non-numeric KPIs like "X FTE freed")
 *
 * Why two props instead of just one? Passing <AnimK> as a value prop from the
 * call site looked clean but didn't reliably preserve AnimK's component state
 * across re-renders when ts.mult changed, because React reconciles JSX-via-prop
 * children differently from direct JSX children. Rendering AnimK INSIDE
 * KpiCard from a plain numeric prop guarantees the same component instance
 * persists across renders, so useState/useRef in useCountUp keep the previous
 * value and animate to the new target instead of always resetting to 0.
 *
 * Same fix applied to CompositionItem below.
 */
function KpiCard({ label, amount, value, sub, color, iconKey, onClick }) {
  return <div onClick={onClick} style={{ padding: "24px 22px", background: C.surface, borderRadius: 18, border: `1px solid ${color}25`, cursor: "pointer", transition: "border-color .2s" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <Icon name={iconKey} size={26} stroke={color} />
      <span style={{ fontSize: F.tiny, fontWeight: 600, color: C.textMuted }}>{label}</span>
    </div>
    <div style={{ fontSize: F.h1, fontWeight: 800, color, marginBottom: 4 }}>
      {amount != null ? <AnimK value={amount} /> : value}
    </div>
    <div style={{ fontSize: F.tiny, color: C.textMid }}>{sub}</div>
    <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, marginTop: 8 }}>View details ↓</div>
  </div>;
}

function CompositionItem({ color, dotColor, label, amount, pct }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width: 10, height: 10, borderRadius: 3, background: dotColor || color }} />
    <span style={{ fontSize: F.tiny, color: C.textMid }}>{label}: <strong style={{ color }}><AnimK value={amount} /></strong> ({pct}%)</span>
  </div>;
}

function CTitle({ iconKey, children, color }) {
  return <div style={{ fontSize: F.body, fontWeight: 700, color: C.textMid, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}><Icon name={iconKey} size={24} stroke={color || C.accent} /> {children}</div>;
}
function Row({ label, value, accent }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
    <span style={{ fontSize: F.small, color: C.textMid }}>{label}</span>
    <span style={{ fontSize: F.body, fontWeight: accent ? 800 : 600, color: accent ? C.accent : C.text }}>{value}</span>
  </div>;
}
function Met({ label, value }) {
  return <div><div style={{ fontSize: F.tiny, color: C.textMuted }}>{label}</div><div style={{ fontSize: F.h2, fontWeight: 800, color: C.accent }}>{value}</div></div>;
}
/**
 * Animated Bento grid of 8 methodology tiles.
 *
 * Layout when tile X is selected:
 *
 *   ┌───────────────┬──────┐
 *   │               │ s[0] │
 *   │   LARGE (X)   ├──────┤
 *   │               │ s[1] │
 *   │               ├──────┤
 *   │               │ s[2] │
 *   ├──────┬────────┴──────┤
 *   │ s[3] │     s[4]      │
 *   ├──────┼───────────────┤
 *   │ s[5] │     s[6]      │
 *   └──────┴───────────────┘
 *
 * Each tile is absolutely positioned and receives a CSS transition on
 * top/left/width/height, so when the selection changes the tiles smoothly
 * resize and reflow into their new positions rather than swapping content
 * inside a static large slot.
 *
 * Slot conventions:
 *   slot === -1                  → tile is the LARGE one
 *   0..2 (right column top)      → 1st, 2nd, 3rd unselected tiles
 *   3..6 (bottom 2×2)            → 4th, 5th, 6th, 7th unselected tiles
 *                                  arranged top-left, top-right,
 *                                  bottom-left, bottom-right.
 */
function MethodologyBento({ tiles, selectedIdx, onSelect }) {
  const LARGE_H = 380;
  const BOTTOM_H = 240;
  const GAP = 14;
  const TOTAL_H = LARGE_H + GAP + BOTTOM_H;

  // Position style for a given slot. Uses % for horizontal so it adapts
  // to whatever width the parent container has on the kiosk (typically
  // ~970px after page padding); uses px for vertical because the heights
  // are fixed.
  const styleForSlot = (slot) => {
    if (slot === -1) {
      // LARGE: top-left of the top section, ~75% width, full top-section height.
      return { top: 0, left: 0, width: `calc(75% - ${GAP/2}px)`, height: LARGE_H };
    }
    if (slot >= 0 && slot <= 2) {
      // Right column of top section: 3 stacked tiles, 25% width.
      const slotH = (LARGE_H - 2 * GAP) / 3;
      return {
        top: slot * (slotH + GAP),
        left: `calc(75% + ${GAP/2}px)`,
        width: `calc(25% - ${GAP/2}px)`,
        height: slotH,
      };
    }
    // Bottom 2x2 grid: slots 3,4,5,6 → cells (0,0), (0,1), (1,0), (1,1).
    const idx = slot - 3;
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const slotH = (BOTTOM_H - GAP) / 2;
    return {
      top: LARGE_H + GAP + row * (slotH + GAP),
      left: col === 0 ? 0 : `calc(50% + ${GAP/2}px)`,
      width: `calc(50% - ${GAP/2}px)`,
      height: slotH,
    };
  };

  // Map every tile index to its slot for the current selection.
  // The selected tile is -1 (large); the others fill slots 0..6 in their
  // original-array order (so promotion is a swap with the previously-selected
  // tile's slot).
  const slotForTile = (tileIdx) => {
    if (tileIdx === selectedIdx) return -1;
    let nonSel = 0;
    for (let i = 0; i < tiles.length; i++) {
      if (i === selectedIdx) continue;
      if (i === tileIdx) return nonSel;
      nonSel++;
    }
    return 0;
  };

  // Smooth tile transition. Easing chosen for a natural settle (slight overshoot
  // is intentionally avoided so the layout stays predictable in dense reports).
  const TRANSITION = "top 0.45s cubic-bezier(0.65,0,0.25,1), left 0.45s cubic-bezier(0.65,0,0.25,1), width 0.45s cubic-bezier(0.65,0,0.25,1), height 0.45s cubic-bezier(0.65,0,0.25,1), border-color 0.3s ease, box-shadow 0.3s ease";

  return <div className={EMBED ? 'embed-bento' : undefined} style={{ position: 'relative', width: '100%', height: TOTAL_H }}>
    {tiles.map((tile, idx) => {
      const slot = slotForTile(idx);
      const isLarge = slot === -1;
      const pos = styleForSlot(slot);
      return <div
        key={idx}
        className={EMBED ? ('embed-bento-tile' + (isLarge ? ' embed-bento-large' : '')) : undefined}
        onClick={isLarge ? undefined : () => onSelect(idx)}
        style={{
          position: 'absolute',
          ...pos,
          background: C.surface,
          borderRadius: isLarge ? 20 : 14,
          border: `${isLarge ? 2 : 1}px solid ${tile.color}${isLarge ? '55' : '30'}`,
          boxShadow: isLarge ? `0 0 0 1px ${tile.color}12, 0 8px 24px -8px ${tile.color}25` : 'none',
          cursor: isLarge ? 'default' : 'pointer',
          overflow: 'hidden',
          transition: TRANSITION,
          padding: isLarge ? "26px 28px" : "14px 16px",
          display: 'flex',
          flexDirection: 'column',
          gap: isLarge ? 12 : 6,
          boxSizing: 'border-box',
        }}
      >
        {/* Header (number badge + title) - always visible, scales between
            states. The badge and title use slightly different sizes for
            large vs small but the same structure so the DOM doesn't reshape. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isLarge ? 14 : 8, flexShrink: 0 }}>
          <span style={{
            width: isLarge ? 44 : 28,
            height: isLarge ? 44 : 28,
            borderRadius: '50%',
            background: tile.color + '20',
            color: tile.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isLarge ? F.small : 11,
            fontWeight: 800,
            flexShrink: 0,
            transition: 'width 0.45s, height 0.45s, font-size 0.45s',
          }}>{tile.num}</span>
          <span style={{
            fontSize: isLarge ? F.h3 : F.tiny,
            fontWeight: 700,
            color: tile.color,
            lineHeight: 1.2,
            transition: 'font-size 0.45s',
          }}>{tile.title}</span>
        </div>

        {/* Body — fades in only when the tile is large. Slight delay so the
            text appears once the tile has finished growing, avoiding cramped
            text mid-animation. */}
        <div className={EMBED ? 'embed-bento-body' : undefined} style={{
          fontSize: F.small,
          color: C.textMid,
          lineHeight: 1.7,
          flex: 1,
          opacity: isLarge ? 1 : 0,
          transition: isLarge ? 'opacity 0.25s ease 0.2s' : 'opacity 0.15s ease',
          overflow: 'hidden',
          pointerEvents: isLarge ? 'auto' : 'none',
        }}>{tile.body}</div>

        {/* 'Tap to expand →' hint — only visible on small tiles. */}
        <div style={{
          fontSize: 11,
          color: C.textMuted,
          fontWeight: 600,
          alignSelf: 'flex-end',
          opacity: isLarge ? 0 : 1,
          transition: 'opacity 0.2s ease',
          flexShrink: 0,
        }}>Tap to expand →</div>
      </div>;
    })}
  </div>;
}

import React, { useState } from 'react';
import { C, F, fmtNum, fmtK, FACILITY_TYPES, FACILITY_GROUPS } from '../theme';
import { Card, BigChoice, SectionTitle, TouchSlider, Stepper, SegmentedControl, InfoTip } from '../components';
import { Icon } from '../components/Icons';

// Build-time flag: '1' when built with `--mode embed`; sizing only.
const EMBED = import.meta.env.VITE_EMBED === '1';
import { KNOWN_SYSTEMS, systemCost } from '../calc/vendors.index.js';
import { UKI } from '../market';
import { PRESETS as PRESETS_UKI, ORG_TYPES } from '../calc/presets.uki';

const TIER_TYPES = {
  enterprise: ["EHR","Legacy EHR","EHR/Integration","Ambulatory EHR","Ambulatory EHR/RCM","Revenue Cycle"],
  departmental: ["Pharmacy/Dispensing","Pharmacy","OB/Perinatal","Oncology","ICU/Critical Care","Behavioral Health","Post-Acute/Rehab","Laboratory","PACS","Radiology/RIS","Cardiology/CVIS"],
  niche: ["Document Management","Integration Engine","CDI/Coding","Clinical Documentation","Dictation/Transcription","Clinical Communication","Incident/Risk","Infection Control","Workforce/Scheduling","Data Warehouse"],
};

// Cost slider ranges per tier - matches tierCost() in engine for typical values
const TIER_COST_RANGE = {
  enterprise:   { min: 250000, max: 5000000, step: 50000, default: 1000000, label: "Enterprise" },
  departmental: { min: 25000,  max: 500000,  step: 10000, default: 200000,  label: "Departmental" },
  niche:        { min: 5000,   max: 100000,  step: 5000,  default: 30000,   label: "Standalone" },
};

// On-screen QWERTY keyboard for the kiosk - guaranteed to work regardless of OS/touchscreen
// keyboard configuration. Used by CustomSystemModal for the system-name input.
function OnScreenKeyboard({ value, onChange, onDone, maxLen = 40 }) {
  const [shift, setShift] = useState(true); // start uppercase for first letter
  const numRow = ['1','2','3','4','5','6','7','8','9','0'];
  const rows = shift ? [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M'],
  ] : [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
  ];
  const press = (k) => {
    if (value.length >= maxLen) return;
    onChange(value + k);
    if (shift) setShift(false);
  };
  const back = () => onChange(value.slice(0, -1));
  const space = () => { if (value.length < maxLen) onChange(value + ' '); };
  const keyStyle = (extraStyle = {}) => ({
    flex: 1, padding: '18px 0', borderRadius: 12, border: '1px solid ' + C.border,
    background: C.surface, color: C.text, fontSize: 22, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', minWidth: 0, ...extraStyle
  });
  const wideStyle = (extraStyle = {}) => ({
    ...keyStyle(),
    flex: 1.6, fontSize: 16, fontWeight: 700, color: C.textMid, ...extraStyle
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {numRow.map(k => <button key={k} onClick={() => press(k)} style={keyStyle()}>{k}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {rows[0].map(k => <button key={k} onClick={() => press(k)} style={keyStyle()}>{k}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6, paddingLeft: 24, paddingRight: 24 }}>
        {rows[1].map(k => <button key={k} onClick={() => press(k)} style={keyStyle()}>{k}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setShift(s => !s)} style={wideStyle({ background: shift ? C.accent + '30' : C.surface, color: shift ? C.accent : C.textMid, borderColor: shift ? C.accent : C.border })}>⇧ Shift</button>
        {rows[2].map(k => <button key={k} onClick={() => press(k)} style={keyStyle()}>{k}</button>)}
        <button onClick={back} style={wideStyle()}>⌫</button>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => press('-')} style={keyStyle({ flex: 0.6 })}>-</button>
        <button onClick={() => press('.')} style={keyStyle({ flex: 0.6 })}>.</button>
        <button onClick={space} style={keyStyle({ flex: 4, color: C.textMuted })}>space</button>
        <button onClick={() => press('/')} style={keyStyle({ flex: 0.6 })}>/</button>
        <button onClick={onDone} style={keyStyle({ flex: 1.4, background: C.accent, color: C.onAccent, borderColor: C.accent, fontWeight: 800 })}>Done</button>
      </div>
    </div>
  );
}

// Modal for adding a custom (not-in-list) legacy system. Includes on-screen keyboard
// and cost slider scoped to the tier.
function CustomSystemModal({ tier, color, onAdd, onCancel }) {
  const range = TIER_COST_RANGE[tier];
  const [name, setName] = useState('');
  const [cost, setCost] = useState(range.default);
  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ label: trimmed, cost });
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: C.scrim, zIndex: 99998, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
      <div style={{ background: C.surface, padding: '28px 32px', borderRadius: 24, border: '1px solid ' + C.border, width: '100%', maxWidth: 920, marginTop: 60 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>{range.label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Add a system not in the list</div>
        <div style={{ fontSize: F.tiny, color: C.textMuted, marginBottom: 20 }}>Type the system name, then set its annual cost.</div>

        {/* Name display + on-screen keyboard */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>System name</div>
          <div style={{ minHeight: 60, padding: '14px 18px', background: C.bg, border: '2px solid ' + (name ? color : C.border), borderRadius: 12, fontSize: 22, fontWeight: 600, color: name ? C.text : C.textMuted, marginBottom: 12 }}>
            {name || <span style={{ opacity: 0.5 }}>Tap keys below to type...</span>}
            {name && <span style={{ display: 'inline-block', width: 2, height: 22, background: color, marginLeft: 2, verticalAlign: 'middle', animation: 'caret-blink 1s infinite' }} />}
          </div>
          <style>{'@keyframes caret-blink { 50% { opacity: 0; } }'}</style>
          <OnScreenKeyboard value={name} onChange={setName} onDone={handleAdd} maxLen={40} />
        </div>

        {/* Cost slider */}
        <div style={{ marginTop: 20, marginBottom: 20, padding: '18px 20px', background: C.bg, borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>Annual cost</span>
            <span style={{ fontSize: 30, fontWeight: 800, color }}>{fmtK(cost)}/yr</span>
          </div>
          <input type="range" min={range.min} max={range.max} step={range.step} value={cost}
            onChange={e => setCost(Number(e.target.value))}
            style={{ width: '100%', accentColor: color, cursor: 'pointer', height: 36 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textMuted, marginTop: 4 }}>
            <span>{fmtK(range.min)}</span>
            <span>{fmtK(range.max)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '14px 28px', borderRadius: 12, border: '1px solid ' + C.border, background: 'transparent', color: C.textMid, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleAdd} disabled={!name.trim()} style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: name.trim() ? color : C.border, color: name.trim() ? C.inkOnColor : C.textMuted, fontSize: 16, fontWeight: 800, cursor: name.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>Add system</button>
        </div>
      </div>
    </div>
  );
}

// STEP 1: Scope + Reimbursement
export function ProviderStep({ providerType, onSelect, reimbursementModel, setReimbursementModel }) {
  return <div>
    <SectionTitle number="1">Select your program scope</SectionTitle>
    <BigChoice options={[
      { key: "critical_access", label: "Critical Access / Rural", desc: "≤25 beds, limited legacy estate", iconKey: "hospital" },
      { key: "community", label: "Community Hospital", desc: "100-400 beds, moderate complexity", iconKey: "community" },
      { key: "regional", label: "Regional Medical Center", desc: "400-1,000 beds, multiple service lines", iconKey: "regional" },
      { key: "academic", label: "Academic Medical Center", desc: "Teaching hospital, research systems", iconKey: "academic" },
      { key: "multi_hospital", label: "IDN / Community Health System", desc: "3-5 hospitals, 800-1,500 beds, ambulatory and post-acute sites", iconKey: "idn" },
    ]} value={providerType} onChange={onSelect} />
    <div style={{ marginTop: 28 }}>
      <SegmentedControl label="Reimbursement model" value={reimbursementModel} onChange={setReimbursementModel} options={[
        { key: "ffs", label: "Fee-for-Service" }, { key: "vbc", label: "Value-Based" }, { key: "mixed", label: "Mixed" },
      ]} />
    </div>
  </div>;
}

// STEP 2: Journey
export function JourneyStep({ journey, onSelect }) {
  return <div>
    <SectionTitle number="2">{UKI ? "Where are you on your EPR journey?" : "Where are you on your EHR journey?"}</SectionTitle>
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {(UKI ? [
        { key: "HAVE_EPR", label: "We want to decommission systems", desc: "You have (or are keeping) your EPR. Retire and archive the legacy estate around it.", iconKey: "check", focus: "Archiving + decommission savings" },
        { key: "EVALUATING", label: "We're evaluating enterprise EPRs", desc: "Assessing migration to a single EPR platform. Need the full case for migration and archiving.", iconKey: "search", focus: "Migration safety + archiving savings" },
      ] : [
        { key: "HAVE_EPR", label: "We have an enterprise EHR", desc: "Already on Epic, Oracle Health or similar. Looking to archive and decommission legacy systems.", iconKey: "check", focus: "Archiving + decommission savings" },
        { key: "EVALUATING", label: "We're evaluating enterprise EHRs", desc: "Assessing migration to a single EHR platform. Need the full case for migration and archiving.", iconKey: "search", focus: "Migration safety + archiving savings" },
      ]).map(j => <button key={j.key} onClick={() => onSelect(j.key)} style={{
        padding: EMBED ? "clamp(18px, 2.6vw, 26px)" : "32px 30px", textAlign: "left", cursor: "pointer",
        border: journey === j.key ? `${EMBED ? 2 : 3}px solid ${C.accent}` : `1px solid ${C.border}`,
        borderRadius: EMBED ? 16 : 22, background: journey === j.key ? C.accentPale : C.surface, transition: "all .2s"
      }}>
        <div style={{ marginBottom: 12 }}><Icon name={j.iconKey} size={36} stroke={journey === j.key ? C.accent : C.textMid} /></div>
        <div style={{ fontSize: F.h3, fontWeight: 700, color: journey === j.key ? C.accent : C.text, marginBottom: 8 }}>{j.label}</div>
        <div style={{ fontSize: F.body, color: C.textMuted, lineHeight: 1.6, marginBottom: 12 }}>{j.desc}</div>
        <div style={{ fontSize: F.small, fontWeight: 600, color: journey === j.key ? C.accent : C.textMid, padding: "6px 14px", background: journey === j.key ? C.accent + "15" : C.bg, borderRadius: 8, display: "inline-block" }}>{j.focus}</div>
      </button>)}
    </div>
  </div>;
}

// STEP 3: Facilities
export function FacilitiesStep({ inputs, update, facilities, setFacility }) {
  return <div>
    <SectionTitle number="3">Your facility portfolio</SectionTitle>
    {/* Hospitals with beds */}
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Icon name="hospital" size={32} stroke={C.textMid} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: F.h3, fontWeight: 700, color: C.text }}>Hospitals</div>
          <div style={{ fontSize: F.small, color: C.textMuted }}>Acute inpatient facilities</div>
        </div>
      </div>
      <Stepper label="Hospital count" value={inputs.org_count} min={1} max={50} onChange={v => {
        const avgBeds = Math.round(inputs.bed_count / Math.max(1, inputs.org_count));
        update("org_count", v);
        update("bed_count", avgBeds * v);
      }} />
      <TouchSlider label="Total acute beds" value={inputs.bed_count} min={10} max={Math.max(5000, inputs.bed_count + 500)} step={10} onChange={v => update("bed_count", v)} format={fmtNum}
        tip="Total staffed beds across all hospitals. Drives staffing, revenue, and safety metrics." />
      <div style={{ fontSize: F.small, color: C.textMuted, background: C.bg, padding: "10px 14px", borderRadius: 10 }}>
        Average: {Math.round(inputs.bed_count / Math.max(1, inputs.org_count))} beds per hospital
      </div>
    </Card>

    {/* Other facilities. Embed: split into Ambulatory / Post-acute /
        Ancillary & specialty sections; kiosk keeps the flat list. */}
    <div style={{ fontSize: F.body, fontWeight: 600, color: C.textMid, marginBottom: 12, marginTop: 8 }}>Other facilities in scope</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {(EMBED ? FACILITY_GROUPS.flatMap(g => [
        { header: true, key: "hdr-" + g.key, label: g.label },
        ...FACILITY_TYPES.filter(ft => ft.key !== "hospitals" && ft.group === g.key),
      ]) : FACILITY_TYPES.filter(ft => ft.key !== "hospitals")).map(ft => {
        if (ft.header) {
          return <div key={ft.key} style={{
            fontSize: F.tiny, fontWeight: 700, color: C.textMuted, letterSpacing: 2,
            textTransform: "uppercase", margin: "14px 2px 2px",
          }}>{ft.label}</div>;
        }
        const count = facilities[ft.key] || 0;
        return <div key={ft.key} style={{
          display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
          background: count > 0 ? C.accentPale : C.surface, borderRadius: 16,
          border: `1px solid ${count > 0 ? C.accent + "30" : C.border}`, transition: "all .2s"
        }}>
          <Icon name={ft.iconKey} size={22} stroke={count > 0 ? C.accent : C.textMid} />
          <span style={{ flex: 1, fontSize: F.body, fontWeight: 600, color: count > 0 ? C.accent : C.textMid }}>{ft.label}</span>
          <button onClick={() => setFacility(ft.key, Math.max(0, count - 1))} style={{
            width: 48, height: 48, borderRadius: 12, border: `1px solid ${C.border}`,
            background: C.surface, color: C.textMid, fontSize: 24, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit"
          }}>−</button>
          <span style={{ fontSize: F.h2, fontWeight: 800, color: count > 0 ? C.accent : C.textMuted, minWidth: 50, textAlign: "center" }}>{count}</span>
          <button onClick={() => setFacility(ft.key, count + 1)} style={{
            width: 48, height: 48, borderRadius: 12, border: `1px solid ${C.border}`,
            background: C.surface, color: C.textMid, fontSize: 24, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit"
          }}>+</button>
        </div>;
      })}
    </div>
  </div>;
}

// STEP 4: Systems
export function SystemsStep({ inputs, updateTier, flagships, addFlagship, removeFlagship, updateFlagshipCost, updateFlagshipInstances, costMode, setCostMode, knownSpend, setKnownSpend }) {
  const [openTier, setOpenTier] = useState(null);
  const [selected, setSelected] = useState([]);
  const [customTier, setCustomTier] = useState(null); // when set, modal is open for that tier
  const tiers = [
    { key: "enterprise", label: "Enterprise", color: C.accent, hint: UKI ? "Including legacy EPR / PAS" : "Including legacy EHR, ERP, RCM", max: Math.max(10, inputs.tiers.enterprise + 3) },
    { key: "departmental", label: "Departmental", color: C.blue, hint: UKI ? "Including LIMS, PACS, pharmacy, maternity, theatres, e-obs" : "Including laboratory, pharmacy, perinatal, imaging/PACS, cardiology, and radiology", max: Math.max(30, inputs.tiers.departmental + 5) },
    { key: "niche", label: "Standalone", color: C.purple, hint: UKI ? "Including document stores, ECM, scanned notes, rostering" : "Including document stores, data warehouses, scanned notes", max: Math.max(100, inputs.tiers.niche + 10) },
  ];
  const sliderTotal = inputs.tiers.enterprise + inputs.tiers.departmental + inputs.tiers.niche;
  // Count each flagship by its instances (default 1) so the totals reflect
  // multi-instance entries like 'Epic × 3' as 3 systems, not 1.
  const flagshipInstanceCount = flagships.reduce((s, f) => s + (f.instances || 1), 0);
  const total = sliderTotal + flagshipInstanceCount;

  return <div>
    <SectionTitle number="4">Legacy systems</SectionTitle>

    {/* Cost mode toggle */}
    <div style={{ marginBottom: 20 }}>
      <SegmentedControl value={costMode} onChange={setCostMode} options={[
        { key: "estimate", label: "Estimate costs" }, { key: "known", label: "I know my spend" },
      ]} />
    </div>

    {costMode === "known" && <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: F.body, fontWeight: 600, color: C.textMid }}>Total annual legacy system spend</span>
        <span style={{ fontSize: F.h2, fontWeight: 800, color: C.accent }}>{fmtK(knownSpend)}/yr</span>
      </div>
      <input type="range" min={0} max={20000000} step={100000} value={knownSpend}
        onChange={e => setKnownSpend(Number(e.target.value))}
        style={{ width: "100%", cursor: "pointer", accentColor: C.accent }} />
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
        <button onClick={() => setKnownSpend(Math.max(0, knownSpend - 100000))} style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid " + C.border, background: C.surface, color: C.textMid, fontSize: 22, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
        <div style={{ fontSize: F.tiny, color: C.textMuted, display: "flex", alignItems: "center" }}>±$100k</div>
        <button onClick={() => setKnownSpend(Math.min(20000000, knownSpend + 100000))} style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid " + C.border, background: C.surface, color: C.textMid, fontSize: 22, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
      </div>
      {knownSpend > 0 && <div style={{ fontSize: F.small, color: C.textMuted, marginTop: 8, textAlign: "center" }}>
        {total} systems · {fmtK(Math.round(knownSpend / Math.max(1, total)))}/system avg
      </div>}
    </Card>}

    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {tiers.map(t => {
        const tierSystems = KNOWN_SYSTEMS.filter(s => (TIER_TYPES[t.key] || []).includes(s.type));
        const tierFlagships = flagships.filter(f => f.tier === t.key);
        return <Card key={t.key} style={{ border: `1px solid ${t.color}30`, ...(EMBED ? {} : { padding: "24px 28px" }) }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: F.h3, fontWeight: 700, color: t.color }}>{t.label}</span>
              <div style={{ fontSize: F.tiny, color: C.textMuted, marginTop: 2 }}>{t.hint}</div>
            </div>
            <span style={{ fontSize: 36, fontWeight: 800, color: t.color }}>{inputs.tiers[t.key]}</span>
          </div>
          <input type="range" min={0} max={t.max} step={1} value={inputs.tiers[t.key]}
            onChange={e => updateTier(t.key, Number(e.target.value))}
            style={{ width: "100%", cursor: "pointer", accentColor: t.color }} />
          {tierFlagships.length > 0 && <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: F.tiny, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>In addition to the {inputs.tiers[t.key]} above:</div>
            {tierFlagships.map((f, fi) => {
              const fIdx = flagships.indexOf(f);
              const step = f.cost > 500000 ? 50000 : f.cost > 100000 ? 25000 : 10000;
              const instances = f.instances || 1;
              const hasMultiple = instances > 1;
              return <div key={fi} style={{ background: C.bg, borderRadius: 12, marginBottom: 6 }}>
                {/* Main row: name, cost adjuster, multi-instance checkbox, remove */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
                  <span style={{ fontSize: F.tiny, fontWeight: 600, color: t.color, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  <button onClick={() => updateFlagshipCost(fIdx, f.cost - step)} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.textMid, fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}>−</button>
                  <span style={{ fontSize: F.small, fontWeight: 700, color: t.color, minWidth: 70, textAlign: "center" }}>{fmtK(f.cost)}</span>
                  <button onClick={() => updateFlagshipCost(fIdx, f.cost + step)} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.textMid, fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}>+</button>
                  <span style={{ fontSize: F.tiny, color: C.textMuted, flexShrink: 0 }}>/yr each</span>
                  {/* Multiple instances toggle. Checking it bumps instances 1→2 as a sensible
                      default (IDNs typically have 2+ duplicates); unchecking returns to 1. */}
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: F.tiny, color: hasMultiple ? t.color : C.textMuted, cursor: "pointer", padding: "6px 10px", borderRadius: 8, border: `1px solid ${hasMultiple ? t.color : C.borderLight}`, background: hasMultiple ? t.color + "12" : 'transparent', flexShrink: 0, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={hasMultiple}
                      onChange={e => updateFlagshipInstances(fIdx, e.target.checked ? 2 : 1)}
                      style={{ width: 16, height: 16, accentColor: t.color, cursor: "pointer" }}
                    />
                    Multiple
                  </label>
                  <button onClick={() => removeFlagship(fIdx)} style={{ width: 36, height: 36, border: "none", background: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                </div>
                {/* Instance counter row — only shown when 'Multiple' is checked.
                    Lets the user dial in 2, 3, 4 instances (e.g. an IDN with 4 hospitals
                    each running their own Epic). Shows the multiplied total alongside. */}
                {hasMultiple && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px 10px 12px", borderTop: `1px dashed ${C.borderLight}`, paddingTop: 10, marginTop: 2 }}>
                    <span style={{ fontSize: F.tiny, fontWeight: 600, color: C.textMuted, flex: 1 }}>Number of instances across your network:</span>
                    <button onClick={() => updateFlagshipInstances(fIdx, instances - 1)} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.textMid, fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}>−</button>
                    <span style={{ fontSize: F.small, fontWeight: 800, color: t.color, minWidth: 36, textAlign: "center" }}>{instances}</span>
                    <button onClick={() => updateFlagshipInstances(fIdx, instances + 1)} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.textMid, fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}>+</button>
                    <span style={{ fontSize: F.tiny, color: C.textMid, flexShrink: 0, marginLeft: 8 }}>= <strong style={{ color: t.color }}>{fmtK(f.cost * instances)}/yr</strong> total</span>
                  </div>
                )}
              </div>;
            })}
          </div>}
          {/* Two parallel ways to add a specific system: pick from common list, OR enter custom.
              Both buttons are always visible (when collapsed) so users can discover either path. */}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {tierSystems.length > 0 && <div onClick={() => { setOpenTier(openTier === t.key ? null : t.key); setSelected([]); }} style={{ flex: 1, padding: "12px 16px", textAlign: "center", fontSize: F.tiny, color: C.accent, cursor: "pointer", fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 12, background: openTier === t.key ? C.accent + "10" : C.bg }}>
              {openTier === t.key ? "▾" : "▸"} Pick from common systems
            </div>}
            <button onClick={() => setCustomTier(t.key)} style={{
              flex: 1, padding: "12px 16px", borderRadius: 12,
              border: `1px dashed ${t.color}`, background: 'transparent',
              color: t.color, fontSize: F.tiny, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit"
            }}>+ Enter your own system</button>
          </div>
          {tierSystems.length > 0 && openTier === t.key && <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {tierSystems.filter(sys => !tierFlagships.some(f => f.name === sys.label)).map(sys => {
                const isSel = selected.some(s => s.label === sys.label);
                return <button key={sys.label} onClick={() => setSelected(p => isSel ? p.filter(s => s.label !== sys.label) : [...p, sys])} style={{
                  padding: "8px 14px", fontSize: F.tiny, fontWeight: 600, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                  border: isSel ? `2px solid ${t.color}` : `1px solid ${C.borderLight}`,
                  background: isSel ? t.color + "18" : C.bg,
                  color: isSel ? t.color : C.textMid,
                }}>
                  {isSel ? "✓ " : ""}{sys.label} <span style={{ color: C.textMuted }}>({fmtK(systemCost(sys, inputs.bed_count))})</span>
                </button>;
              })}
            </div>
            {selected.length > 0 && <button onClick={() => { selected.forEach(sys => addFlagship(sys, t.key)); setSelected([]); setOpenTier(null); }} style={{
              marginTop: 10, padding: "14px 32px", borderRadius: 14, border: "none",
              background: t.color, color: C.inkOnColor, fontSize: F.small, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", width: "100%"
            }}>Add {selected.length} system{selected.length > 1 ? "s" : ""}</button>}
          </div>}
        </Card>;
      })}
    </div>
    <div style={{ marginTop: 16, padding: "20px 24px", background: C.surface, borderRadius: 18, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ fontSize: 48, fontWeight: 800, color: C.accent }}>{total}</span>
      <div>
        <div style={{ fontSize: F.h3, fontWeight: 600, color: C.textMid }}>total legacy systems</div>
        {flagships.length > 0 && <div style={{ fontSize: F.tiny, color: C.textMuted, marginTop: 2 }}>{sliderTotal} by tier + {flagshipInstanceCount} named system{flagshipInstanceCount > 1 ? "s" : ""}{flagships.some(f => (f.instances || 1) > 1) ? ` (${flagships.length} entries, with multiple instances)` : ""}</div>}
      </div>
    </div>
    {customTier && (() => {
      const tier = tiers.find(t => t.key === customTier);
      return <CustomSystemModal
        tier={customTier}
        color={tier.color}
        onAdd={(sys) => { addFlagship(sys, customTier); setCustomTier(null); setOpenTier(null); }}
        onCancel={() => setCustomTier(null)}
      />;
    })()}
  </div>;
}

// STEP 5: Fine-tune
export function FineTuneStep({ inputs, update, galenMigrationCost, setGalenMigrationCost, galenAnnualCost, setGalenAnnualCost, occupancyRate, setOccupancyRate }) {
  return <div>
    <SectionTitle number="5">Fine-tune your model</SectionTitle>
    <Card>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
        <div style={{ flex: "1 1 240px" }}>
          <SegmentedControl label="System complexity" info="How tightly your legacy systems are interwoven with workflows, interfaces, and customizations. Low: mostly standalone systems with simple data structures, straightforward to migrate. Typical: standard interfaces with some customization, the most common situation. High: heavily customized integrations and complex workflows that need careful migration planning. Affects per-system migration cost (High adds ~45%, Low subtracts ~30% from baseline)." value={inputs.complexity_level} onChange={v => update("complexity_level", v)}
            options={[{ key: "LOW", label: "Low" }, { key: "TYPICAL", label: "Typical" }, { key: "HIGH", label: "High" }]} />
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <SegmentedControl label="Data quality" info="Cleanliness and consistency of the data in your legacy systems. Clean: well-structured, validated, with clear ownership. Mixed: typical real-world data with some duplicates, missing fields, and legacy quirks (most common). Poor: significant duplicates, inconsistent formats, missing metadata, requires substantial cleanup before migration. Affects migration effort (Poor adds ~40%, Clean subtracts ~25% from baseline)." value={inputs.data_quality_level} onChange={v => update("data_quality_level", v)}
            options={[{ key: "CLEAN", label: "Clean" }, { key: "MIXED", label: "Mixed" }, { key: "POOR", label: "Poor" }]} />
        </div>
      </div>
      <TouchSlider label="Decommission target" value={inputs.decom_retire_rate} min={0} max={1} step={0.05} onChange={v => update("decom_retire_rate", v)} format={v => `${Math.round(v * 100)}%`} tip="What % of legacy systems will be retired?" />
      {!UKI && <TouchSlider label="Bed occupancy" value={occupancyRate} min={0.3} max={1.0} step={0.01} onChange={setOccupancyRate} format={v => `${Math.round(v * 100)}%`} tip="Drives admission volume, revenue, and safety metrics." />}
    </Card>
    <Card style={{ marginTop: 16 }}>
      <div style={{ fontSize: F.body, fontWeight: 700, color: C.textMid, marginBottom: 16 }}>Galen Clinical Archive costs <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span></div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: F.small, fontWeight: 600, color: C.textMuted }}>Migration (one-time)</span>
          <span style={{ fontSize: F.h2, fontWeight: 800, color: C.accent }}>{fmtK(galenMigrationCost)}</span>
        </div>
        <input type="range" min={0} max={20000000} step={25000} value={galenMigrationCost}
          onChange={e => setGalenMigrationCost(Number(e.target.value))}
          style={{ width: "100%", cursor: "pointer", accentColor: C.accent }} />
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
          <button onClick={() => setGalenMigrationCost(Math.max(0, galenMigrationCost - 25000))} style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid " + C.border, background: C.surface, color: C.textMid, fontSize: 22, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
          <div style={{ fontSize: F.tiny, color: C.textMuted, display: "flex", alignItems: "center" }}>{UKI ? "\u00b1\u00a325k" : "\u00b1$25k"}</div>
          <button onClick={() => setGalenMigrationCost(Math.min(20000000, galenMigrationCost + 25000))} style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid " + C.border, background: C.surface, color: C.textMid, fontSize: 22, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: F.small, fontWeight: 600, color: C.textMuted }}>Annual archive cost</span>
          <span style={{ fontSize: F.h2, fontWeight: 800, color: C.accent }}>{fmtK(galenAnnualCost)}/yr</span>
        </div>
        <input type="range" min={0} max={15000000} step={25000} value={galenAnnualCost}
          onChange={e => setGalenAnnualCost(Number(e.target.value))}
          style={{ width: "100%", cursor: "pointer", accentColor: C.accent }} />
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
          <button onClick={() => setGalenAnnualCost(Math.max(0, galenAnnualCost - 25000))} style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid " + C.border, background: C.surface, color: C.textMid, fontSize: 22, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
          <div style={{ fontSize: F.tiny, color: C.textMuted, display: "flex", alignItems: "center" }}>{UKI ? "\u00b1\u00a325k" : "\u00b1$25k"}</div>
          <button onClick={() => setGalenAnnualCost(Math.min(15000000, galenAnnualCost + 25000))} style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid " + C.border, background: C.surface, color: C.textMid, fontSize: 22, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
      </div>
    </Card>
  </div>;
}


/* ── UKI STEP 1: organisation type (scope) ─────────────────────────────── */
export function OrgTypeStep({ orgType, onSelect }) {
  return <div>
    <SectionTitle number="1">What type of organisation are you?</SectionTitle>
    <BigChoice options={ORG_TYPES.map(o => ({
      key: o.key, label: PRESETS_UKI[o.key].label, desc: PRESETS_UKI[o.key].desc, iconKey: o.iconKey,
    }))} value={orgType} onChange={onSelect} />
  </div>;
}

/* ── UKI STEP 3: organisation scale ────────────────────────────────────── */
export function ScaleStep({ inputs, update }) {
  const avg = Math.round(inputs.bed_count / Math.max(1, inputs.org_count));
  return <div>
    <SectionTitle number="3">Organisation scale</SectionTitle>
    <Card>
      <Stepper label="Trusts / organisations in scope" value={inputs.org_count} min={1} max={10}
        onChange={v => update("org_count", v)}
        tip="A single Trust, or the number of organisations in a multi-Trust or ICS-wide programme." />
      <TouchSlider label="Total acute beds" value={inputs.bed_count} min={50} max={Math.max(8000, inputs.bed_count + 500)} step={10}
        onChange={v => update("bed_count", v)} format={fmtNum}
        tip="Bed count is the primary scaling factor: it drives staffing levels, clinical time at risk, and harm exposure." />
      {inputs.org_count > 1 && <div style={{ fontSize: F.small, color: C.textMuted, background: C.bg, padding: "10px 14px", borderRadius: 10 }}>
        Average: {fmtNum(avg)} beds per organisation
      </div>}
    </Card>
  </div>;
}

import React, { useState, useRef, useEffect } from 'react';
import { C, F, GUTTER } from '../theme';
import { Icon } from './Icons';

// Build-time flag: '1' when built with `--mode embed` (see .env.embed).
// Used only to attach embed-specific classNames; kiosk DOM is unchanged.
const EMBED = import.meta.env.VITE_EMBED === '1';
import { UKI, AU } from '../market';

export function Card({ children, style }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: EMBED ? 20 : 24, padding: EMBED ? "clamp(18px, 3vw, 34px)" : "36px 40px 32px", ...style }}>{children}</div>;
}

export function StepIndicator({ steps, current, onJump }) {
  return <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
    {steps.map((label, i) => {
      const active = current === i, done = current > i;
      return <div key={i} style={{ flex: 1, cursor: done ? "pointer" : "default" }} onClick={() => done && onJump(i)}>
        <div style={{ height: 8, borderRadius: 4, background: active ? C.accent : done ? C.accent + "60" : C.border, transition: "background .4s" }} />
        <div style={{ fontSize: F.tiny, fontWeight: active ? 700 : 500, marginTop: 10, color: active ? C.accent : done ? C.textMid : C.textMuted, textAlign: "center" }}>{label}</div>
      </div>;
    })}
  </div>;
}

const STEP_CONTEXT_UKI = [
  // 0 - Scope
  { title: "Why this matters", text: "Your organisation type sets realistic defaults for beds, sites and the size of the legacy estate. Everything can be fine-tuned in the later steps." },
  // 1 - Journey
  { title: "Why this matters", text: "Whether you already have an EPR changes the calculation significantly. With an EPR in place, the ROI focuses on archiving and decommissioning legacy systems. If you're migrating, it includes the full migration case." },
  // 2 - Scale
  { title: "Why this matters", text: "Bed count is the primary scaling factor: it drives staffing levels, clinical time at risk, and harm exposure. Multi-Trust and ICS programmes multiply corporate overheads and duplicate systems." },
  // 3 - Systems
  { title: "Why this matters", text: "Each legacy system has a real annual cost: licensing, hosting, interfaces and support. The number and tier of systems determines your decommission savings and how much time clinicians waste switching between platforms." },
  // 4 - Fine-tune
  { title: "Why this matters", text: "These settings calibrate the model to your situation. Complexity and data quality affect migration effort; the decommission target sets how much of the estate you retire. Galen costs let us calculate your payback period." },
];

const STEP_CONTEXT_AU = [
  // 0 - Scope
  { title: "Why this matters", text: "Your sector and organisation size set realistic defaults for scale and the legacy estate. Hospitals, aged care and NDIS providers have very different systems and funding models - everything can be fine-tuned later." },
  // 1 - Journey
  { title: "Why this matters", text: "Whether you already have your core platform changes the calculation significantly. With it in place, the ROI focuses on archiving and decommissioning legacy systems. If you're migrating, it includes the full migration case." },
  // 2 - Scale
  { title: "Why this matters", text: "Scale is the primary driver: beds, places or participants determine staffing levels, funding volume, and harm exposure. Multi-facility programmes multiply corporate overheads and duplicate systems." },
  // 3 - Systems
  { title: "Why this matters", text: "Each legacy system has a real annual cost: licensing, hosting, interfaces and support. The number and tier of systems determines your decommission savings and how much time staff waste switching between platforms." },
  // 4 - Fine-tune
  { title: "Why this matters", text: "These settings calibrate the model to your situation. Complexity and data quality affect migration effort; the decommission target sets how much of the estate you retire. Galen costs let us calculate your payback period." },
];
const STEP_CONTEXT = [
  // 0 - Scope
  { title: "Why this matters", text: "Your organization type determines the staffing ratios, system complexity, and cost benchmarks we use. The reimbursement model shapes which financial impacts appear in your report. Fee-for-service focuses on denial recovery and coding accuracy, value-based adds CMS penalty programs (HRRP, HAC, VBP), and mixed models blend both. This ensures the ROI reflects your actual revenue exposure." },
  // 1 - Journey
  { title: "Why this matters", text: "Whether you already have an EHR changes the calculation significantly. With an EHR in place, the ROI focuses on archiving and decommissioning legacy systems. Without one, it includes the full migration case." },
  // 2 - Facilities
  { title: "Why this matters", text: "Bed count is the primary scaling factor. It drives staffing levels, annual admissions, revenue estimates, and patient safety metrics. More beds means more staff navigating legacy systems and more clinical encounters affected by fragmentation." },
  // 3 - Systems
  { title: "Why this matters", text: "Each legacy system has a real annual cost: licensing, hosting, interfaces, and support. The number and tier of systems directly determines your decommission savings and how much time clinicians waste switching between platforms." },
  // 4 - Fine-tune
  { title: "Why this matters", text: "These settings calibrate the model to your specific situation. Complexity and data quality affect migration effort. Occupancy drives admission volume. Galen costs let us calculate your exact payback period." },
];

export function NavButtons({ step, totalSteps, onBack, onNext, onCalculate, onStartOver }) {
  if (step >= totalSteps - 1) return null;
  const ctx = (UKI ? STEP_CONTEXT_UKI : AU ? STEP_CONTEXT_AU : STEP_CONTEXT)[step];
  return <div style={{ borderTop: `1px solid ${C.border}` }}>
    {ctx && <div className={EMBED ? "embed-nav-hint" : undefined} style={{ margin: EMBED ? `18px ${GUTTER} 0` : "20px 56px 0", padding: EMBED ? "14px 18px" : "16px 20px", background: `${C.accent}08`, border: `1px solid ${C.accent}20`, borderRadius: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}><Icon name="lightbulb" size={20} stroke={C.accent} /></span>
      <div>
        <div style={{ fontSize: F.tiny, fontWeight: 700, color: C.accent, marginBottom: 4 }}>{ctx.title}</div>
        <div style={{ fontSize: F.tiny, color: C.textMid, lineHeight: 1.6 }}>{ctx.text}</div>
      </div>
    </div>}
    <div className={EMBED ? "embed-nav-row" : undefined} style={{ padding: EMBED ? `14px ${GUTTER} 36px` : "16px 56px 40px", display: "flex", gap: EMBED ? 12 : 20, alignItems: "center" }}>
      {step > 0 && <button onClick={onBack} style={{ padding: EMBED ? "13px 26px" : "24px 44px", borderRadius: EMBED ? 14 : 18, border: `1px solid ${C.border}`, background: C.surface, color: C.textMid, fontSize: F.body, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>}
      <div style={{ flex: 1 }} />
      {/* Subtle Start over button - sits centred between Back and Next/Calculate.
          Deliberately understated (no background, muted text colour, smaller
          font) so it doesn't compete with the primary navigation. */}
      {onStartOver && <button onClick={onStartOver} style={{
        padding: "10px 18px", borderRadius: 12, border: "none",
        background: "transparent", color: C.textMuted, fontSize: F.small,
        fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
        letterSpacing: 0.3, opacity: 0.75, transition: "opacity .15s, color .15s"
      }} onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = C.textMid; }}
         onMouseLeave={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.color = C.textMuted; }}>
        ↻  Start over
      </button>}
      <div style={{ flex: 1 }} />
      {step < totalSteps - 2 ? (
        <button onClick={onNext} style={{ padding: EMBED ? "14px 40px" : "24px 64px", borderRadius: EMBED ? 14 : 18, border: "none", background: C.accent, color: C.onAccent, fontSize: F.h3, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Next →</button>
      ) : (
        <button onClick={onCalculate} style={{ padding: EMBED ? "14px 40px" : "24px 64px", borderRadius: EMBED ? 14 : 18, border: "none", background: C.ctaGrad, color: C.onAccent, fontSize: EMBED ? F.h3 : F.h2, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: C.ctaShadow }}>Calculate ROI →</button>
      )}
    </div>
  </div>;
}

export function PageTransition({ children, step }) {
  return <div key={step} style={{ animation: "kSlideUp .4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
    <style>{`
      @keyframes kSlideUp {
        0% { opacity: 0; transform: translateY(40px) scale(0.97); filter: blur(4px); }
        60% { opacity: 1; filter: blur(0); }
        100% { transform: translateY(0) scale(1); }
      }
    `}</style>
    {children}
  </div>;
}

export function TouchSlider({ label, value, min, max, step = 1, onChange, format, tip }) {
  return <div style={{ marginBottom: 24 }}>
    {label && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: F.body, fontWeight: 600, color: C.textMid }}>{label}</span>
        {tip && <InfoTip text={tip} />}
      </div>
      <span style={{ fontSize: F.h1, fontWeight: 800, color: C.accent }}>{format ? format(value) : value}</span>
    </div>}
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: "100%", cursor: "pointer", accentColor: C.accent }} />
  </div>;
}

export function Stepper({ label, value, min = 0, max = 999, step = 1, onChange, tip }) {
  return <div className={EMBED ? "embed-stepper" : undefined} style={{ display: "flex", alignItems: "center", gap: EMBED ? 14 : 20, marginBottom: 20, flexWrap: EMBED ? "wrap" : undefined }}>
    <div style={{ flex: EMBED ? "1 1 200px" : 1, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: F.body, fontWeight: 600, color: C.textMid }}>{label}</span>
      {tip && <InfoTip text={tip} />}
    </div>
    <button className={EMBED ? "embed-stepper-btn" : undefined} onClick={() => onChange(Math.max(min, value - step))} style={{ width: 64, height: 64, borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface, color: C.textMid, fontSize: 32, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>−</button>
    <span className={EMBED ? "embed-stepper-val" : undefined} style={{ fontSize: F.h1, fontWeight: 800, color: C.accent, minWidth: EMBED ? 64 : 90, textAlign: "center" }}>{value}</span>
    <button className={EMBED ? "embed-stepper-btn" : undefined} onClick={() => onChange(Math.min(max, value + step))} style={{ width: 64, height: 64, borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface, color: C.textMid, fontSize: 32, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
  </div>;
}

export function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  const iconRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, placeAbove: false });

  // When the tooltip opens, measure the icon's viewport position and decide
  // whether to render the bubble above or below it. Avoids being obscured by
  // the kiosk's header bar at the top of the viewport.
  useEffect(() => {
    if (!show || !iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const W = 400; // bubble width
    const ESTIMATED_H = 260; // bubble approx height
    const M = 14; // margin between icon and bubble
    const SAFE_TOP = 100; // header height safety margin
    const SAFE_BOTTOM = 60;

    const spaceBelow = window.innerHeight - rect.bottom - SAFE_BOTTOM;
    const spaceAbove = rect.top - SAFE_TOP;
    const placeAbove = spaceBelow < ESTIMATED_H && spaceAbove > spaceBelow;

    let top, left;
    if (placeAbove) {
      // Anchor bubble bottom to (rect.top - M), so top = rect.top - M - height.
      // We don't know height yet, so use translateY(-100%) on the bubble.
      top = rect.top - M;
    } else {
      top = rect.bottom + M;
    }
    left = rect.left + rect.width / 2 - W / 2;
    // Clamp horizontally so the bubble stays on screen
    left = Math.max(20, Math.min(left, window.innerWidth - W - 20));

    setPos({ top, left, placeAbove });
  }, [show]);

  return <span ref={iconRef} style={{ position: "relative", display: "inline-flex" }}>
    <span onClick={() => setShow(!show)} style={{ width: EMBED ? 28 : 30, height: EMBED ? 28 : 30, borderRadius: "50%", background: C.border, color: C.textMid, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: F.small, fontWeight: 700, cursor: "pointer" }}>i</span>
    {show && <>
      <div onClick={() => setShow(false)} style={{ position: "fixed", inset: 0, zIndex: 99996 }} />
      <span style={{
        position: "fixed",
        top: pos.top, left: pos.left,
        transform: pos.placeAbove ? "translateY(-100%)" : "none",
        background: C.tooltipBg, color: C.text,
        fontSize: F.small, lineHeight: 1.6, padding: "20px 24px",
        borderRadius: EMBED ? 16 : 18, width: 400, maxWidth: "calc(100vw - 40px)",
        boxShadow: C.tooltipShadow,
        zIndex: 99997, border: `1px solid ${C.border}`,
        animation: "kfade .2s ease-out"
      }}>{text}</span>
    </>}
  </span>;
}

export function BigChoice({ options, value, onChange }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
    {options.map((opt, i) => {
      const isLastOdd = options.length % 2 === 1 && i === options.length - 1;
      return <button key={opt.key} onClick={() => onChange(opt.key)} style={{
        gridColumn: isLastOdd ? "1 / -1" : "auto",
        padding: EMBED ? "clamp(18px, 2.6vw, 26px)" : "32px 30px", textAlign: "left", cursor: "pointer",
        border: value === opt.key ? `${EMBED ? 2 : 3}px solid ${C.accent}` : `1px solid ${C.border}`,
        borderRadius: EMBED ? 16 : 22, background: value === opt.key ? C.accentPale : C.surface,
        transition: "all .2s", display: "flex", flexDirection: "column", alignItems: "flex-start"
      }}>
        <div style={{ marginBottom: EMBED ? 10 : 14 }}>
          {opt.iconKey ? <Icon name={opt.iconKey} size={EMBED ? 34 : 42} stroke={value === opt.key ? C.accent : C.textMid} /> : opt.icon && <span style={{ fontSize: 42 }}>{opt.icon}</span>}
        </div>
        <div style={{ fontSize: F.h3, fontWeight: 700, color: value === opt.key ? C.accent : C.text, marginBottom: 8, lineHeight: 1.2 }}>{opt.label}</div>
        <div style={{ fontSize: F.small, color: C.textMuted, lineHeight: 1.5 }}>{opt.desc}</div>
      </button>;
    })}
  </div>;
}

export function SectionTitle({ number, children }) {
  return <div className={EMBED ? "embed-step-title" : undefined} style={{ fontSize: F.h2, fontWeight: 700, color: C.textMid, marginBottom: EMBED ? 22 : 28, display: "flex", alignItems: "center", gap: EMBED ? 14 : 16 }}>
    <span style={{ width: EMBED ? 40 : 52, height: EMBED ? 40 : 52, borderRadius: "50%", background: C.accent, color: C.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: F.h3, fontWeight: 800, flexShrink: 0 }}>{number}</span>
    {children}
  </div>;
}

export function SegmentedControl({ options, value, onChange, label, info }) {
  return <div>
    {label && <div style={{ fontSize: F.body, fontWeight: 600, color: C.textMid, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
      <span>{label}</span>
      {info && <InfoTip text={info} />}
    </div>}
    <div style={{ display: "flex", gap: 10 }}>
      {options.map(opt => <button key={opt.key} onClick={() => onChange(opt.key)} style={{ flex: 1, padding: EMBED ? "12px 14px" : "18px", borderRadius: EMBED ? 12 : 16, cursor: "pointer", border: value === opt.key ? `2px solid ${C.accent}` : `1px solid ${C.border}`, background: value === opt.key ? C.accentPale : C.surface, color: value === opt.key ? C.accent : C.textMid, fontSize: F.body, fontWeight: 600, fontFamily: "inherit" }}>{opt.label}</button>)}
    </div>
  </div>;
}

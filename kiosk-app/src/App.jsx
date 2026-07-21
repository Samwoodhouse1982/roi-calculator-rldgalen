import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { C, F, W, H, MAXW, KIOSK_STEPS } from './theme';

// Build-time flag: '1' when built with `--mode embed` (see .env.embed).
// Selects the responsive/iframe variant; default is the fixed 1080×1920 kiosk.
const EMBED = import.meta.env.VITE_EMBED === '1';
import { SplashScreen } from './components/SplashScreen';
import { AdminLeads } from './components/LeadCapture';
import { BackgroundParticles } from './components/BackgroundParticles';
import { UKI } from './market';
import { calc } from './calc/index.js';
import { PRESETS as PRESETS_US, PROVIDER_PRESET_MAP, PROVIDER_MULTIPLIERS, REIMBURSE_MULTIPLIERS } from './calc/presets';
import { PRESETS as PRESETS_UKI } from './calc/presets.uki';
const PRESETS = UKI ? PRESETS_UKI : PRESETS_US;
import { systemCost } from './calc/vendors.index.js';
import { StepIndicator, NavButtons, PageTransition } from './components';
import { ProviderStep, JourneyStep, FacilitiesStep, SystemsStep, FineTuneStep, OrgTypeStep, ScaleStep } from './steps';
import { ResultsPage } from './results/ResultsPage';

/* ────────────────────────────────────────────────────────────────────────
   COMPLETION TRACKING + ADMIN STATS (localStorage-backed)
   Reveal: single tap on RLDatix logo on splash
   Reset: PIN-protected (default 2580 - vertical line on phone keypad)
   ──────────────────────────────────────────────────────────────────────── */
const STATS_KEY = 'kiosk-stats';
const ADMIN_PIN = '2580'; // 4-digit numeric. Change to your preferred PIN.

function recordCompletion(session) {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    const data = raw ? JSON.parse(raw) : { sessions: [], total: 0 };
    data.sessions.push({ ts: Date.now(), ...session });
    data.total = (data.total || 0) + 1;
    // Keep last 1000 sessions to bound storage growth
    if (data.sessions.length > 1000) data.sessions = data.sessions.slice(-1000);
    localStorage.setItem(STATS_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { sessions: [], total: 0 };
    const data = JSON.parse(raw);
    // If the stored data isn't in the expected shape (e.g. an older format
    // from a previous build), wipe it. We don't migrate - this is throwaway
    // tradeshow data, not anything precious.
    if (!Array.isArray(data.sessions)) {
      localStorage.removeItem(STATS_KEY);
      return { sessions: [], total: 0 };
    }
    return { sessions: data.sessions, total: data.total || 0 };
  } catch (e) {
    try { localStorage.removeItem(STATS_KEY); } catch (e2) {}
    return { sessions: [], total: 0 };
  }
}

function resetStats() {
  try { localStorage.removeItem(STATS_KEY); } catch (e) { /* ignore */ }
}

// Compute aggregated stats: by provider type + cumulative impact
function computeStats() {
  const { sessions, total } = loadSessions();
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const today = sessions.filter(s => s.ts >= oneDayAgo).length;
  const last = sessions.length ? sessions[sessions.length - 1].ts : null;

  // Group by provider type
  const PROVIDER_LABELS = {
    critical_access: 'Critical Access / Rural',
    community: 'Community Hospital',
    regional: 'Regional Medical Center',
    academic: 'Academic Medical Center',
    multi_hospital: 'IDN / Health System',
  };
  const byProvider = {};
  for (const s of sessions) {
    const k = s.providerType || 'unknown';
    if (!byProvider[k]) byProvider[k] = { count: 0, beds: 0, systems: 0, savings: 0, fte: 0 };
    byProvider[k].count++;
    byProvider[k].beds += s.beds || 0;
    byProvider[k].systems += s.systems || 0;
    byProvider[k].savings += s.savings || 0;
    byProvider[k].fte += s.fte || 0;
  }
  const providerRows = Object.keys(byProvider).map(k => ({
    key: k,
    label: PROVIDER_LABELS[k] || k,
    count: byProvider[k].count,
    avgBeds: Math.round(byProvider[k].beds / byProvider[k].count),
    avgSystems: Math.round(byProvider[k].systems / byProvider[k].count),
    avgSavings: Math.round(byProvider[k].savings / byProvider[k].count),
    avgFte: Math.round(byProvider[k].fte / byProvider[k].count * 10) / 10,
  })).sort((a, b) => b.count - a.count);

  // Cumulative impact across all sessions
  const cum = sessions.reduce((acc, s) => ({
    fte: acc.fte + (s.fte || 0),
    medErrors: acc.medErrors + (s.medErrors || 0),
    patients: acc.patients + (s.patientsProtected || 0),
    bedDays: acc.bedDays + (s.bedDays || 0),
    savings: acc.savings + (s.savings || 0),
  }), { fte: 0, medErrors: 0, patients: 0, bedDays: 0, savings: 0 });

  return { total, today, last, providerRows, cum };
}

/* ────────────────────────────────────────────────────────────────────────
   ADMIN STATS OVERLAY
   ──────────────────────────────────────────────────────────────────────── */
function fmtMoney(n) {
  if (n >= 1e9) return '$' + (n/1e9).toFixed(1) + 'b';
  if (n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'm';
  if (n >= 1e3) return '$' + Math.round(n/1e3) + 'k';
  return '$' + n;
}
function fmtNum(n) { return (n || 0).toLocaleString('en-US'); }

function PinKeypad({ onSubmit, onCancel, error }) {
  const [pin, setPin] = useState('');
  const handleDigit = (d) => {
    if (pin.length < 4) {
      const next = pin + d;
      setPin(next);
      if (next.length === 4) {
        // Submit immediately on 4th digit
        setTimeout(() => onSubmit(next), 150);
      }
    }
  };
  const handleClear = () => setPin('');
  // Reset PIN when an error comes in (so user can retry)
  useEffect(() => { if (error) setPin(''); }, [error]);
  return (
    <div style={{ background: C.surface, padding: '36px 40px', borderRadius: 24, border: '1px solid ' + C.border, maxWidth: 420 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Restricted</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 6 }}>Enter PIN to reset stats</div>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>Resetting stats cannot be undone.</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 22, height: 28 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: '50%',
            background: i < pin.length ? C.accent : 'transparent',
            border: '2px solid ' + (i < pin.length ? C.accent : C.border),
            transition: 'all .15s'
          }} />
        ))}
      </div>
      {error && <div style={{ textAlign: 'center', fontSize: 13, color: C.rose, fontWeight: 600, marginBottom: 14 }}>Incorrect PIN. Try again.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button key={d} onClick={() => handleDigit(d)} style={{
            padding: '20px 0', borderRadius: 14, border: '1px solid ' + C.border,
            background: C.bg, color: C.text, fontSize: 24, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'background .1s'
          }}>{d}</button>
        ))}
        <button onClick={handleClear} style={{
          padding: '20px 0', borderRadius: 14, border: '1px solid ' + C.border,
          background: C.bg, color: C.textMuted, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>Clear</button>
        <button onClick={() => handleDigit('0')} style={{
          padding: '20px 0', borderRadius: 14, border: '1px solid ' + C.border,
          background: C.bg, color: C.text, fontSize: 24, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>0</button>
        <button onClick={onCancel} style={{
          padding: '20px 0', borderRadius: 14, border: '1px solid ' + C.border,
          background: C.bg, color: C.textMuted, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>Cancel</button>
      </div>
    </div>
  );
}

function AdminOverlay({ onClose }) {
  const [stats, setStats] = useState(computeStats());
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const refresh = () => setStats(computeStats());
  useEffect(() => {
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, []);
  const handlePinSubmit = (entered) => {
    if (entered === ADMIN_PIN) {
      setPinError(false);
      setPinOpen(false);
      setConfirmReset(true);
    } else {
      setPinError(true);
    }
  };
  const handleConfirmReset = () => { resetStats(); setConfirmReset(false); refresh(); };
  const lastStr = stats.last ? new Date(stats.last).toLocaleString() : 'never';

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.scrim, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, overflow: 'auto' }}>
      {pinOpen ? (
        <PinKeypad onSubmit={handlePinSubmit} onCancel={() => { setPinOpen(false); setPinError(false); }} error={pinError} />
      ) : confirmReset ? (
        <div style={{ background: C.surface, padding: '36px 40px', borderRadius: 24, border: '1px solid ' + C.rose, maxWidth: 480 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.rose, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Final confirmation</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 12 }}>Reset all kiosk stats?</div>
          <div style={{ fontSize: 14, color: C.textMid, marginBottom: 24, lineHeight: 1.6 }}>This will permanently delete <strong style={{ color: C.text }}>{stats.total}</strong> recorded session{stats.total === 1 ? '' : 's'}. This action cannot be undone.</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirmReset(false)} style={{ padding: '12px 22px', borderRadius: 12, border: '1px solid ' + C.border, background: 'transparent', color: C.textMid, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleConfirmReset} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: C.rose, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, delete all stats</button>
          </div>
        </div>
      ) : (
      <div style={{ background: C.surface, padding: '36px 40px', borderRadius: 24, border: '1px solid ' + C.border, width: '100%', maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: 3, textTransform: 'uppercase' }}>Kiosk Stats</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginTop: 4 }}>Assessments completed</div>
          </div>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: C.accent, color: C.onAccent, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
        </div>

        {/* Top row: total + 24h */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ padding: '18px 20px', background: C.bg, borderRadius: 14, border: '1px solid ' + C.borderLight }}>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>All time</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: C.accent, lineHeight: 1.1, marginTop: 4 }}>{stats.total}</div>
          </div>
          <div style={{ padding: '18px 20px', background: C.bg, borderRadius: 14, border: '1px solid ' + C.borderLight }}>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Last 24 hours</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: C.accent, lineHeight: 1.1, marginTop: 4 }}>{stats.today}</div>
          </div>
        </div>

        {/* By provider type */}
        {stats.providerRows.length > 0 && <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 10 }}>By organization type</div>
          <div style={{ background: C.bg, borderRadius: 14, border: '1px solid ' + C.borderLight, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.7fr 0.7fr 0.9fr 0.7fr', gap: 8, padding: '10px 16px', borderBottom: '1px solid ' + C.borderLight, fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <div>Type</div>
              <div style={{ textAlign: 'right' }}>Count</div>
              <div style={{ textAlign: 'right' }}>Avg beds</div>
              <div style={{ textAlign: 'right' }}>Avg sys</div>
              <div style={{ textAlign: 'right' }}>Avg savings</div>
              <div style={{ textAlign: 'right' }}>Avg FTE</div>
            </div>
            {stats.providerRows.map(r => (
              <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.7fr 0.7fr 0.9fr 0.7fr', gap: 8, padding: '12px 16px', borderBottom: '1px solid ' + C.borderLight, fontSize: 13 }}>
                <div style={{ color: C.text, fontWeight: 600 }}>{r.label}</div>
                <div style={{ textAlign: 'right', color: C.accent, fontWeight: 700 }}>{r.count}</div>
                <div style={{ textAlign: 'right', color: C.textMid }}>{fmtNum(r.avgBeds)}</div>
                <div style={{ textAlign: 'right', color: C.textMid }}>{r.avgSystems}</div>
                <div style={{ textAlign: 'right', color: C.textMid, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(r.avgSavings)}</div>
                <div style={{ textAlign: 'right', color: C.textMid }}>{r.avgFte}</div>
              </div>
            ))}
          </div>
        </div>}

        {/* Cumulative impact */}
        {stats.total > 0 && <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 10 }}>Cumulative impact across all sessions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ padding: '14px 16px', background: C.bg, borderRadius: 12, border: '1px solid ' + C.borderLight }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>Total annual savings shown</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.accent, marginTop: 4 }}>{fmtMoney(stats.cum.savings)}</div>
            </div>
            <div style={{ padding: '14px 16px', background: C.bg, borderRadius: 12, border: '1px solid ' + C.borderLight }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>FTEs freed (cumulative)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.amber, marginTop: 4 }}>{fmtNum(Math.round(stats.cum.fte))}</div>
            </div>
            <div style={{ padding: '14px 16px', background: C.bg, borderRadius: 12, border: '1px solid ' + C.borderLight }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>Patients protected</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.purple, marginTop: 4 }}>{fmtNum(stats.cum.patients)}</div>
            </div>
            <div style={{ padding: '14px 16px', background: C.bg, borderRadius: 12, border: '1px solid ' + C.borderLight }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>Med errors avoided</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.purple, marginTop: 4 }}>{fmtNum(stats.cum.medErrors)}</div>
            </div>
            <div style={{ padding: '14px 16px', background: C.bg, borderRadius: 12, border: '1px solid ' + C.borderLight }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>Excess bed days avoided</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.blue, marginTop: 4 }}>{fmtNum(stats.cum.bedDays)}</div>
            </div>
            <div style={{ padding: '14px 16px', background: C.bg, borderRadius: 12, border: '1px solid ' + C.borderLight }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>Last completion</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 8, lineHeight: 1.4 }}>{lastStr}</div>
            </div>
          </div>
        </div>}

        {stats.total === 0 && <div style={{ padding: '24px', background: C.bg, borderRadius: 12, border: '1px solid ' + C.borderLight, textAlign: 'center', color: C.textMuted, fontSize: 14, marginBottom: 18 }}>
          No sessions recorded yet.
        </div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setPinOpen(true)} disabled={stats.total === 0} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid ' + C.border, background: 'transparent', color: stats.total === 0 ? C.textMuted : C.textMid, fontSize: 12, fontWeight: 600, cursor: stats.total === 0 ? 'default' : 'pointer', fontFamily: 'inherit', opacity: stats.total === 0 ? 0.4 : 1 }}>Reset stats (PIN required)</button>
        </div>
      </div>
      )}
    </div>
  );
}

/**
 * Timescale view selector for the results report.
 *
 * Rendered at App level, OUTSIDE the scroll container that holds the report
 * content. This means it's always visible at the top of the report screen
 * regardless of scroll position — replacing the previous attempt to use
 * position: sticky inside ResultsPage, which didn't work because of the
 * transform-based animations in PageTransition and ResultsPage's outer
 * wrapper.
 *
 * Same four options as the AU calculator: Year 1 / 3-yr total / 5-yr total /
 * Annual avg. The selected option is held in App-level state so it persists
 * across re-renders and can be used by ResultsPage to scale every figure.
 */
function TimescaleBar({ viewTimescale, setViewTimescale, scenarioMode = null, setScenarioMode }) {
  return <div className={EMBED ? "embed-timescale" : undefined} style={{
    padding: "14px 56px 16px",
    borderBottom: `1px solid ${C.borderLight}`,
    background: C.bg,
    boxShadow: `0 4px 12px -4px rgba(0,0,0,0.5)`,
    // Sticky relative to the nearest scrolling ancestor. On the kiosk (exact
    // 1080×1920) there's no body scroll, but the bar is already pinned above
    // the inner overflow:auto scroll container so this is benign. In dev
    // browsers where the viewport is shorter than 1920px and the body itself
    // scrolls, sticky resolves to the body and the bar stays pinned to the
    // viewport top. Works in both contexts.
    // No transform-using animated ancestors above this point (BackgroundParticles
    // is absolutely positioned, StepIndicator wrapper has no transforms), so
    // sticky resolves correctly — unlike the previous attempt inside ResultsPage.
    position: 'sticky',
    top: 0,
    zIndex: 20,
  }}>
    <div style={{ fontSize: F.tiny, fontWeight: 600, color: C.textMuted, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>View savings as:</div>
    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
      {[
        { k: 'year1',  label: 'Year 1' },
        { k: 'total3', label: '3-yr total' },
        { k: 'total5', label: '5-yr total' },
        { k: 'annual', label: 'Annual avg' },
      ].map(opt => {
        const active = viewTimescale === opt.k;
        return <button key={opt.k} onClick={() => setViewTimescale(opt.k)} style={{
          padding: "12px 22px", borderRadius: 12, fontSize: F.small, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          border: active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
          background: active ? C.accent : C.surface,
          color: active ? C.onAccent : C.textMid,
          transition: "all .15s",
          minWidth: 120,
        }}>{opt.label}</button>;
      })}
    </div>
    {scenarioMode != null && <>
      <div style={{ fontSize: F.tiny, fontWeight: 600, color: C.textMuted, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", margin: "10px 0 8px" }}>Confidence level:</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { k: 'CONSERVATIVE', label: 'Conservative' },
          { k: 'EXPECTED', label: 'Moderate' },
          { k: 'STRETCH', label: 'Optimistic' },
        ].map(opt => {
          const active = scenarioMode === opt.k;
          return <button key={opt.k} onClick={() => setScenarioMode(opt.k)} style={{
            padding: "12px 22px", borderRadius: 12, fontSize: F.small, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            border: active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
            background: active ? C.accent : C.surface,
            color: active ? C.onAccent : C.textMid,
            transition: "all .15s",
            minWidth: 120,
          }}>{opt.label}</button>;
        })}
      </div>
    </>}
  </div>;
}

/**
 * Global responsive overrides for the embed/iframe build.
 *
 * The kiosk version was a fixed 1080×1920 design - paddings, gaps,
 * grid columns and minimum widths were all sized for that surface.
 * For the embed build we keep those values as the desktop max, but
 * dial them down on smaller viewports via media queries.
 *
 * Why a CSS-in-style-tag instead of a real stylesheet? React inline
 * styles can't express media queries (no @-rules), and adding a
 * Vite-managed .css file is heavier than this one-shot block. The
 * `<style>` tag is rendered once at App-level and inherits the
 * Vite build's normal CSS bundling.
 *
 * Breakpoints:
 *   <= 640px  : phone portrait. Single-column grids, tightened padding,
 *               smaller bar buttons, stacked composition strip.
 *   <= 900px  : phone landscape / small tablet. Slightly relaxed but
 *               still single-column for KPI grid.
 *   <= 1200px : tablet / small laptop. 2-column grids still work, but
 *               horizontal padding shrinks so it doesn't waste edge space.
 *   > 1200px  : desktop / kiosk - the original look.
 *
 * Selectors target classes added in App.jsx (.embed-header-pad,
 * .embed-scroll-area) so the responsive behaviour can't accidentally
 * bleed into pages that don't opt in.
 */
function EmbedStyles() {
  return <style>{`
    /* The embed scrolls like a normal web page (same as the Smart Match web
       build). The app's outer container only sets a MINIMUM height, so an
       earlier body{overflow:hidden} rule here left tall steps clipped with
       no way to scroll at all — the inner .embed-scroll-area never gets a
       constrained height to scroll within. Body-level scrolling also makes
       position:sticky (header, step title, timescale bar) work as designed. */
    html, body { margin: 0; padding: 0; }
    #root { width: 100%; min-height: 100vh; }

    /* CRITICAL for the sticky elements below: the inner scroll container's
       overflow:auto would capture position:sticky descendants into a scroll
       box that never actually scrolls (the body scrolls instead), so sticky
       would never engage. Neutralise it in the embed. */
    .embed-scroll-area { overflow: visible !important; }

    /* Sticky progress header. The inline kiosk padding is replaced with the
       Smart Match web build's fluid gutter so the pinned bar doesn't eat
       vertical space; the StepIndicator's own margin-bottom is cancelled so
       the header's background wraps it exactly. */
    .embed-header-pad {
      position: sticky; top: 0; z-index: 30;
      background: ${C.bg};
      padding: 12px clamp(16px, 4vw, 44px) 10px !important;
      box-shadow: 0 4px 14px -10px rgba(15,65,70,0.4);
    }
    .embed-header-pad > div { margin-bottom: 0 !important; }

    /* Content column: same fluid gutter (replaces the kiosk's fixed 56px). */
    .embed-scroll-area { padding: 0 clamp(16px, 4vw, 44px) 12px !important; }

    /* Step title sticks just below the header. --embed-header-h is measured
       at runtime (see App's header ResizeObserver) because the header's
       height varies with breakpoint and label wrapping. */
    .embed-step-title {
      position: sticky; top: var(--embed-header-h, 74px); z-index: 25;
      background: ${C.bg};
      padding: 8px 0 10px;
      margin-bottom: 18px !important;
    }

    /* Results timescale bar: pin below the sticky header instead of top:0,
       web-scale padding, and soften its kiosk-dark shadow for the light
       theme. */
    .embed-timescale {
      top: var(--embed-header-h, 74px) !important;
      z-index: 25;
      padding: 10px clamp(16px, 4vw, 44px) 12px !important;
      box-shadow: 0 4px 12px -4px rgba(15,65,70,0.18) !important;
    }
    /* Constant border width on the timescale buttons: the active button's
       2px-vs-1px border made every button grow/shrink as the selection
       moved, and because the bar is sticky the whole page shivered by 2px
       on each switch. Border colour still shows the selection. Web-scale
       padding replaces the kiosk's 12px 22px / 120px min-width. */
    .embed-timescale button { border-width: 2px !important; padding: 9px 18px !important; min-width: 0 !important; }

    /* Composition legend: structurally stable at EVERY width. As the
       count-up animation runs, item widths change; with centered flex-wrap
       the last item hopped between one and two lines mid-animation and
       bounced the whole report (seen in a desktop screen recording). A
       2-column grid has a row count that depends only on the item count,
       never on the animating text widths, and tabular figures keep digit
       widths constant while counting. */
    .embed-comp-legend {
      font-variant-numeric: tabular-nums;
      display: grid !important;
      grid-template-columns: repeat(2, auto);
      justify-items: start;
      column-gap: 40px !important;
      row-gap: 8px !important;
    }

    /* Nav row: allow wrapping so the primary button can never overflow the
       viewport edge. */
    .embed-nav-row { flex-wrap: wrap; }

    /* Component chrome (Card padding, buttons, steppers, section titles,
       gutters) is sized via EMBED ternaries in the components themselves,
       ported 1:1 from the Smart Match web build — media queries below only
       handle structural changes that fluid values can't express. */

    /* Phone landscape / small tablet: single column KPI */
    @media (max-width: 900px) {
      /* Collapse 2-col grids to single column. The kiosk's KpiCard
         grid uses inline gridTemplateColumns: "1fr 1fr" - overriding
         the inline style requires the more specific selector + !important. */
      .embed-scroll-area [style*="gridTemplateColumns: \\"1fr 1fr\\""],
      .embed-scroll-area [style*="grid-template-columns: 1fr 1fr"] {
        grid-template-columns: 1fr !important;
      }
    }

    /* Phone portrait: compact nav structure. */
    @media (max-width: 640px) {
      .embed-nav-row { gap: 8px !important; justify-content: space-between; }
      .embed-nav-row button { padding: 13px 18px !important; }
      /* The primary action (Next / Calculate ROI) gets its own full-width
         row - a proper thumb target - instead of wrapping raggedly when the
         three buttons don't fit side by side. The flex-spacer divs between
         the buttons are dropped so Back and Start over split the first row. */
      .embed-nav-row > div { display: none; }
      .embed-nav-row > button:last-child { flex: 1 1 100%; margin-top: 2px; }

      /* Compact the sticky timescale bar further on phones. */
      .embed-timescale button { padding: 8px 12px !important; }

      /* Methodology bento: the 75/25 absolutely-positioned grid cannot work
         at phone width (right-column tiles become unreadable slivers and the
         large tile clips its text). Collapse to a vertical accordion: every
         tile full-width and auto-height, selected tile shows its body,
         unselected tiles are just their tappable header row. */
      .embed-bento { height: auto !important; display: flex; flex-direction: column; gap: 12px; }
      .embed-bento-tile { position: static !important; width: 100% !important; height: auto !important; }
      .embed-bento-tile:not(.embed-bento-large) .embed-bento-body { display: none; }

      /* Report stability on timescale switches: the longest eyebrow label
         ("Estimated 3-year cumulative savings") wrapped to a second line at
         phone width, so the whole report jumped ~23px on every switch.
         Sized to keep every label variant on one line. */
      .embed-hero-eyebrow { font-size: 12px !important; letter-spacing: 2px !important; }

      /* Narrow screens: equal-width columns so long items can't push the
         pair off-center. */
      .embed-comp-legend { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 12px !important; }
    }

    /* Very narrow phones: keep the eyebrow on one line. */
    @media (max-width: 374px) {
      .embed-hero-eyebrow { font-size: 10.5px !important; letter-spacing: 1.5px !important; }
    }
  `}</style>;
}

function CalibratingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const [barW, setBarW] = useState(0);
  const steps = UKI
    ? ['Mapping your legacy estate', 'Modelling decommission savings', 'Estimating clinical capacity impact', 'Valuing quality & safety improvements']
    : ['Mapping your legacy estate', 'Modeling decommission savings', 'Estimating clinical capacity impact', 'Calculating reimbursement recovery'];
  useEffect(() => {
    const t = [
      setTimeout(() => { setStep(1); setBarW(25); }, 600),
      setTimeout(() => { setStep(2); setBarW(50); }, 1400),
      setTimeout(() => { setStep(3); setBarW(75); }, 2200),
      setTimeout(() => setBarW(100), 2800),
      setTimeout(onDone, 3200),
    ];
    return () => t.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes calSpin { to { transform: rotate(360deg); } }
        @keyframes calPulse { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.02); } }
      `}</style>
      <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 48 }}>
        <div style={{ position: 'absolute', inset: 0, border: '4px solid ' + C.border, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, border: '4px solid transparent', borderTopColor: C.accent, borderRightColor: C.accent, borderRadius: '50%', animation: 'calSpin .8s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 16, border: '3px solid transparent', borderTopColor: C.tealLight, borderRadius: '50%', animation: 'calSpin 1.4s linear infinite reverse' }} />
      </div>
      <div style={{ fontSize: F.h1, fontWeight: 800, color: C.accent, marginBottom: 12, animation: 'calPulse 2s ease-in-out infinite', textAlign: 'center' }}>Calibrating your model</div>
      <div style={{ fontSize: F.body, color: C.textMuted, marginBottom: 44, textAlign: 'center' }}>{'Analyzing ' + (step < 2 ? 'inputs' : 'clinical impact') + '...'}</div>
      <div style={{ width: 420, maxWidth: '80%', height: 6, background: C.border, borderRadius: 3, marginBottom: 40, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: barW + '%', background: 'linear-gradient(90deg, ' + C.accent + ', ' + C.tealLight + ')', borderRadius: 3, transition: 'width .5s ease-out' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 420, maxWidth: '80%' }}>
        {steps.map((label, i) => {
          const done = step > i, active = step === i;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: done ? 1 : active ? 0.9 : 0.2, transform: done || active ? 'translateX(0)' : 'translateX(-8px)', transition: 'all .4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: done ? C.accent : active ? C.accent + '30' : C.border, border: active ? '2px solid ' + C.accent : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s' }}>
                {done && <span style={{ color: C.onAccent, fontSize: 18, fontWeight: 800 }}>{'✓'}</span>}
                {active && <div style={{ width: 8, height: 8, borderRadius: 4, background: C.accent }} />}
              </div>
              <span style={{ fontSize: F.body, fontWeight: active ? 700 : 400, color: done ? C.accent : active ? C.text : C.textMuted, transition: 'all .3s' }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  // Embed: #admin-leads reviews locally stored lead-form submissions
  // (ported from the Smart Match web build). Hash-driven, no UI affordance.
  const [adminLeads, setAdminLeads] = useState(EMBED && typeof window !== 'undefined' && window.location.hash === '#admin-leads');
  const embedHeaderRef = useRef(null); // embed: sticky header height source (see --embed-header-h)
  const [kioskStep, setKioskStep] = useState(0);
  const [calibrating, setCalibrating] = useState(false);
  const [adminVisible, setAdminVisible] = useState(false);
  // Timescale view for the report. Lifted up here (out of ResultsPage) so the
  // toggle bar can be rendered OUTSIDE the scroll container — sticky position
  // doesn't work reliably inside PageTransition because of its transform-based
  // animation. With the bar at App level it's always visible at the top of
  // the results screen regardless of how far the user has scrolled the report.
  const [viewTimescale, setViewTimescale] = useState('annual');
  const [providerType, setProviderType] = useState("community");
  const [orgType, setOrgType] = useState("TYPICAL");          // UKI scope selection
  const [scenarioMode, setScenarioMode] = useState("EXPECTED"); // UKI on-screen confidence toggle
  const [reimbursementModel, setReimbursementModel] = useState("mixed");
  const [occupancyRate, setOccupancyRate] = useState(0.65);
  const [galenMigrationCost, setGalenMigrationCost] = useState(0);
  const [galenAnnualCost, setGalenAnnualCost] = useState(0);
  const [flagships, setFlagships] = useState([]);
  const [facilities, setFacilitiesState] = useState({});
  const [costMode, setCostMode] = useState("estimate");
  const [knownSpend, setKnownSpend] = useState(0);
  const [inputs, setInputs] = useState({ ...PRESETS.TYPICAL.data, tiers: { ...PRESETS.TYPICAL.data.tiers } });

  const update = useCallback((key, val) => setInputs(p => ({ ...p, [key]: val })), []);
  const updateTier = useCallback((tier, val) => setInputs(p => ({ ...p, tiers: { ...p.tiers, [tier]: val } })), []);
  const setFacility = useCallback((key, val) => setFacilitiesState(p => ({ ...p, [key]: val })), []);
  const applyPreset = useCallback((key) => { const p = PRESETS[key]; if (!p) return; setInputs({ ...p.data, tiers: { ...p.data.tiers } }); setFlagships([]); setFacilitiesState({}); }, []);
  const selectProvider = useCallback((key) => { setProviderType(key); const pk = PROVIDER_PRESET_MAP[key]; if (pk) applyPreset(pk); setFacilitiesState(key === 'multi_hospital' ? { ...IDN_FACILITIES } : {}); }, [applyPreset]);
  const selectOrgType = useCallback((key) => { setOrgType(key); applyPreset(key); }, [applyPreset]);

  const addFlagship = useCallback((sys, tier) => {
    const cost = sys.baseCost ? systemCost(sys, inputs.bed_count) : (sys.cost || 250000);
    setFlagships(p => [...p, { name: sys.label || "", cost, retire: true, tier: tier || null, instances: 1 }]);
  }, [inputs.bed_count]);

  const removeFlagship = useCallback((idx) => {
    setFlagships(p => p.filter((_, j) => j !== idx));
  }, []);
  const updateFlagshipCost = useCallback((idx, cost) => {
    setFlagships(p => p.map((f, i) => i === idx ? { ...f, cost: Math.max(0, cost) } : f));
  }, []);
  // Clamp instances to [1, 99]. An IDN with 4 hospitals running the same EPR
  // is a real case; 99 is a generous upper bound.
  const updateFlagshipInstances = useCallback((idx, instances) => {
    setFlagships(p => p.map((f, i) => i === idx ? { ...f, instances: Math.max(1, Math.min(99, instances)) } : f));
  }, []);

  const calcInputs = useMemo(() => {
    if (UKI) {
      return { ...inputs, _knownSpend: costMode === "known" && knownSpend > 0 ? knownSpend : 0 };
    }
    const pm = PROVIDER_MULTIPLIERS[providerType] || PROVIDER_MULTIPLIERS.community;
    const rm = REIMBURSE_MULTIPLIERS[reimbursementModel] || REIMBURSE_MULTIPLIERS.mixed;

    // Issue 2: Translate facility counts into portfolio inputs
    // Each facility TYPE adds a base set of shared systems across the network,
    // plus a small per-site multiplier for additional instances/interfaces.
    // Staff and cost scale per facility.
    const FAC_PROFILE = {
      ambulatory_surgery:  { baseSys: 3, perSiteSys: 0.3, staffPer: 12, costPer: 55000 },  // surgery scheduling, anesthesia, ASC billing
      physician_practices: { baseSys: 2, perSiteSys: 0.2, staffPer: 6,  costPer: 30000 },  // practice mgmt, ambulatory EHR
      urgent_care:         { baseSys: 2, perSiteSys: 0.2, staffPer: 8,  costPer: 35000 },  // UC workflow, triage
      imaging_centers:     { baseSys: 3, perSiteSys: 0.3, staffPer: 10, costPer: 60000 },  // RIS, mini-PACS, reporting
      dialysis:            { baseSys: 2, perSiteSys: 0.2, staffPer: 10, costPer: 40000 },  // dialysis mgmt, vascular access
      snf:                 { baseSys: 3, perSiteSys: 0.3, staffPer: 15, costPer: 50000 },  // resident mgmt, MDS/billing, pharmacy
      home_health:         { baseSys: 2, perSiteSys: 0.2, staffPer: 12, costPer: 35000 },  // scheduling, OASIS reporting
      behavioral:          { baseSys: 2, perSiteSys: 0.2, staffPer: 10, costPer: 40000 },  // behavioral EHR, outcomes
      rehab:               { baseSys: 2, perSiteSys: 0.2, staffPer: 10, costPer: 40000 },  // rehab mgmt, therapy docs
      ltach:               { baseSys: 3, perSiteSys: 0.3, staffPer: 15, costPer: 50000 },  // similar to SNF
    };
    let portfolioSystems = 0, portfolioStaff = 0, portfolioCost = 0;
    for (const [key, count] of Object.entries(facilities)) {
      if (key === "hospitals" || !count || count <= 0) continue;
      const p = FAC_PROFILE[key] || { baseSys: 2, perSiteSys: 0.2, staffPer: 8, costPer: 40000 };
      portfolioSystems += Math.round(p.baseSys + (count - 1) * p.perSiteSys);
      portfolioStaff += count * p.staffPer;
      portfolioCost += count * p.costPer;
    }

    return {
      ...inputs,
      _medicareDrgRevenue: 0,
      _occupancy: occupancyRate,
      _providerType: providerType,
      // Issue 5: Apply complexity_boost and denial_factor from provider multipliers
      _medicarePct: pm.medicare_pct || 0.42,
      _penaltyWeight: (rm.penalty_weight || 1.0) * (pm.penalty_exposure ?? 1.0),
      _denialWeight: (rm.denial_weight || 1.0) * (pm.denial_factor || 1.0),
      _qualityBonus: rm.quality_bonus || 0.5,
      _complexityBoost: pm.complexity_boost || 1.0,
      // Issue 2: Non-acute facility portfolio
      _portfolioSystems: portfolioSystems,
      _portfolioStaff: portfolioStaff,
      _portfolioCost: portfolioCost,
      // Issue 1: Known spend override
      _knownSpend: costMode === "known" && knownSpend > 0 ? knownSpend : 0,
    };
  }, [inputs, providerType, reimbursementModel, occupancyRate, facilities, costMode, knownSpend]);

  const r = useMemo(() => calc(calcInputs, UKI ? scenarioMode : "EXPECTED", {}, flagships), [calcInputs, flagships, scenarioMode]);

  const handleCalculate = useCallback(() => setCalibrating(true), []);
  const handleCalibrationDone = useCallback(() => {
    setCalibrating(false);
    setKioskStep(KIOSK_STEPS.length - 1);
    // Capture session metadata so the admin overlay can break stats down by
    // organisation type and report cumulative impact across all assessments.
    recordCompletion({
      providerType: UKI ? orgType : providerType,
      beds: inputs.bed_count,
      orgs: inputs.org_count,
      systems: r.legacy || 0,
      decomSystems: r.decom || 0,
      savings: r.annualWithReimbursement || r.annual || 0,
      fte: r.fteEquivalent || 0,
      medErrors: r.safetyMedErrorsAvoided || 0,
      patientsProtected: r.safetyPatientsProtected || 0,
      bedDays: r.safetyBedDaysAvoided || 0,
      decomSave: r.decomSave || 0,
      timeSave: r.timeSave || 0,
    });
  }, [providerType, inputs, r]);
  const handleAdjust = useCallback(() => setKioskStep(4), []);
  const handleStartOver = useCallback(() => {
    setShowSplash(true);
    setKioskStep(0);
    setProviderType("community");
    setOrgType("TYPICAL");
    setScenarioMode("EXPECTED");
    setReimbursementModel("mixed");
    setOccupancyRate(0.65);
    setGalenMigrationCost(0);
    setGalenAnnualCost(0);
    setFlagships([]);
    setFacilitiesState({});
    setCostMode("estimate");
    setKnownSpend(0);
    setInputs({ ...PRESETS.TYPICAL.data, tiers: { ...PRESETS.TYPICAL.data.tiers } });
  }, []);

  // Resets all inputs and jumps to step 0 (Scope) without showing the splash.
  // Used by the subtle "Start over" button on every input step's nav bar.
  // Splash is reserved for fresh-from-idle / fresh-from-completion states.
  const handleResetInputs = useCallback(() => {
    setKioskStep(0);
    setCalibrating(false);
    setProviderType("community");
    setOrgType("TYPICAL");
    setScenarioMode("EXPECTED");
    setReimbursementModel("mixed");
    setOccupancyRate(0.65);
    setGalenMigrationCost(0);
    setGalenAnnualCost(0);
    setFlagships([]);
    setFacilitiesState({});
    setCostMode("estimate");
    setKnownSpend(0);
    setInputs({ ...PRESETS.TYPICAL.data, tiers: { ...PRESETS.TYPICAL.data.tiers } });
  }, []);

  const renderStep = () => {
    switch (kioskStep) {
      case 0: return UKI ? <OrgTypeStep orgType={orgType} onSelect={selectOrgType} /> : <ProviderStep providerType={providerType} onSelect={selectProvider} reimbursementModel={reimbursementModel} setReimbursementModel={setReimbursementModel} />;
      case 1: return <JourneyStep journey={inputs.journey} onSelect={v => update("journey", v)} />;
      case 2: return UKI ? <ScaleStep inputs={inputs} update={update} /> : <FacilitiesStep inputs={inputs} update={update} facilities={facilities} setFacility={setFacility} />;
      case 3: return <SystemsStep inputs={inputs} updateTier={updateTier} flagships={flagships} addFlagship={addFlagship} removeFlagship={removeFlagship} updateFlagshipCost={updateFlagshipCost} updateFlagshipInstances={updateFlagshipInstances} costMode={costMode} setCostMode={setCostMode} knownSpend={knownSpend} setKnownSpend={setKnownSpend} />;
      case 4: return <FineTuneStep inputs={inputs} update={update} galenMigrationCost={galenMigrationCost} setGalenMigrationCost={setGalenMigrationCost} galenAnnualCost={galenAnnualCost} setGalenAnnualCost={setGalenAnnualCost} occupancyRate={occupancyRate} setOccupancyRate={setOccupancyRate} />;
      case 5: return <ResultsPage r={r} galenMigrationCost={galenMigrationCost} galenAnnualCost={galenAnnualCost} viewTimescale={viewTimescale} setViewTimescale={setViewTimescale} onAdjust={handleAdjust} onStartOver={handleStartOver} leadContext={UKI ? { orgType, beds: inputs.bed_count, orgs: inputs.org_count, journey: inputs.journey, scenarioMode, calcInputs, flagships } : { providerType, beds: inputs.bed_count, orgs: inputs.org_count, reimbursementModel, calcInputs, flagships }} />;
      default: return null;
    }
  };

  // Idle timeout - reset to splash after 90 seconds of no user activity
  // Only active when not on splash (otherwise the splash auto-advances unwantedly)
  // Kiosk-only chrome: a web visitor stepping away shouldn't lose their inputs,
  // so the embed build never idle-resets (same as the Smart Match web build).
  useEffect(() => {
    if (EMBED || showSplash) return;
    let timeoutId = null;
    const IDLE_MS = 15 * 60 * 1000; // 15 minutes
    const goToSplash = () => {
      setShowSplash(true);
      setKioskStep(0);
      setCalibrating(false);
      setProviderType("community");
      setReimbursementModel("mixed");
      setOccupancyRate(0.65);
      setGalenMigrationCost(0);
      setGalenAnnualCost(0);
      setFlagships([]);
      setFacilitiesState({});
      setCostMode("estimate");
      setKnownSpend(0);
      setInputs({ ...PRESETS.TYPICAL.data, tiers: { ...PRESETS.TYPICAL.data.tiers } });
    };
    const reset = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(goToSplash, IDLE_MS);
    };
    reset();
    document.addEventListener('touchstart', reset, { passive: true });
    document.addEventListener('mousedown', reset);
    document.addEventListener('keydown', reset);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('touchstart', reset);
      document.removeEventListener('mousedown', reset);
      document.removeEventListener('keydown', reset);
    };
  }, [showSplash]);

  useEffect(() => {
    if (!EMBED) return;
    const onHash = () => setAdminLeads(window.location.hash === '#admin-leads');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Embed: the page scrolls at body level, so jump back to the top when the
  // step changes — otherwise tapping Next leaves the user mid-page on the
  // next step. (Kiosk scrolls inside its fixed-height container instead.)
  useEffect(() => {
    if (!EMBED) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [kioskStep, calibrating, showSplash]);

  // Embed: publish the sticky header's height as a CSS variable so the
  // sticky step title / timescale bar can pin themselves just below it.
  // Measured (not hardcoded) because the header's height changes with
  // breakpoint padding and step-label wrapping on narrow screens.
  useEffect(() => {
    if (!EMBED || showSplash) return;
    const el = embedHeaderRef.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty('--embed-header-h', el.offsetHeight + 'px');
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showSplash, calibrating]);

  if (EMBED && adminLeads) {
    return <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <AdminLeads onClose={() => { window.location.hash = ''; }} />
    </div>;
  }

  if (showSplash) return <>
    <SplashScreen onStart={() => setShowSplash(false)} onAdminReveal={() => setAdminVisible(true)} />
    {adminVisible && <AdminOverlay onClose={() => setAdminVisible(false)} />}
  </>;

  if (calibrating) {

  return <div style={EMBED
      ? { fontFamily: "'DM Sans', sans-serif", background: C.bg, width: "100%", maxWidth: MAXW, margin: "0 auto", minHeight: "100vh", color: C.text, position: "relative", zIndex: 0 }
      : { fontFamily: "'DM Sans', sans-serif", background: C.bg, width: W, minHeight: H, height: '100vh', color: C.text, position: "relative", zIndex: 0 }}>
      {EMBED && <EmbedStyles />}
      {!EMBED && <BackgroundParticles />}
      <CalibratingScreen onDone={handleCalibrationDone} />
      {adminVisible && <AdminOverlay onClose={() => setAdminVisible(false)} />}
    </div>;
  }

  return (
    <div style={EMBED
      ? { fontFamily: "'DM Sans', sans-serif", background: C.bg, width: "100%", maxWidth: MAXW, margin: "0 auto", minHeight: "100vh", color: C.text, lineHeight: 1.55, display: "flex", flexDirection: "column", position: "relative", zIndex: 0 }
      : { fontFamily: "'DM Sans', sans-serif", background: C.bg, width: W, minHeight: H, color: C.text, lineHeight: 1.55, display: "flex", flexDirection: "column", position: "relative", zIndex: 0 }}>
      {EMBED && <EmbedStyles />}
      {!EMBED && <BackgroundParticles />}
      <div ref={embedHeaderRef} className={EMBED ? "embed-header-pad" : undefined} style={{ padding: "48px 56px 0" }}>
        <StepIndicator steps={KIOSK_STEPS} current={kioskStep} onJump={setKioskStep} />
      </div>
      {/* Timescale bar — rendered here (above the scroll container) instead
          of inside ResultsPage so it stays visible no matter how far the user
          scrolls. position: sticky inside ResultsPage didn't work reliably
          because PageTransition's transform-based animation creates a
          containing block. This sits in the static-flex column above the
          scrollable content area. Only renders on the report screen
          (kioskStep === 5). */}
      {kioskStep === 5 && <TimescaleBar viewTimescale={viewTimescale} setViewTimescale={setViewTimescale} scenarioMode={UKI ? scenarioMode : null} setScenarioMode={setScenarioMode} />}
      <div className={EMBED ? "embed-scroll-area" : undefined} style={{ flex: 1, overflowY: "auto", padding: "0 56px 32px" }}>
        <PageTransition step={kioskStep}>{renderStep()}</PageTransition>
      </div>
      <NavButtons step={kioskStep} totalSteps={KIOSK_STEPS.length} onBack={() => setKioskStep(p => p - 1)} onNext={() => setKioskStep(p => p + 1)} onCalculate={handleCalculate} onStartOver={handleStartOver} />
      {adminVisible && <AdminOverlay onClose={() => setAdminVisible(false)} />}
    </div>
  );
}

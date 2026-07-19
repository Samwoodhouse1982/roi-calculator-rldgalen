import React, { useState, useCallback } from 'react';
import { C, F, fmtK, fmtNum } from '../theme';

/* ────────────────────────────────────────────────────────────────────────
   Lead capture — ported from the Smart Match web build's LeadCapture and
   adapted for the Galen Clinical Archive US embed. Same mechanics, minus
   the PDF generator (kept "quick"; a specialist follow-up is the value
   exchange instead):

   1. Submission is backed up to localStorage (reviewable at #admin-leads,
      exportable as CSV) so leads survive offline/blocked-network conditions.
   2. Fire-and-forget POST to HubSpot with the calculator context in the
      message field.

   EMBED-ONLY: rendered behind the EMBED flag in ResultsPage/App, so the
   touchscreen kiosk build is unaffected.

   The HubSpot portal is RLDatix's. The form GUID below is the same interim
   GUID the Smart Match web build borrowed from a live RLDatix calculator
   form — swap it for a dedicated Galen US form GUID when marketing creates
   one; submissions are distinguishable meanwhile via the message field
   ("Galen Clinical Archive ROI ...").
   ──────────────────────────────────────────────────────────────────────── */
const HUBSPOT_PORTAL_ID = "27174408";
const HUBSPOT_FORM_GUID = "3f860858-5a58-4f1b-8419-a561af17adbe";   // interim: shared RLDatix calculator form — replace with a Galen US form GUID when available
const HUBSPOT_REGION = "eu1";

const STORAGE_KEY = "galen-roi-embed-submissions";
const MAX_RECORDS = 200;

const ROLE_OPTIONS = [
  "CIO / IT leadership",
  "CMIO / Clinical informatics",
  "HIM / Health records",
  "Finance / Business case",
  "EHR / Applications team",
  "Consultant / Advisory",
  "Other",
];

const PROVIDER_LABELS = {
  critical_access: "Critical Access / Rural",
  community: "Community Hospital",
  regional: "Regional Medical Center",
  academic: "Academic Medical Center",
  multi_hospital: "IDN / Health System",
};

function readSubmissions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (e) { return []; }
}

function saveSubmission(record) {
  try {
    const existing = readSubmissions();
    existing.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, MAX_RECORDS)));
  } catch (e) { console.warn("Local backup failed:", e); }
}

const MailIcon = ({ size = 22, stroke = "#34DEC2" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

export function LeadCapture({ r, leadContext }) {
  const [lead, setLead] = useState({ name: "", email: "", org: "", role: "" });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Light fields on the deep-teal card: near-white so they read as inputs.
  const inputStyle = {
    flex: "1 1 200px", minWidth: 150, padding: "11px 14px", borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.92)",
    color: "#0F4146", fontSize: F.small, outline: "none", fontFamily: "inherit",
  };

  const submitLead = useCallback(async () => {
    if (!lead.name || !lead.email || sending) return;
    setSending(true);

    const ctx = leadContext || {};
    const providerLabel = PROVIDER_LABELS[ctx.providerType] || ctx.providerType || "";

    // 1. Local backup (reviewable at #admin-leads; survives blocked networks).
    saveSubmission({
      timestamp: new Date().toISOString(),
      lead: { name: lead.name, email: lead.email, org: lead.org, role: lead.role },
      inputs: { providerType: ctx.providerType, beds: ctx.beds, orgs: ctx.orgs, reimbursementModel: ctx.reimbursementModel },
      results: {
        annualSavings: r.annualWithReimbursement || r.annual || 0,
        legacySystems: r.legacy || 0,
        systemsRetired: r.decom || 0,
        fteFreed: r.fteEquivalent || 0,
        patientsProtected: r.safetyPatientsProtected || 0,
      },
    });

    // 2. Fire-and-forget to HubSpot, context in the message field.
    if (HUBSPOT_PORTAL_ID && HUBSPOT_FORM_GUID) {
      try {
        const context = `Galen Clinical Archive ROI (US embed) submission | Provider: ${providerLabel} | Beds: ${fmtNum(ctx.beds || 0)} | Legacy systems: ${r.legacy || 0} (${r.decom || 0} retired) | Est. annual savings: ${fmtK(r.annualWithReimbursement || r.annual || 0)} | FTE freed: ${r.fteEquivalent || 0}`;
        await fetch(`https://forms-${HUBSPOT_REGION}.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: [
              { name: "firstname", value: lead.name.split(" ")[0] },
              { name: "lastname", value: lead.name.split(" ").slice(1).join(" ") || "" },
              { name: "email", value: lead.email },
              { name: "company", value: lead.org || "" },
              { name: "jobtitle", value: lead.role || "" },
              { name: "message", value: context },
            ],
            context: { pageUri: window.location.href, pageName: "Galen Clinical Archive ROI Calculator (US embed)" },
            legalConsentOptions: { consent: { consentToProcess: true, text: "I agree to receive communications about my ROI estimate." } },
          }),
        });
      } catch (e) { console.warn("HubSpot submission failed:", e); }
    }

    setSending(false);
    setSubmitted(true);
  }, [lead, sending, r, leadContext]);

  if (submitted) {
    return <div style={{ marginBottom: 28, padding: "26px 28px", borderRadius: 18, background: "linear-gradient(135deg, #0F4146 0%, #1A5459 100%)", textAlign: "center" }}>
      <div style={{ fontSize: F.h3, fontWeight: 800, color: "#34DEC2", marginBottom: 8 }}>Thanks, {lead.name.split(" ")[0]} — we've got your details.</div>
      <div style={{ fontSize: F.small, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>An RLDatix archiving specialist will follow up with a full breakdown of these figures, validated against your legacy application estate.</div>
    </div>;
  }

  const ready = lead.name && lead.email;

  // Deep-teal card on the light page — the house lead-gen treatment.
  return <div style={{ marginBottom: 28, padding: "clamp(18px, 3vw, 28px)", borderRadius: 18, background: "linear-gradient(135deg, #0F4146 0%, #1A5459 100%)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <MailIcon size={22} stroke="#34DEC2" />
      <h3 style={{ fontSize: F.h3, fontWeight: 800, margin: 0, color: "#fff" }}>Get the full breakdown for your health system</h3>
    </div>
    <p style={{ fontSize: F.small, color: "rgba(255,255,255,0.75)", marginTop: 6, marginBottom: 18 }}>Share your details and an RLDatix specialist will send a formatted summary of this estimate, ready for your team or board.</p>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
      <input type="text" placeholder="Your name *" aria-label="Your name (required)" autoComplete="name" value={lead.name} onChange={e => setLead(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
      <input type="email" placeholder="Work email *" aria-label="Work email (required)" autoComplete="email" value={lead.email} onChange={e => setLead(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
    </div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
      <input type="text" placeholder="Organization" aria-label="Organization" autoComplete="organization" value={lead.org} onChange={e => setLead(p => ({ ...p, org: e.target.value }))} style={inputStyle} />
      <select aria-label="Your role" value={lead.role} onChange={e => setLead(p => ({ ...p, role: e.target.value }))} style={{ ...inputStyle, color: lead.role ? "#0F4146" : "#5F787C" }}>
        <option value="" style={{ color: "#0F4146" }}>Your role</option>
        {ROLE_OPTIONS.map(o => <option key={o} value={o} style={{ color: "#0F4146" }}>{o}</option>)}
      </select>
    </div>
    <button type="button" onClick={submitLead} disabled={!ready || sending} style={{
      padding: "14px 32px", background: ready ? "#fff" : "rgba(255,255,255,0.15)",
      color: ready ? "#0F4146" : "rgba(255,255,255,0.4)",
      border: "none", borderRadius: 999, fontSize: F.body, fontWeight: 800,
      cursor: ready && !sending ? "pointer" : "not-allowed", fontFamily: "inherit",
    }}>{sending ? "Sending..." : "Request my report"}</button>
    <p style={{ fontSize: F.tiny, color: "rgba(255,255,255,0.55)", marginTop: 12, marginBottom: 0 }}>By submitting your details, you agree to share your name and email address so we can reach out about your estimate. Details are processed in line with RLDatix's privacy notice.</p>
  </div>;
}

/* ── #admin-leads: review + CSV-export locally stored submissions ─────────
   Ported from the Smart Match web build. Records live only in this
   browser's localStorage (per device); HubSpot remains the system of
   record. */
export function AdminLeads({ onClose }) {
  const [records, setRecords] = useState(readSubmissions());

  const exportCSV = () => {
    const esc = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const rows = [["Timestamp", "Name", "Email", "Organization", "Role", "Provider type", "Beds", "Legacy systems", "Systems retired", "Est. annual savings", "FTE freed"]];
    for (const rec of records) rows.push([
      rec.timestamp, rec.lead?.name, rec.lead?.email, rec.lead?.org, rec.lead?.role,
      rec.inputs?.providerType, rec.inputs?.beds, rec.results?.legacySystems,
      rec.results?.systemsRetired, rec.results?.annualSavings, rec.results?.fteFreed,
    ]);
    const csv = rows.map(row => row.map(esc).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "galen-roi-leads-" + new Date().toISOString().split("T")[0] + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const clearAll = () => {
    if (!window.confirm("Permanently delete all " + records.length + " local lead records? This cannot be undone (HubSpot copies are unaffected).")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    setRecords([]);
  };

  const cell = { padding: "10px 12px", fontSize: F.tiny, color: C.textMid, borderBottom: `1px solid ${C.borderLight}`, textAlign: "left", whiteSpace: "nowrap" };

  return <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(20px, 4vw, 48px)" }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: F.tiny, fontWeight: 700, color: C.green, letterSpacing: 3, textTransform: "uppercase" }}>Admin · local records</div>
        <h2 style={{ fontSize: F.h2, fontWeight: 800, color: C.text, margin: "4px 0 0" }}>Lead form submissions ({records.length})</h2>
        <p style={{ fontSize: F.tiny, color: C.textMuted, marginTop: 6 }}>Stored in this browser only, as a backup; HubSpot holds the canonical copies. Remove <code>#admin-leads</code> from the URL to return.</p>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={exportCSV} disabled={!records.length} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: records.length ? C.accent : C.border, color: records.length ? "#fff" : C.textMuted, fontSize: F.tiny, fontWeight: 700, cursor: records.length ? "pointer" : "default", fontFamily: "inherit" }}>Export CSV</button>
        <button onClick={clearAll} disabled={!records.length} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: records.length ? C.textMid : C.textMuted, fontSize: F.tiny, fontWeight: 600, cursor: records.length ? "pointer" : "default", fontFamily: "inherit" }}>Clear</button>
        <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.textMid, fontSize: F.tiny, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
      </div>
    </div>
    {!records.length ? (
      <div style={{ padding: 48, textAlign: "center", background: C.surface, borderRadius: 14, border: `1px dashed ${C.border}`, color: C.textMuted, fontSize: F.small }}>
        No submissions yet. Records appear here as users complete the lead form in this browser.
      </div>
    ) : (
      <div style={{ overflowX: "auto", background: C.surface, borderRadius: 14, border: `1px solid ${C.borderLight}` }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr>{["When", "Name", "Email", "Organization", "Role", "Est. savings", "Systems"].map(h => <th key={h} style={{ ...cell, color: C.textMuted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
          <tbody>
            {records.map((rec, i) => <tr key={i}>
              <td style={cell}>{new Date(rec.timestamp).toLocaleString("en-US")}</td>
              <td style={{ ...cell, color: C.text, fontWeight: 600 }}>{rec.lead?.name || "-"}</td>
              <td style={cell}>{rec.lead?.email || "-"}</td>
              <td style={cell}>{rec.lead?.org || "-"}</td>
              <td style={cell}>{rec.lead?.role || "-"}</td>
              <td style={{ ...cell, color: C.green, fontWeight: 700 }}>{rec.results?.annualSavings != null ? fmtK(rec.results.annualSavings) : "-"}</td>
              <td style={cell}>{rec.results?.legacySystems != null ? `${rec.results.systemsRetired || 0}/${rec.results.legacySystems}` : "-"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    )}
  </div>;
}

import React, { useState, useCallback } from 'react';
import { C, F, fmtK, fmtNum } from '../theme';
import rldatixLogo from '../assets/rldatix-logo.png';
import { calc } from '../calc/engine';

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

// Fetch the bundled white RLDatix wordmark as a data URL for jsPDF (best-effort).
async function logoDataUrl() {
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = rldatixLogo; });
    // Downscale before embedding: jsPDF stores PNGs as raw pixels, so the
    // full-size asset would bloat the file by megabytes.
    const w = 400, h = Math.round(w * img.height / img.width);
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    cv.getContext("2d").drawImage(img, 0, 0, w, h);
    return cv.toDataURL("image/png");
  } catch (e) { return null; }
}

/* One-page PDF summary (jsPDF, bundled — no CDN dependency). Same layout
   family as the Smart Match web report: navy header with the white RLDatix
   wordmark top-right, two headline callout boxes, a KPI row, the savings-ramp
   tiles, Your inputs + savings composition side by side, the worked-out
   equation strip, About these figures, and the disclaimer. RLDatix light
   palette. */
async function generatePDF(r, lead, ctx) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const NAVY = [15, 65, 70], TEAL = [26, 138, 122], SEAFOAM = [52, 222, 194],
        PALE = [238, 247, 242], PALE_SEA = [232, 250, 246], BORDER = [212, 224, 221],
        TEXT = [15, 65, 70], MID = [61, 90, 94], MUTED = [120, 130, 150];
  const M = 14, W = 210 - 2 * M;
  const usd = n => "$" + Math.round(n || 0).toLocaleString("en-US");
  const PROVIDERS = {
    critical_access: "Critical Access / Rural", community: "Community Hospital",
    regional: "Regional Medical Center", academic: "Academic Medical Center",
    multi_hospital: "IDN / Health System",
  };
  const REIMB = { ffs: "Fee-for-Service", vbc: "Value-Based", mixed: "Mixed" };
  const total = r.annualWithReimbursement || r.annual || 0;

  // ── Header band ──
  doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 34, "F");
  doc.setFillColor(...SEAFOAM); doc.rect(0, 34, 210, 1.4, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(17);
  doc.text("Galen Clinical Archive: ROI Estimate", M, 16);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...SEAFOAM);
  doc.text("RLDatix · " + new Date().toLocaleDateString("en-US") + (lead.org ? " · " + lead.org : ""), M, 24);
  const logo = await logoDataUrl();
  if (logo) { try { doc.addImage(logo, "PNG", 210 - M - 38, 9, 38, 7.3); } catch (e) { /* header still fine without it */ } }

  // ── Headline callouts ──
  let y = 42;
  doc.setTextColor(...MUTED); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
  doc.text("YOUR ESTIMATED ANNUAL IMPACT", M, y); y += 3;
  const hbW = (W - 4) / 2, hbH = 28;
  const headlineBox = (x, big, label, sub) => {
    doc.setFillColor(...PALE_SEA); doc.setDrawColor(...TEAL);
    doc.roundedRect(x, y, hbW, hbH, 2.5, 2.5, "FD");
    doc.setTextColor(...TEAL); doc.setFont("helvetica", "bold"); doc.setFontSize(21);
    doc.text(big, x + hbW / 2, y + 13, { align: "center" });
    doc.setTextColor(...TEXT); doc.setFontSize(9.5);
    doc.text(label, x + hbW / 2, y + 20, { align: "center" });
    doc.setTextColor(...MID); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
    doc.text(sub, x + hbW / 2, y + 24.5, { align: "center" });
  };
  headlineBox(M, usd(total), "Potential annual savings", "at steady state, all categories combined");
  headlineBox(M + hbW + 4, `${r.decom || 0} of ${r.legacy || 0}`, "legacy systems retired", "decommissioned and archived into Galen");
  y += hbH + 6;

  // ── KPI row ──
  const kW = (W - 9) / 4, kH = 21;
  const kpis = [
    ["DECOMMISSION SAVINGS", usd(r.decomSave), "licensing, support and infrastructure retired"],
    ["CLINICAL CAPACITY", (r.fteEquivalent || 0) + " FTE", usd(r.timeSave) + "/yr clinician time value"],
    ["REIMBURSEMENT", usd(r.reimbursementImpact), "CMS penalties + denial recovery"],
    ["PATIENT SAFETY", usd(r.qualitySavings), "cost avoidance from harm prevented"],
  ];
  kpis.forEach(([label, val, sub], i) => {
    const x = M + i * (kW + 3);
    doc.setFillColor(255, 255, 255); doc.setDrawColor(...BORDER);
    doc.roundedRect(x, y, kW, kH, 2, 2, "FD");
    doc.setTextColor(...MUTED); doc.setFont("helvetica", "bold"); doc.setFontSize(6.3);
    doc.text(label, x + 3, y + 5);
    doc.setTextColor(...NAVY); doc.setFontSize(12.5);
    doc.text(String(val), x + 3, y + 11.5);
    doc.setTextColor(...MID); doc.setFont("helvetica", "normal"); doc.setFontSize(6.2);
    doc.text(doc.splitTextToSize(sub, kW - 6), x + 3, y + 15.5);
  });
  y += kH + 7;

  // ── Confidence scenarios: every level modeled, the calculator's Expected
  //    estimate flagged (same treatment as the Smart Match report). Each tile
  //    recomputes the whole model at that confidence level. ──
  let scenarios = null;
  if (ctx.calcInputs) {
    try {
      scenarios = [
        ["Conservative", "85% decom · 20% capacity · 15% safety capture", calc(ctx.calcInputs, "CONSERVATIVE", {}, ctx.flagships || [])],
        ["Moderate", "100% decom · 30% capacity · 25% safety capture", r],
        ["Optimistic", "110% decom · 40% capacity · 35% safety capture", calc(ctx.calcInputs, "STRETCH", {}, ctx.flagships || [])],
      ];
    } catch (e) { scenarios = null; }
  }
  if (scenarios) {
    doc.setTextColor(...MUTED); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
    doc.text("SAVING BY CONFIDENCE LEVEL", M, y); y += 3;
    const sW = (W - 8) / 3, sH = 44;
    scenarios.forEach(([key, factors, rr], i) => {
      const x = M + i * (sW + 4);
      const selected = key === "Moderate";
      if (selected) { doc.setFillColor(...PALE_SEA); doc.setDrawColor(...TEAL); doc.setLineWidth(0.7); }
      else { doc.setFillColor(255, 255, 255); doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); }
      doc.roundedRect(x, y, sW, sH, 2.5, 2.5, "FD");
      doc.setLineWidth(0.2);
      doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
      doc.text(key, x + 4, y + 8);
      doc.setTextColor(...MID); doc.setFont("helvetica", "normal"); doc.setFontSize(5.8);
      doc.text(factors, x + 4, y + 12);
      if (selected) {
        doc.setFillColor(...TEAL); doc.roundedRect(x + sW - 29, y + 3.5, 25, 5.5, 2.75, 2.75, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(6);
        doc.text("YOUR ESTIMATE", x + sW - 16.5, y + 7.2, { align: "center" });
      }
      doc.setTextColor(...TEAL); doc.setFont("helvetica", "bold"); doc.setFontSize(13.5);
      doc.text(usd(rr.annualWithReimbursement), x + 4, y + 19.5);
      doc.setTextColor(...MID); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
      doc.text("per year at steady state", x + 4, y + 23.5);
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.line(x + 4, y + 25.5, x + sW - 4, y + 25.5);
      const stats = [
        ["Decommission", fmtK(rr.decomSave)],
        ["Clinical capacity", fmtK(rr.timeSave)],
        ["Reimbursement", fmtK(rr.reimbursementImpact)],
        ["Patient safety", fmtK(rr.qualitySavings)],
      ];
      let sy = y + 29.5;
      stats.forEach(([k2, v2]) => {
        doc.setFont("helvetica", "normal"); doc.setFontSize(6.8); doc.setTextColor(...MID);
        doc.text(k2, x + 4, sy);
        doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
        doc.text(String(v2), x + sW - 4, sy, { align: "right" });
        sy += 4.1;
      });
    });
    y += sH + 4;
  }

  // ── Ramp summary (compressed to one strip so the page stays a one-pager) ──
  doc.setTextColor(...MID); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.text(`Adoption ramp: Year 1 ${usd(r.yr1R)} (40%)  ·  Year 2 ${usd(r.yr2R)} (80%)  ·  Year 3 ${usd(r.yr3R)} (100%)`, M, y); y += 4.5;
  doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED); doc.setFontSize(7.5);
  doc.text(`3-year total: ${usd(r.total3WithReimbursement)}   ·   5-year total (20/40/60/80/100% ramp): ${usd(r.total5WithReimbursement)}`, M, y);
  y += 6;

  // ── Two columns: Your inputs | Where the savings come from ──
  const colW = (W - 4) / 2, colH = 42;
  const colBox = (x, title, rows, note) => {
    doc.setFillColor(...PALE); doc.setDrawColor(...BORDER);
    doc.roundedRect(x, y, colW, colH, 2.5, 2.5, "FD");
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
    doc.text(title, x + 4, y + 7);
    let ry = y + 13;
    doc.setFontSize(8);
    rows.forEach(([k, v]) => {
      doc.setTextColor(...MID); doc.setFont("helvetica", "normal");
      doc.text(k, x + 4, ry);
      doc.setTextColor(...TEXT); doc.setFont("helvetica", "bold");
      doc.text(String(v), x + colW - 4, ry, { align: "right" });
      ry += 5.1;
    });
    if (note) { doc.setTextColor(...MUTED); doc.setFont("helvetica", "italic"); doc.setFontSize(6.5); doc.text(note, x + 4, y + colH - 3.5); }
  };
  colBox(M, "Your inputs", [
    ["Provider type", PROVIDERS[ctx.providerType] || ctx.providerType || "-"],
    ["Total acute beds", fmtNum(ctx.beds || 0)],
    ["Hospitals / facilities", fmtNum(ctx.orgs || 1)],
    ["Reimbursement model", REIMB[ctx.reimbursementModel] || ctx.reimbursementModel || "-"],
    ["Legacy systems in scope", fmtNum(r.legacy || 0)],
  ]);
  const comp = [
    ["Legacy decommission", fmtK(r.decomSave)],
    ["Clinical capacity", fmtK(r.timeSave)],
    ["Reimbursement impact", fmtK(r.reimbursementImpact)],
    ["Patient safety", fmtK(r.qualitySavings)],
  ];
  if (r.academicSavings > 0) comp.push(["Academic program", fmtK(r.academicSavings)]);
  if (r.mergeSavings > 0) comp.push(["Network consolidation", fmtK(r.mergeSavings)]);
  while (comp.length < 5) comp.push(["", ""]);
  colBox(M + colW + 4, "Where the savings come from", comp.slice(0, 5),
    "Patient safety is cost avoidance - harm that does not occur.");
  y += colH + 5;

  // ── How the total is built ──
  doc.setFillColor(...PALE_SEA); doc.setDrawColor(...TEAL);
  doc.roundedRect(M, y, W, 20, 2.5, 2.5, "FD");
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
  doc.text("How the annual total is built", M + 4, y + 7);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...MID);
  const extras = (r.academicSavings > 0 ? `  +  ${usd(r.academicSavings)} academic` : "") + (r.mergeSavings > 0 ? `  +  ${usd(r.mergeSavings)} network` : "");
  doc.text(`${usd(r.decomSave)} decommission  +  ${usd(r.timeSave)} capacity  +  ${usd(r.reimbursementImpact)} reimbursement  +  ${usd(r.qualitySavings)} safety${extras}`, M + 4, y + 12.5);
  doc.setFont("helvetica", "bold"); doc.setTextColor(...TEAL);
  doc.text(`=  ${usd(total)} per year at steady state`, M + 4, y + 17.5);
  y += 20 + 6;

  // ── About these figures ──
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.line(M, y, M + W, y); y += 5;
  doc.setTextColor(...MUTED); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.text("ABOUT THESE FIGURES", M, y); y += 5;
  const explain = [
    ["System costs", "per-system estimates by tier (enterprise / departmental / standalone), scaled by bed count. Sources: KLAS 2025 benchmarks, Becker's Hospital Review."],
    ["Clinical capacity", "clinician time freed by eliminating context-switching across legacy systems, valued at a $95/hr blended rate with a conservative 30% realization factor. Sources: Bartek et al JIMI 2023 (2.78M EHR audit-log events), Sinsky et al 2016."],
    ["Reimbursement", "CMS penalty programs (HRRP 0.33% avg, HAC, VBP) plus denial recovery: 4.8% net revenue loss (HFMA), 30% attributed to documentation fragmentation, 20% recoverable through consolidation."],
  ];
  doc.setFontSize(7.5);
  explain.forEach(([term, def]) => {
    const label = term + ": ";
    doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
    doc.text(label, M, y);
    const lw = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...MID);
    const lines = doc.splitTextToSize(def, W - lw);
    doc.text(lines, M + lw, y);
    y += lines.length * 3.3 + 1.3;
  });
  y += 2;

  // ── Disclaimer ──
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.line(M, y, M + W, y); y += 4.5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.8); doc.setTextColor(...MUTED);
  doc.text("DISCLAIMER", M, y); y += 3.6;
  doc.setFont("helvetica", "italic"); doc.setFontSize(6.8); doc.setTextColor(...MUTED);
  doc.text(doc.splitTextToSize("Indicative only, not a quote or a guarantee. Figures are modeled estimates with improvement rates attributed to system consolidation as a contributing factor, not sole cause. Validate against your organization's own application inventory, contracts, and payer mix before use in a business case.", W), M, y);

  const orgSlug = lead.org ? "-" + lead.org.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") : "";
  doc.save("galen-roi-estimate" + orgSlug + ".pdf");
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

    // 1. Generate + download the PDF summary (the value exchange).
    try { await generatePDF(r, lead, ctx); } catch (e) { console.warn("PDF failed:", e); }

    // 2. Local backup (reviewable at #admin-leads; survives blocked networks).
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

    // 3. Fire-and-forget to HubSpot, context in the message field.
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
      <div style={{ fontSize: F.h3, fontWeight: 800, color: "#34DEC2", marginBottom: 8 }}>Thanks, {lead.name.split(" ")[0]}, your report has downloaded.</div>
      <div style={{ fontSize: F.small, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>An RLDatix archiving specialist can validate these figures against your legacy application estate. We'll be in touch.</div>
    </div>;
  }

  const ready = lead.name && lead.email;

  // Deep-teal card on the light page — the house lead-gen treatment.
  return <div style={{ marginBottom: 28, padding: "clamp(18px, 3vw, 28px)", borderRadius: 18, background: "linear-gradient(135deg, #0F4146 0%, #1A5459 100%)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <MailIcon size={22} stroke="#34DEC2" />
      <h3 style={{ fontSize: F.h3, fontWeight: 800, margin: 0, color: "#fff" }}>Get this breakdown as a PDF</h3>
    </div>
    <p style={{ fontSize: F.small, color: "rgba(255,255,255,0.75)", marginTop: 6, marginBottom: 18 }}>Download a formatted summary of this estimate, ready to share with your team or board.</p>
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
    }}>{sending ? "Generating report..." : "Download PDF report"}</button>
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

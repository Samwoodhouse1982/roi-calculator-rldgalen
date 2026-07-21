import React, { useCallback } from 'react';
import { C, F } from '../theme';
import { UKI } from '../market';
import rldatixLogo from '../assets/rldatix-logo.png';
import klasBadge from '../assets/best-in-klas-2025-data-archiving.svg';

/* Static start screen for the web/embed build — the kiosk splash's content
   (eyebrow, headline, intro, CTA, KLAS badge, RLDatix wordmark, version line)
   without any of its kiosk theatre: no particle canvas, no pulse, no radial
   launch wipe, no full-screen tap target. Ported from the Smart Match
   web-from-kiosk conversion.

   Exports the same component name and props as the kiosk variant so the
   build-time selector in SplashScreen.jsx and App.jsx's splash logic work
   unchanged: onStart advances into the calculator, a tap on the RLDatix
   wordmark reveals the (PIN-protected) admin stats overlay. */
export function SplashScreen({ onStart, onAdminReveal }) {
  const handleLogoTap = useCallback((e) => {
    e.stopPropagation();
    if (onAdminReveal) onAdminReveal();
  }, [onAdminReveal]);

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif", background: C.bg, color: C.text,
      width: '100%', minHeight: '100vh',
    }}>
      <div style={{
        maxWidth: 760, margin: '0 auto', textAlign: 'center',
        padding: 'clamp(48px, 9vh, 110px) clamp(16px, 4vw, 44px) clamp(36px, 6vh, 70px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{
          fontSize: F.tiny, fontWeight: 700, letterSpacing: 6, textTransform: 'uppercase',
          color: C.green, marginBottom: 28,
        }}>RLDatix Galen Clinical Archive</div>

        <h1 style={{
          fontSize: 'clamp(1.9rem, 5.2vw, 3rem)', fontWeight: 800, lineHeight: 1.15,
          color: C.text, margin: '0 0 20px', letterSpacing: '-0.5px',
        }}>
          {UKI ? "Migrating to a new EPR?" : "Decommission legacy systems."}
          <br />
          <span style={{ color: C.green }}>{UKI ? "Discover your archiving ROI." : "Discover your ROI."}</span>
        </h1>

        <div style={{ width: 120, height: 5, borderRadius: 3, margin: '0 auto 26px', background: 'linear-gradient(90deg, #1A8A7A, #34DEC2)' }} />

        <p style={{
          fontSize: F.body, color: C.textMid, lineHeight: 1.65, margin: '0 auto 36px', maxWidth: 640,
        }}>
          {UKI ? "See how much your Trust or ICS could save by retiring legacy systems and consolidating clinical data into a single archive." : "See exactly how much your health system could save by retiring legacy applications and consolidating clinical data into a single archive."}
        </p>

        <button onClick={onStart} style={{
          padding: '16px 56px', borderRadius: 999, border: 'none', background: C.accent, color: '#fff',
          fontSize: F.h3, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1,
        }}>Get started →</button>

        <img src={klasBadge} alt="Best in KLAS 2025 - Data Archiving" style={{
          width: 'clamp(110px, 16vw, 150px)', height: 'auto',
          marginTop: 'clamp(36px, 7vh, 64px)',
          filter: 'drop-shadow(0 4px 18px rgba(15,65,70,0.18))',
        }} />

        {/* The logo asset is white; a CSS mask renders it in the brand teal so
            it reads on the light background. role/aria keep it accessible. */}
        <div role="img" aria-label="RLDatix" onClick={handleLogoTap} style={{
          width: 120, height: 24, marginTop: 'clamp(28px, 5vh, 48px)', background: C.accent, opacity: 0.75,
          cursor: 'pointer',
          WebkitMaskImage: `url(${rldatixLogo})`, maskImage: `url(${rldatixLogo})`,
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
          WebkitMaskSize: 'contain', maskSize: 'contain',
          WebkitMaskPosition: 'center', maskPosition: 'center',
        }} />
        <div style={{ fontSize: F.tiny, color: C.textMuted, marginTop: 10 }}>{UKI ? "v1.0 · Updated July 19, 2026" : "v3.2 · Updated July 19, 2026"}</div>
      </div>
    </div>
  );
}

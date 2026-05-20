import React, { useEffect, useRef, useCallback, useState } from 'react';
import { C } from '../theme';
import rldatixLogo from '../assets/rldatix-logo.png';
import klasBadge from '../assets/best-in-klas-2025-data-archiving.svg';

// Timings (ms) for the launch animation. Tune here.
const CONVERGE_MS = 700;       // particles fly toward the button
const WIPE_DELAY_MS = 500;     // radial wipe starts before convergence finishes (overlap)
const WIPE_MS = 700;           // radial wipe duration
// After the wipe peaks (teal core fully visible), a uniform dark overlay fades in
// to neutralise the green so the handoff to the calculator is seamless rather than a
// jarring green-to-navy snap.
const SETTLE_DELAY_MS = 900;   // starts before wipe finishes (overlaps the bright peak)
const SETTLE_MS = 500;         // fade-in duration of the dark overlay
const TOTAL_LAUNCH_MS = SETTLE_DELAY_MS + SETTLE_MS + 50; // 1450ms — 50ms buffer after settle completes

export function SplashScreen({ onStart, onAdminReveal }) {
  // Single tap on the RLDatix logo at the bottom reveals the hidden admin stats overlay.
  // Reset is PIN-protected so accidental discovery doesn't risk losing the stats.
  const handleLogoTap = useCallback((e) => {
    e.stopPropagation();
    if (onAdminReveal) onAdminReveal();
  }, [onAdminReveal]);

  // Launch state lives in BOTH a ref (for the canvas animation loop, which is set up once
  // in useEffect and would otherwise capture stale state) and React state (for the wipe
  // overlay, which is a conditional element). Ref is source of truth for the animation
  // loop; React state mirrors it for render purposes.
  const launchingRef = useRef(false);
  const launchStartRef = useRef(0);
  const buttonTargetRef = useRef({ x: 540, y: 900 }); // canvas-internal coords; updated on click
  const [launching, setLaunching] = useState(false);
  const [wipeOrigin, setWipeOrigin] = useState({ x: 540, y: 900 }); // CSS pixels for overlay positioning

  const canvasRef = useRef(null);
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  const handleStart = useCallback((e) => {
    if (e) e.stopPropagation();
    if (launchingRef.current) return; // prevent double-trigger

    // Capture button position in two coordinate systems:
    // (1) Canvas-internal coords - for particle target
    // (2) CSS pixel coords relative to the container - for the radial wipe overlay
    //
    // In the embed/responsive build the canvas matches its rendered CSS
    // size (with devicePixelRatio applied internally via ctx.setTransform),
    // so converting from page coordinates to canvas coordinates just
    // subtracts the canvas's CSS offset - no width ratio scaling.
    if (buttonRef.current && canvasRef.current && containerRef.current) {
      const bRect = buttonRef.current.getBoundingClientRect();
      const cRect = canvasRef.current.getBoundingClientRect();
      const contRect = containerRef.current.getBoundingClientRect();

      // Button center in CSS pixels
      const btnCssX = bRect.left + bRect.width / 2;
      const btnCssY = bRect.top + bRect.height / 2;

      buttonTargetRef.current = {
        x: btnCssX - cRect.left,
        y: btnCssY - cRect.top,
      };

      // For the overlay: position relative to the container in CSS pixels
      setWipeOrigin({
        x: btnCssX - contRect.left,
        y: btnCssY - contRect.top,
      });
    }

    // Trigger launch
    launchStartRef.current = performance.now();
    launchingRef.current = true;
    setLaunching(true);

    // After full animation, hand off to parent
    setTimeout(() => {
      if (onStart) onStart();
    }, TOTAL_LAUNCH_MS);
  }, [onStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w, h;

    const resize = () => {
      // For the embed/responsive build the canvas matches its actual
      // rendered CSS size rather than a hardcoded 1080×1920. Use
      // devicePixelRatio so animations stay crisp on hi-DPI displays.
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width || 1080;
      h = rect.height || 1920;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const PARTICLE_COUNT = 140;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * (w + 500) - 250,
        y: Math.random() * h,
        r: Math.random() * 3.5 + 0.8,
        baseR: 0, // captured at launch start
        speed: Math.random() * 0.8 + 0.2,
        opacity: Math.random() * 0.2 + 0.03,
        hue: Math.random() * 30 + 165,
        glow: Math.random() > 0.92,
        drift: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        waveAmp: Math.random() * 40 + 10,
        waveSpeed: Math.random() * 0.01 + 0.005,
        // Launch animation fields — captured at launch start
        startX: 0,
        startY: 0,
        captured: false,
      });
    }

    let t = 0;
    const draw = () => {
      t++;
      ctx.clearRect(0, 0, w, h);

      const isLaunching = launchingRef.current;
      const target = buttonTargetRef.current;

      // Compute convergence progress (0 -> 1 over CONVERGE_MS)
      let convergeProgress = 0;
      if (isLaunching) {
        const elapsed = performance.now() - launchStartRef.current;
        convergeProgress = Math.min(1, elapsed / CONVERGE_MS);
        // Ease-in cubic: starts slow, accelerates strongly — like a gravitational pull
        convergeProgress = convergeProgress * convergeProgress * convergeProgress;
      }

      for (const p of particles) {
        if (isLaunching) {
          // On first launch frame for each particle, capture its current visual position
          // (including wave offset) so the animation starts from where it visibly is.
          if (!p.captured) {
            const currentWave = Math.sin(t * p.waveSpeed + p.phase) * p.waveAmp;
            p.startX = p.x;
            p.startY = p.y + currentWave + p.drift * t * 0.1;
            p.baseR = p.r;
            p.captured = true;
          }

          // Interpolate from start position to button target
          const drawX = p.startX + (target.x - p.startX) * convergeProgress;
          const drawY = p.startY + (target.y - p.startY) * convergeProgress;
          // Shrink slightly as they approach (so they don't pile up)
          const r = p.baseR * (1 - convergeProgress * 0.5);
          // Boost opacity as they gather
          const op = p.opacity + convergeProgress * 0.3;

          if (p.glow) {
            const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, r * 10);
            grad.addColorStop(0, `hsla(${p.hue}, 90%, 80%, ${op * 0.3})`);
            grad.addColorStop(1, `hsla(${p.hue}, 90%, 80%, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(drawX, drawY, r * 10, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = `hsla(${p.hue}, 80%, ${p.glow ? 90 : 75}%, ${op})`;
          ctx.beginPath();
          ctx.arc(drawX, drawY, Math.max(0.1, r), 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Normal drift behaviour (unchanged from original)
          p.x += p.speed;
          const wave = Math.sin(t * p.waveSpeed + p.phase) * p.waveAmp;
          const drawY = p.y + wave + p.drift * t * 0.1;

          if (p.x > w + 50) {
            p.x = -50;
            p.y = Math.random() * h;
            p.phase = Math.random() * Math.PI * 2;
          }

          if (p.glow) {
            const grad = ctx.createRadialGradient(p.x, drawY, 0, p.x, drawY, p.r * 8);
            grad.addColorStop(0, `hsla(${p.hue}, 80%, 75%, ${p.opacity * 0.15})`);
            grad.addColorStop(1, `hsla(${p.hue}, 80%, 75%, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, drawY, p.r * 8, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = `hsla(${p.hue}, 70%, ${p.glow ? 90 : 65}%, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, drawY, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div ref={containerRef} style={{
      position: 'relative', zIndex: 100, width: '100%', minHeight: '100vh',
      background: 'linear-gradient(160deg, #060b14 0%, #0a1020 25%, #0c1825 50%, #091520 75%, #060b14 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      overflow: 'hidden', cursor: launching ? 'default' : 'pointer',
    }} onClick={launching ? undefined : handleStart}>

      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse at 30% 50%, rgba(0,212,170,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(0,180,255,0.04) 0%, transparent 50%)',
      }} />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 1000, padding: '75px 80px', marginTop: '14vh',
        // Subtle fade-out of content while the wipe expands, so the title doesn't bleed through
        opacity: launching ? 0.3 : 1,
        transition: 'opacity 600ms ease-out',
      }}>

        <div style={{
          fontSize: 20, fontWeight: 600, letterSpacing: 10, textTransform: 'uppercase',
          color: '#00d4aa', marginBottom: 50, opacity: 0.95,
        }}>RLDatix Galen Clinical Archive</div>

        <h1 style={{
          fontSize: 80, fontWeight: 800, lineHeight: 1.15, color: '#fff',
          margin: '0 0 30px', letterSpacing: '-1.25px',
        }}>
          Decommission legacy systems.
          <br />
          <span style={{ color: '#00d4aa' }}>Discover your ROI.</span>
        </h1>

        <p style={{
          fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,0.78)',
          lineHeight: 1.6, margin: '0 auto 75px', maxWidth: 750,
        }}>
          See exactly how much your health system could save by retiring legacy applications and consolidating clinical data into a single archive.
        </p>

        <button ref={buttonRef} onClick={handleStart} style={{
          display: 'block', margin: '0 auto',
          padding: '30px 90px', borderRadius: 80, border: '3px solid #00d4aa',
          background: 'rgba(0,212,170,0.18)', color: '#fff',
          fontSize: 30, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          letterSpacing: 4,
          textTransform: 'uppercase',
          // During launch, freeze the pulse and brighten/scale to look like the button is
          // absorbing the converging particles.
          boxShadow: launching
            ? '0 0 200px rgba(0,212,170,0.95), inset 0 0 80px rgba(0,212,170,0.4)'
            : '0 0 80px rgba(0,212,170,0.35), inset 0 0 60px rgba(0,212,170,0.08)',
          transform: launching ? 'scale(1.08)' : 'scale(1)',
          transition: 'box-shadow 600ms ease-out, transform 600ms ease-out',
          animation: launching ? 'none' : 'splashPulseBig 2s ease-in-out infinite',
        }}>
          Tap to Start
        </button>

        <style>{`
          @keyframes splashPulseBig {
            0%, 100% { box-shadow: 0 0 80px rgba(0,212,170,0.35), inset 0 0 60px rgba(0,212,170,0.08); transform: scale(1); }
            50% { box-shadow: 0 0 120px rgba(0,212,170,0.55), inset 0 0 80px rgba(0,212,170,0.15); transform: scale(1.02); }
          }
          @keyframes klasBadgeFloat {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50%      { transform: translateX(-50%) translateY(-6px); }
          }
          @keyframes radialWipe {
            0%   { width: 0;       height: 0;       opacity: 1; }
            /* vmax is the larger of viewport width/height, so the wipe always
               reaches the corner regardless of orientation or device size.
               300vmax covers any rectangle since the origin can be anywhere
               from corner to corner (max diagonal ~141vmax, doubled for
               safety on irregular aspect ratios). */
            100% { width: 300vmax; height: 300vmax; opacity: 1; }
          }
          @keyframes radialSettle {
            0%   { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>

      </div>

      {/* Best in KLAS 2025 badge — positioned in the lower third of the splash,
          above the RLDatix logo. Now uses the transparent-corner PNG so the
          circular badge sits cleanly on the dark gradient. Gentle floating
          animation to draw the eye without being noisy. */}
      <img src={klasBadge} alt="Best in KLAS 2025 - Data Archiving" style={{
        position: 'absolute', bottom: 270, left: '50%', transform: 'translateX(-50%)',
        width: 200, height: 'auto', zIndex: 3,
        filter: 'drop-shadow(0 4px 24px rgba(0,212,170,0.25))',
        animation: 'klasBadgeFloat 4s ease-in-out infinite',
        transition: 'opacity 600ms ease-out',
        opacity: launching ? 0.2 : 1,
      }} />

      <img src={rldatixLogo} alt="RLDatix" onClick={handleLogoTap} style={{
        position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
        width: 450, opacity: launching ? 0.15 : 0.5, zIndex: 3, cursor: 'pointer',
        transition: 'opacity 600ms ease-out',
      }} />
      <div style={{
        position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
        fontSize: 14, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, zIndex: 3, whiteSpace: 'nowrap',
        transition: 'opacity 600ms ease-out',
        opacity: launching ? 0.2 : 1,
      }}>v3.0 · Updated May 17, 2026</div>

      {/* Radial wipe overlay — expands from the button position to cover the screen.
          Becomes visible after WIPE_DELAY_MS (overlapping the tail of particle convergence),
          so users see particles arriving AND energy releasing in one continuous motion.
          Final size 4400px covers all corners of 1080×1920 even at maximum offset.
          Outer colour (#0a0f1a) matches the calculator background exactly so there's no
          visible edge-transition when the swap happens. */}
      {launching && (
        <div style={{
          position: 'absolute',
          top: wipeOrigin.y,
          left: wipeOrigin.x,
          width: 0,
          height: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,170,0.95) 0%, rgba(10,40,50,0.95) 55%, #0a0f1a 100%)',
          transform: 'translate(-50%, -50%)',
          animation: `radialWipe ${WIPE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${WIPE_DELAY_MS}ms forwards`,
          zIndex: 50,
          pointerEvents: 'none',
        }} />
      )}

      {/* Settle overlay — a uniform calculator-background-colour layer that fades in
          on top of the wipe. Starts at SETTLE_DELAY_MS (900ms, overlapping the wipe's
          bright peak) and reaches full opacity by 1400ms. By the time onStart fires
          at TOTAL_LAUNCH_MS (1450ms), the whole viewport is solid #0a0f1a — same as
          the calculator's background — so the splash→calculator swap is invisible.
          Without this, the bright teal core of the radial wipe would still be visible
          at handoff and snap abruptly to the calculator's dark navy. */}
      {launching && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: '#0a0f1a',
          opacity: 0,
          animation: `radialSettle ${SETTLE_MS}ms ease-in ${SETTLE_DELAY_MS}ms forwards`,
          zIndex: 51,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

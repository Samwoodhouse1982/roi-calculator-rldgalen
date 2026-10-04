import React from 'react';

// Crash recovery for the unattended touchscreen. Without it, a render error
// leaves a blank screen until someone reloads by hand (the app's own idle
// reset dies with the app). On an error this shows a short notice and reloads
// the page. If the app crashed again soon after the last reload, it waits
// longer before trying again so a persistent fault can't reload in a tight loop.
const CRASH_KEY = 'kiosk-last-crash';
const QUICK_RELOAD_MS = 5000;
const BACKOFF_RELOAD_MS = 60000;
const REPEAT_WINDOW_MS = 60000;

export class KioskErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Kiosk crashed; reloading', error);
    let last = 0;
    try { last = Number(sessionStorage.getItem(CRASH_KEY)) || 0; } catch (e) { /* ignore */ }
    const now = Date.now();
    try { sessionStorage.setItem(CRASH_KEY, String(now)); } catch (e) { /* ignore */ }
    const delay = now - last < REPEAT_WINDOW_MS ? BACKOFF_RELOAD_MS : QUICK_RELOAD_MS;
    this.timer = setTimeout(() => window.location.reload(), delay);
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ width: 1080, height: 1920, background: '#0a0f1a', color: '#e8edf5', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 80, boxSizing: 'border-box' }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#00d4aa', marginBottom: 20 }}>Restarting the calculator</div>
        <div style={{ fontSize: 22, color: '#a0b0c0', lineHeight: 1.6 }}>Something went wrong. The calculator will be back in a moment.</div>
      </div>
    );
  }
}

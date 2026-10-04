import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UKI_KIOSK } from './market';
import { KioskErrorBoundary } from './components/KioskErrorBoundary';
import { applyKioskFit, applyKioskTouch } from './kioskFit';

// UKI touchscreen: fill the physical screen whatever its resolution or
// Windows display scaling, and turn off document-style touch gestures
// (see kioskFit.js).
if (UKI_KIOSK) { applyKioskFit(); applyKioskTouch(); }

// The WordPress inline fragment mounts to #galen-roi-root (a unique id that
// can't collide with host-page themes); the standalone builds keep #root.
// UKI touchscreen: an unattended kiosk must recover from a crash on its own,
// so the app is wrapped in a boundary that shows a notice and reloads.
ReactDOM.createRoot(document.getElementById('galen-roi-root') || document.getElementById('root')).render(
  UKI_KIOSK ? <KioskErrorBoundary><App /></KioskErrorBoundary> : <App />
);

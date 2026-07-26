import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// The WordPress inline fragment mounts to #galen-roi-root (a unique id that
// can't collide with host-page themes); the standalone builds keep #root.
ReactDOM.createRoot(document.getElementById('galen-roi-root') || document.getElementById('root')).render(<App />);

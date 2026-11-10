import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App.tsx';
import { model } from './model.ts';

void model.boot();
setInterval(() => { void model.tick(); }, 15_000);
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

// The service worker caches the app shell and bundled content for offline use. It is registered only in
// production builds so development always serves fresh code.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => { /* the app still works online */ }); });
}

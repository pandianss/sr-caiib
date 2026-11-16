import { Capacitor } from '@capacitor/core';

/** True inside the Android (Google Play) app shell. */
export const IS_NATIVE: boolean = (() => { try { return Capacitor.isNativePlatform(); } catch { return false; } })();

/**
 * The first Google Play release is free-only. Paid access must use Google Play Billing, which is not built yet,
 * so purchase, restore and sign-in screens are hidden in the native app and content outside the free units is
 * described as "not in this version" rather than "part of the pass".
 */
export const PURCHASES_VISIBLE: boolean = !IS_NATIVE;

/**
 * Capacitor 8 has no default Back handling, so without this Back closes the app from every screen.
 * An open dialog closes first, then Back walks the in-app history, and only the first screen exits.
 */
export function installNativeBack(): void {
  if (!IS_NATIVE) return;
  void import('@capacitor/app').then(({ App }) => {
    void App.addListener('backButton', ({ canGoBack }) => {
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return; }
      if (canGoBack) window.history.back(); else void App.exitApp();
    });
  }).catch(() => { /* Back falls back to the system default */ });
}

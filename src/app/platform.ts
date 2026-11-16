import { Capacitor } from '@capacitor/core';

/** True inside the Android (Google Play) app shell. */
export const IS_NATIVE: boolean = (() => { try { return Capacitor.isNativePlatform(); } catch { return false; } })();

/**
 * The first Google Play release is free-only. Paid access must use Google Play Billing, which is not built yet,
 * so purchase, restore and sign-in screens are hidden in the native app and content outside the free units is
 * described as "not in this version" rather than "part of the pass".
 */
export const PURCHASES_VISIBLE: boolean = !IS_NATIVE;

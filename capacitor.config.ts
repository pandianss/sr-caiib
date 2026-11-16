import type { CapacitorConfig } from '@capacitor/cli';

// Permanent Play application id (chosen by the owner, 16 Nov 2026). It cannot be changed after publishing.
const config: CapacitorConfig = {
  appId: 'in.superrecall.caiib',
  appName: 'CAIIB Study',
  webDir: 'dist',
  android: { allowMixedContent: false },
};
export default config;

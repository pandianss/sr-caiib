import type { CapacitorConfig } from '@capacitor/cli';

// PLACEHOLDER application id: replace with the permanent Play package name before the first upload.
// It cannot be changed after the app is published on Google Play.
const config: CapacitorConfig = {
  appId: 'app.caiibstudy.learn',
  appName: 'CAIIB Study',
  webDir: 'dist',
  android: { allowMixedContent: false },
};
export default config;

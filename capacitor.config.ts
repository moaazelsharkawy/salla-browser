import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.salla.browser',
  appName: 'Salla Browser',
  webDir: 'dist',
  server: { androidScheme: 'https' }
};

export default config;

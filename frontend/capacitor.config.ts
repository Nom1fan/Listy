import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.listyyy.app',
  appName: 'Listyyy',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.listy.app',
  appName: 'Listy',
  webDir: 'dist',
  server: {
    // For production, set androidScheme and optionally url to your API
    // androidScheme: 'https',
    // url: 'https://your-ec2-domain.com',
  },
};

export default config;

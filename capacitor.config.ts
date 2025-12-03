import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medicabinet.pro',
  appName: 'Medicabinet Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      releaseType: 'APK'
    }
  }
};

export default config;

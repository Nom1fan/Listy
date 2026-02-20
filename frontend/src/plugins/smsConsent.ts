import { Capacitor, registerPlugin } from '@capacitor/core';

interface SmsConsentPlugin {
  startListening(): Promise<{ code: string }>;
  stopListening(): Promise<void>;
}

const SmsConsent = registerPlugin<SmsConsentPlugin>('SmsConsent');

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export default SmsConsent;

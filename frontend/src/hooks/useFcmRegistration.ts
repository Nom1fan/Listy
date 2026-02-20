import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../store/authStore';
import { registerFcmToken } from '../api/fcm';

export function useFcmRegistration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    type PNModule = typeof import('@capacitor/push-notifications');
    let pnModule: Awaited<PNModule> | null = null;

    import('@capacitor/push-notifications')
      .then((mod) => {
        if (cancelled) return;
        pnModule = mod;
        const { PushNotifications } = mod;

        PushNotifications.addListener('registration', (token) => {
          if (!cancelled) registerFcmToken(token.value).catch(() => {});
        });

        PushNotifications.requestPermissions()
          .then((result) => {
            if (cancelled || result.receive !== 'granted') return;
            PushNotifications.register();
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      pnModule?.PushNotifications.removeAllListeners();
    };
  }, [isAuthenticated]);
}

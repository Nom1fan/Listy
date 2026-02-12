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
    let removeListeners: (() => void) | null = null;

    import('@capacitor/push-notifications')
      .then(({ PushNotifications }) => {
        if (cancelled) return;
        PushNotifications.requestPermissions()
          .then((result) => {
            if (result.receive !== 'granted') return;
            PushNotifications.register();
          })
          .catch(() => {});

        const registrationHandler = (token: { value: string }) => {
          registerFcmToken(token.value).catch(() => {});
        };

        PushNotifications.addListener('registration', registrationHandler);
        removeListeners = () => PushNotifications.removeAllListeners();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      removeListeners?.();
    };
  }, [isAuthenticated]);
}

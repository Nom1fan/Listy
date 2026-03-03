import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { registerFcmToken } from '../api/fcm';

export function useFcmRegistration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    type PNModule = typeof import('@capacitor/push-notifications');
    let pnModule: Awaited<PNModule> | null = null;

    import('@capacitor/core')
      .then(({ Capacitor }) => {
        if (cancelled || !Capacitor.isNativePlatform()) return;
        return import('@capacitor/push-notifications');
      })
      .then((mod) => {
        if (cancelled || !mod) return;
        pnModule = mod;
        const { PushNotifications } = mod;

        PushNotifications.addListener('registration', (token) => {
          if (!cancelled) registerFcmToken(token.value).catch(() => {});
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action: { notification: { data?: Record<string, string> } }) => {
          if (cancelled) return;
          const data = action.notification?.data;
          const workspaceId = data?.workspaceId;
          const type = data?.type;
          if (workspaceId && (type === 'workspace_invitation' || type === 'invitation_accepted')) {
            navigate(`/workspaces/${workspaceId}/share`);
          }
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
  }, [isAuthenticated, navigate]);
}

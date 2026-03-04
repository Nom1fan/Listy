import { useEffect, useRef } from 'react';
import { getWsUrlWithToken } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { UserEvent } from '../types';

function getTokenForWs(): string | null {
  return useAuthStore.getState().token ?? localStorage.getItem('listyyy_token');
}

/**
 * Subscribe to user-level WebSocket events (new invitation, removed from workspace).
 * Only connects when userId is present (authenticated). Invoke onEvent to invalidate queries / navigate.
 * SockJS and STOMP are lazy-loaded so they never run on initial app load (avoids main-thread freeze).
 */
export function useUserEvents(userId: string | null | undefined, onEvent: (event: UserEvent) => void) {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('listyyy_token');
  const clientRef = useRef<{ deactivate: () => void } | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const effectiveToken = token ?? getTokenForWs();
    if (!userId || !effectiveToken) return;

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      const wsUrl = getWsUrlWithToken(effectiveToken);
      void Promise.all([
        import('sockjs-client'),
        import('@stomp/stompjs'),
      ]).then(([SockJSModule, stompModule]) => {
        if (cancelled) return;
        const SockJS = SockJSModule.default;
        const { Client } = stompModule;
        const sock = new SockJS(wsUrl);
        const client = new Client({
          webSocketFactory: () => sock as unknown as WebSocket,
          connectHeaders: { Authorization: `Bearer ${effectiveToken}` },
          reconnectDelay: 3000,
          onConnect: () => {
            if (cancelled) return;
            client.subscribe(`/topic/user/${userId}`, (msg) => {
              try {
                const event = JSON.parse(msg.body) as UserEvent;
                onEventRef.current?.(event);
              } catch {
                // ignore
              }
            });
          },
        });
        client.activate();
        clientRef.current = client;
      }).catch(() => {});
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      const client = clientRef.current;
      if (client) {
        client.deactivate();
        clientRef.current = null;
      }
    };
  }, [userId, token]);
}

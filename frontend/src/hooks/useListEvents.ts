import { useEffect, useRef } from 'react';
import { getWsUrlWithToken } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { ListEvent } from '../types';

/** Get token from store or localStorage (fallback for post-login race) */
function getTokenForWs(): string | null {
  return useAuthStore.getState().token ?? localStorage.getItem('listyyy_token');
}

export function useListEvents(
  listId: string | null,
  onEvent: (event: ListEvent) => void
) {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('listyyy_token');
  const clientRef = useRef<{ deactivate: () => void } | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const effectiveToken = token ?? getTokenForWs();
    if (!listId || !effectiveToken) return;

    let cancelled = false;
    const wsUrl = getWsUrlWithToken(effectiveToken);
    void Promise.all([import('sockjs-client'), import('@stomp/stompjs')])
      .then(([SockJSModule, stompModule]) => {
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
            client.subscribe(`/topic/lists/${listId}`, (msg) => {
              try {
                const event = JSON.parse(msg.body) as ListEvent;
                onEventRef.current(event);
              } catch {
                // ignore
              }
            });
          },
        });
        client.activate();
        clientRef.current = client;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      const c = clientRef.current;
      if (c) {
        c.deactivate();
        clientRef.current = null;
      }
    };
  }, [listId, token]);
}

import { useEffect, useRef } from 'react';
import { getWsUrlWithToken } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { WorkspaceEvent } from '../types';

/** Get token from store or localStorage (fallback for post-login race) */
function getTokenForWs(): string | null {
  return useAuthStore.getState().token ?? localStorage.getItem('listyyy_token');
}

/**
 * Subscribe to workspace-level WebSocket events (category/product/list/workspace changes).
 * On each event the callback is invoked so the consumer can invalidate queries / show toasts.
 * SockJS and STOMP are lazy-loaded so they are not in the App chunk (avoids main-thread freeze on load).
 */
export function useWorkspaceEvents(
  workspaceId: string | null,
  onEvent: (event: WorkspaceEvent) => void
) {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('listyyy_token');
  const clientRef = useRef<{ deactivate: () => void } | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const effectiveToken = token ?? getTokenForWs();
    if (!workspaceId || !effectiveToken) return;

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
            client.subscribe(`/topic/workspaces/${workspaceId}`, (msg) => {
              try {
                const event = JSON.parse(msg.body) as WorkspaceEvent;
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
  }, [workspaceId, token]);
}

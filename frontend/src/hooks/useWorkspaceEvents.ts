import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
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
 */
export function useWorkspaceEvents(
  workspaceId: string | null,
  onEvent: (event: WorkspaceEvent) => void
) {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('listyyy_token');
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const effectiveToken = token ?? getTokenForWs();
    if (!workspaceId || !effectiveToken) return;

    const wsUrl = getWsUrlWithToken(effectiveToken);
    const sock = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => sock as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${effectiveToken}` },
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/workspaces/${workspaceId}`, (msg) => {
          try {
            const event = JSON.parse(msg.body) as WorkspaceEvent;
            onEvent(event);
          } catch {
            // ignore
          }
        });
      },
    });
    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [workspaceId, token, onEvent]);
}

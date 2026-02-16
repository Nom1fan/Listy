import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getWsUrl } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { WorkspaceEvent } from '../types';

/**
 * Subscribe to workspace-level WebSocket events (category/product/list/workspace changes).
 * On each event the callback is invoked so the consumer can invalidate queries / show toasts.
 */
export function useWorkspaceEvents(
  workspaceId: string | null,
  onEvent: (event: WorkspaceEvent) => void
) {
  const token = useAuthStore((s) => s.token);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!workspaceId || !token) return;

    const wsUrl = getWsUrl();
    const sock = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => sock as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
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

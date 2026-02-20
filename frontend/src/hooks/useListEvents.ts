import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getWsUrl } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { ListEvent } from '../types';

export function useListEvents(
  listId: string | null,
  onEvent: (event: ListEvent) => void
) {
  const token = useAuthStore((s) => s.token);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!listId || !token) return;

    const wsUrl = getWsUrl();
    const sock = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => sock as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/lists/${listId}`, (msg) => {
          try {
            const event = JSON.parse(msg.body) as ListEvent;
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
  }, [listId, token, onEvent]);
}

import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getWsUrlWithToken } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { UserEvent } from '../types';

function getTokenForWs(): string | null {
  return useAuthStore.getState().token ?? localStorage.getItem('listyyy_token');
}

/**
 * Subscribe to user-level WebSocket events (new invitation, removed from workspace).
 * Only connects when userId is present (authenticated). Invoke onEvent to invalidate queries / navigate.
 */
export function useUserEvents(userId: string | null | undefined, onEvent: (event: UserEvent) => void) {
  const token = useAuthStore((s) => s.token) ?? localStorage.getItem('listyyy_token');
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const effectiveToken = token ?? getTokenForWs();
    if (!userId || !effectiveToken) return;

    const wsUrl = getWsUrlWithToken(effectiveToken);
    const sock = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => sock as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${effectiveToken}` },
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/user/${userId}`, (msg) => {
          try {
            const event = JSON.parse(msg.body) as UserEvent;
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
  }, [userId, token, onEvent]);
}

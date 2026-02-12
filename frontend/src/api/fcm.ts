import { api } from './client';

export async function registerFcmToken(token: string, deviceId?: string): Promise<void> {
  return api<void>('/api/fcm/register', {
    method: 'POST',
    body: JSON.stringify({ token, deviceId }),
  });
}

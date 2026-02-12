import { api } from './client';
import type { AuthResponse } from '../types';

export async function register(email: string, password: string, displayName?: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function requestPhoneOtp(phone: string): Promise<void> {
  return api<void>('/api/auth/phone/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyPhoneOtp(phone: string, code: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/phone/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

export async function updateProfile(displayName: string | null): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ displayName: displayName || null }),
  });
}

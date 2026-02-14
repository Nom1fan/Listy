import { api } from './client';
import type { AuthResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

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

export async function verifyPhoneOtp(phone: string, code: string, displayName: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/phone/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code, displayName }),
  });
}

export async function requestEmailOtp(email: string): Promise<void> {
  return api<void>('/api/auth/email/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmailOtp(email: string, code: string, displayName: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/email/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code, displayName }),
  });
}

export async function updateProfile(body: {
  displayName?: string | null;
  profileImageUrl?: string | null;
}): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Call the backend logout endpoint to revoke the refresh token cookie.
 */
export async function serverLogout(): Promise<void> {
  try {
    await fetch(API_BASE + '/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // best-effort — clear local state regardless
  }
}

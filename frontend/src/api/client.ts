const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Custom error class that carries the HTTP status code.
 * Use `isConflict()` to check for optimistic-locking conflicts (409).
 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
  isConflict(): boolean {
    return this.status === 409;
  }
}

function getToken(): string | null {
  return localStorage.getItem('listyyy_token');
}

// ---- silent token refresh logic ----

const REFRESH_TIMEOUT_MS = 15_000;

type RefreshResult = 'ok' | 'invalid' | 'network_error';

let refreshPromise: Promise<RefreshResult> | null = null;

/**
 * Attempt to get a new access token using the HttpOnly refresh cookie.
 * - 'ok': token refreshed; caller can retry the request.
 * - 'invalid': server returned 401 (cookie missing/expired); caller should log out.
 * - 'network_error': request failed or timed out; do NOT log out — user stays logged in.
 */
async function tryRefreshToken(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async (): Promise<RefreshResult> => {
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), REFRESH_TIMEOUT_MS);
    try {
      const res = await fetch(API_BASE + '/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        signal: ac.signal,
      });
      if (!res.ok) {
        // 401/403 = refresh token invalid or expired — session is done
        if (res.status === 401 || res.status === 403) return 'invalid';
        return 'network_error';
      }
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('listyyy_token', data.token);
        try {
          const raw = localStorage.getItem('listyyy-auth');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.state) {
              parsed.state.token = data.token;
              parsed.state.user = {
                userId: data.userId,
                email: data.email,
                phone: data.phone,
                displayName: data.displayName,
                profileImageUrl: data.profileImageUrl,
                locale: data.locale,
              };
              localStorage.setItem('listyyy-auth', JSON.stringify(parsed));
            }
          }
        } catch {
          // best-effort sync
        }
        return 'ok';
      }
      return 'invalid';
    } catch {
      // Network error, timeout (AbortError), or other failure — do not treat as logout
      return 'network_error';
    } finally {
      clearTimeout(timeoutId);
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function handleAuthFailure(): never {
  localStorage.removeItem('listyyy_token');
  localStorage.removeItem('listyyy-auth');
  window.dispatchEvent(new CustomEvent('listyyy:auth-failure'));
  throw new Error('פג תוקף החיבור');
}

// ---- core fetch with auto-refresh ----

async function fetchWithAuth(url: string, options: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('אין חיבור לשרת. נסה שוב מאוחר יותר.');
  }
  if ((res.status === 401 || res.status === 403) && getToken()) {
    const result = await tryRefreshToken();
    if (result === 'ok') {
      const newToken = getToken();
      const retryHeaders = new Headers(options.headers);
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
      return fetch(url, { ...options, headers: retryHeaders });
    }
    if (result === 'invalid') {
      handleAuthFailure();
    }
    // result === 'network_error': do NOT log out — throw so UI shows connection error
    throw new Error('אין חיבור לשרת. נסה שוב מאוחר יותר.');
  }
  return res;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetchWithAuth(API_BASE + path, { ...options, headers, credentials: 'include' });
  } catch (e) {
    if (e instanceof Error && e.message === 'פג תוקף החיבור') throw e;
    throw new Error('אין חיבור לשרת. נסה שוב מאוחר יותר.');
  }
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text);
      if (j.message) msg = j.message;
    } catch {
      // use text as is
    }
    const error = new ApiError(msg || `HTTP ${res.status}`, res.status);
    throw error;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Upload a file via multipart/form-data. Returns the JSON body (e.g. { url }). */
export async function uploadFile<T = { url: string }>(path: string, file: File): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const form = new FormData();
  form.append('file', file);
  let res: Response;
  try {
    res = await fetchWithAuth(API_BASE + path, { method: 'POST', headers, body: form, credentials: 'include' });
  } catch (e) {
    throw e instanceof Error && e.message.includes('חיבור') ? e : new Error('אין חיבור לשרת. נסה שוב מאוחר יותר.');
  }
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text);
      if (j.message) msg = j.message;
    } catch {
      // ignore
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Returns the WebSocket/SockJS endpoint as HTTP(S) URL. SockJS requires http/https, not ws/wss. */
export function getWsUrl(): string {
  const base = import.meta.env.VITE_WS_BASE || '';
  const proto = window.location.protocol; // http: or https: — SockJS expects this
  const host = base ? new URL(base).host : window.location.host;
  const path = base ? new URL(base).pathname.replace(/\/$/, '') : '';
  return `${proto}//${host}${path}/ws`;
}

/** Returns WebSocket URL with token as query param (fallback when CONNECT headers fail in some transports). */
export function getWsUrlWithToken(token: string): string {
  const base = getWsUrl();
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}access_token=${encodeURIComponent(token)}`;
}

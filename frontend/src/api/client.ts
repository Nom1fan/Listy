const API_BASE = import.meta.env.VITE_API_BASE || '';

function getToken(): string | null {
  return localStorage.getItem('listyyy_token');
}

// ---- silent token refresh logic ----

let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to get a new access token using the HttpOnly refresh cookie.
 * Returns true if the token was refreshed successfully.
 */
async function tryRefreshToken(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(API_BASE + '/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // send the HttpOnly cookie
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('listyyy_token', data.token);
        // Also update the Zustand persisted store so it stays in sync
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
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function handleAuthFailure(): never {
  localStorage.removeItem('listyyy_token');
  localStorage.removeItem('listyyy-auth');
  window.location.href = '/login';
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
    // Access token expired or rejected — try silent refresh
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the original request with the new token
      const newToken = getToken();
      const retryHeaders = new Headers(options.headers);
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
      return fetch(url, { ...options, headers: retryHeaders });
    }
    handleAuthFailure();
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
  } catch {
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
    throw new Error(msg || `HTTP ${res.status}`);
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

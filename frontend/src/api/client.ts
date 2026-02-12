const API_BASE = import.meta.env.VITE_API_BASE || '';

function getToken(): string | null {
  return localStorage.getItem('listy_token');
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
  const res = await fetch(API_BASE + path, { ...options, headers });
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
  const res = await fetch(API_BASE + path, { method: 'POST', headers, body: form });
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

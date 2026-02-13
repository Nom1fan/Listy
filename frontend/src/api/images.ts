const API_BASE = import.meta.env.VITE_API_BASE || '';

export interface ImageSearchResult {
  url: string;
  thumbUrl: string;
}

export interface ImageSearchResponse {
  results: ImageSearchResult[];
  error?: string | null;
}

export async function searchImages(query: string, perPage = 12): Promise<ImageSearchResult[]> {
  const token = localStorage.getItem('listyyy_token');
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const q = encodeURIComponent(query.trim());
  const res = await fetch(
    `${API_BASE}/api/images/search?q=${q}&per_page=${perPage}`,
    { headers }
  );
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
  const data: ImageSearchResponse = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.results ?? [];
}

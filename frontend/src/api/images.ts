const API_BASE = import.meta.env.VITE_API_BASE || '';

export interface ImageSearchResult {
  url: string;
  thumbUrl: string;
}

export interface ImageSearchResponse {
  results: ImageSearchResult[];
  error?: string | null;
}

export type ImageSource = 'giphy' | 'pixabay';

export async function searchImages(query: string, perPage = 12, source: ImageSource = 'giphy'): Promise<ImageSearchResult[]> {
  const token = localStorage.getItem('listyyy_token');
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const q = encodeURIComponent(query.trim());
  const res = await fetch(
    `${API_BASE}/api/images/search?q=${q}&per_page=${perPage}&source=${source}`,
    { headers }
  );
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('יש להתחבר מחדש כדי לחפש תמונות');
    }
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text);
      if (j.message) msg = j.message;
    } catch {
      // ignore
    }
    throw new Error(msg || `שגיאת שרת (${res.status})`);
  }
  const data: ImageSearchResponse = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.results ?? [];
}

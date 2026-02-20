import { useState } from 'react';
import { searchImages, type ImageSearchResult, type ImageSource } from '../api/images';

type Props = {
  onSelect: (url: string) => void;
  placeholder?: string;
  initialQuery?: string;
};

export function ImageSearchPicker({ onSelect, placeholder = 'חיפוש תמונות...', initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [source, setSource] = useState<ImageSource>('giphy');
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  async function runSearch(overrideSource?: ImageSource) {
    const q = query.trim();
    if (!q) return;
    const src = overrideSource ?? source;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const list = await searchImages(q, 12, src);
      setResults(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'חיפוש נכשל');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function switchSource(newSource: ImageSource) {
    if (newSource === source) return;
    setSource(newSource);
    setResults([]);
    setError(null);
    setSearched(false);
    setSelectedUrl(null);
    // Auto-search if there's a query
    if (query.trim()) {
      runSearch(newSource);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Source toggle */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #ccc' }}>
        <button
          type="button"
          onClick={() => switchSource('giphy')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            background: source === 'giphy' ? 'var(--color-primary)' : '#f5f5f5',
            color: source === 'giphy' ? '#fff' : '#333',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          סטיקרים
        </button>
        <button
          type="button"
          onClick={() => switchSource('pixabay')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            borderRight: '1px solid #ccc',
            background: source === 'pixabay' ? 'var(--color-primary)' : '#f5f5f5',
            color: source === 'pixabay' ? '#fff' : '#333',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          תמונות
        </button>
      </div>

      {/* Search input + button */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } }}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button
          type="button"
          onClick={() => runSearch()}
          disabled={loading || !query.trim()}
          style={{
            padding: '10px 16px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'מחפש...' : 'חפש'}
        </button>
      </div>
      {error && (
        <p style={{ margin: 0, fontSize: 13, color: '#c00' }} role="alert">
          {error}
        </p>
      )}
      {searched && !loading && results.length === 0 && !error && (
        <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
          לא נמצאו תמונות. נסה מילות חיפוש אחרות.
        </p>
      )}
      {results.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: 8,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {results.map((r, i) => {
            const isSelected = selectedUrl === r.url;
            return (
              <button
                key={i}
                type="button"
                onClick={() => { setSelectedUrl(r.url); onSelect(r.url); }}
                style={{
                  padding: 0,
                  position: 'relative',
                  border: isSelected ? '2.5px solid #2e7d32' : '2px solid #ddd',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#f5f5f5',
                  cursor: 'pointer',
                  aspectRatio: '1',
                  boxShadow: isSelected ? '0 0 0 2px rgba(46,125,50,0.25)' : 'none',
                  transition: 'border 0.15s, box-shadow 0.15s',
                }}
              >
                <img
                  src={r.thumbUrl}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    opacity: isSelected ? 0.85 : 1,
                    transition: 'opacity 0.15s',
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#2e7d32',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

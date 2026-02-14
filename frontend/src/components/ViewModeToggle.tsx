import { useState, useCallback } from 'react';

export type ViewMode = 'list' | 'grid';

const STORAGE_KEY = 'listyyy-view-mode';

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'list' || stored === 'grid') return stored;
    } catch { /* ignore */ }
    return 'list';
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
  }, []);

  return [viewMode, setViewMode];
}

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #ccc' }}>
      <button
        type="button"
        onClick={() => onChange('list')}
        title="תצוגת רשימה"
        style={{
          padding: '6px 10px',
          background: viewMode === 'list' ? 'var(--color-primary)' : '#fff',
          color: viewMode === 'list' ? '#fff' : '#666',
          border: 'none',
          borderRadius: 0,
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="תצוגת רשימה"
        aria-pressed={viewMode === 'list'}
      >
        ☰
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        title="תצוגת כרטיסיות"
        style={{
          padding: '6px 10px',
          background: viewMode === 'grid' ? 'var(--color-primary)' : '#fff',
          color: viewMode === 'grid' ? '#fff' : '#666',
          border: 'none',
          borderLeft: '1px solid #ccc',
          borderRadius: 0,
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="תצוגת כרטיסיות"
        aria-pressed={viewMode === 'grid'}
      >
        ▦
      </button>
    </div>
  );
}

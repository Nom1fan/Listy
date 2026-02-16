import { useState, useCallback } from 'react';

export type ViewMode = 'list' | 'grid' | 'compact';

const STORAGE_PREFIX = 'listyyy-view-mode';

export function useViewMode(key: string): [ViewMode, (mode: ViewMode) => void] {
  const storageKey = `${STORAGE_PREFIX}:${key}`;

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'list' || stored === 'grid' || stored === 'compact') return stored;
    } catch { /* ignore */ }
    return 'list';
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try { localStorage.setItem(storageKey, mode); } catch { /* ignore */ }
  }, [storageKey]);

  return [viewMode, setViewMode];
}

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

function ToggleButton({ active, onClick, title, ariaLabel, children, borderLeft }: {
  active: boolean;
  onClick: () => void;
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
  borderLeft?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: '6px 10px',
        background: active ? 'var(--color-primary)' : '#fff',
        color: active ? '#fff' : '#666',
        border: 'none',
        borderLeft: borderLeft ? '1px solid #ccc' : 'none',
        borderRadius: 0,
        cursor: 'pointer',
        fontSize: 16,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
      }}
      aria-label={ariaLabel}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #ccc' }}>
      <ToggleButton active={viewMode === 'list'} onClick={() => onChange('list')} title="תצוגת רשימה" ariaLabel="תצוגת רשימה">
        ☰
      </ToggleButton>
      <ToggleButton active={viewMode === 'compact'} onClick={() => onChange('compact')} title="תצוגה מצומצמת" ariaLabel="תצוגה מצומצמת" borderLeft>
        ≡
      </ToggleButton>
      <ToggleButton active={viewMode === 'grid'} onClick={() => onChange('grid')} title="תצוגת כרטיסיות" ariaLabel="תצוגת כרטיסיות" borderLeft>
        ▦
      </ToggleButton>
    </div>
  );
}

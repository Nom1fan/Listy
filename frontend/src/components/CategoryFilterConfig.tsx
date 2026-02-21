import type { CategoryDto, CategoryFilterMode } from '../types';

interface CategoryFilterConfigProps {
  mode: CategoryFilterMode;
  selectedIds: string[];
  categories: CategoryDto[];
  onModeChange: (mode: CategoryFilterMode) => void;
  onSelectedIdsChange: (ids: string[]) => void;
}

const modeOptions: { value: CategoryFilterMode; label: string }[] = [
  { value: 'NONE', label: 'הכל' },
  { value: 'INCLUDE', label: 'רק' },
  { value: 'EXCLUDE', label: 'הכל חוץ מ' },
];

export function CategoryFilterConfig({
  mode,
  selectedIds,
  categories,
  onModeChange,
  onSelectedIdsChange,
}: CategoryFilterConfigProps) {
  const toggleCategory = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectedIdsChange([...selectedIds, id]);
    }
  };

  return (
    <div style={{ marginTop: 4 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>סינון קטגוריות</label>
      <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #ccc', marginBottom: 8 }}>
        {modeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onModeChange(opt.value);
              if (opt.value === 'NONE') onSelectedIdsChange([]);
            }}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              background: mode === opt.value ? 'var(--color-primary)' : '#f5f5f5',
              color: mode === opt.value ? '#fff' : '#333',
              fontWeight: mode === opt.value ? 700 : 400,
              cursor: 'pointer',
              fontSize: 13,
              transition: 'background 0.15s, color 0.15s',
            }}
            aria-pressed={mode === opt.value}
            data-testid={`filter-mode-${opt.value}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {mode !== 'NONE' && categories.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 180,
            overflowY: 'auto',
            padding: '4px 0',
          }}
          data-testid="category-checkboxes"
        >
          {categories.map((cat) => (
            <label
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                background: selectedIds.includes(cat.id) ? '#e8f5e9' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span style={{ fontSize: 14 }}>{cat.nameHe}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

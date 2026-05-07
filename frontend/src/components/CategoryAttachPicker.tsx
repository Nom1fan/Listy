import type { CategoryDto } from '../types';

interface CategoryAttachPickerProps {
  selectedIds: string[];
  categories: CategoryDto[];
  onSelectedIdsChange: (ids: string[]) => void;
  /** Override the default heading. Pass an empty string to hide. */
  label?: string;
}

/**
 * Multi-select picker for attaching workspace categories to a list. Drives
 * search auto-completion and the "add from categories" button on the list page.
 */
export function CategoryAttachPicker({
  selectedIds,
  categories,
  onSelectedIdsChange,
  label = 'קטגוריות מצורפות',
}: CategoryAttachPickerProps) {
  const toggleCategory = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectedIdsChange([...selectedIds, id]);
    }
  };

  const allSelected = categories.length > 0 && selectedIds.length === categories.length;
  const toggleAll = () => {
    if (allSelected) {
      onSelectedIdsChange([]);
    } else {
      onSelectedIdsChange(categories.map((c) => c.id));
    }
  };

  return (
    <div style={{ marginTop: 4 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontWeight: 600 }}>{label}</label>
          {categories.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              data-testid="category-attach-toggle-all"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {allSelected ? 'נקה הכל' : 'בחר הכל'}
            </button>
          )}
        </div>
      )}
      {categories.length === 0 ? (
        <p style={{ fontSize: 13, color: '#999', margin: 0 }}>אין קטגוריות במרחב העבודה הזה.</p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 240,
            overflowY: 'auto',
            padding: '4px 0',
          }}
          data-testid="category-attach-checkboxes"
        >
          {categories.map((cat) => (
            <label
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
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

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { EMOJI_CATEGORIES, LEGACY_ICON_MAP } from './emojiData';
import type { EmojiPickerItem } from './emojiData';
import { ASSET_ICON_MAP, isAssetIconId } from './iconAssets';

/* ------------------------------------------------------------------ */
/*  EmojiPickerDialog – WhatsApp-style picker with categories & search */
/* ------------------------------------------------------------------ */

export interface EmojiPickerDialogProps {
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPickerDialog({ selectedEmoji, onSelect, onClose }: EmojiPickerDialogProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].id);
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Auto-focus search input on open
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  // Filter emojis based on search query
  const filteredEmojis = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null; // null means "show by category"
    const results: EmojiPickerItem[] = [];
    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.emojis) {
        const keywords = item.keywords ?? [];
        const display = 'emoji' in item ? item.emoji : `asset:${item.assetId}`;
        if (
          display.includes(q) ||
          keywords.some((kw) => kw.includes(q))
        ) {
          results.push(item);
        }
      }
    }
    return results;
  }, [search]);

  const isSearching = filteredEmojis !== null;

  // When switching category, scroll grid to top
  function handleCategoryClick(catId: string) {
    setActiveCategory(catId);
    setSearch('');
    gridRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Resolve the display emoji for the selected value (handles legacy IDs)
  const resolvedSelected = selectedEmoji
    ? LEGACY_ICON_MAP[selectedEmoji] ?? selectedEmoji
    : '';

  function handleSelect(value: string) {
    onSelect(value);
    onClose();
  }

  const activeCategoryData = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 400,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px 8px',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 16 }}>בחירת אימוג׳י</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: '#666',
              padding: '0 4px',
              lineHeight: 1,
            }}
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f5f5f5',
              borderRadius: 10,
              padding: '8px 12px',
            }}
          >
            <span style={{ fontSize: 16, color: '#999', flexShrink: 0 }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש אימוג׳י..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 15,
                padding: 0,
                direction: 'rtl',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  fontSize: 14,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        {!isSearching && (
          <div
            style={{
              display: 'flex',
              gap: 2,
              padding: '0 12px 8px',
              overflowX: 'auto',
              flexShrink: 0,
            }}
          >
            {EMOJI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                title={cat.label}
                style={{
                  flex: '0 0 auto',
                  padding: '6px 10px',
                  background:
                    activeCategory === cat.id ? 'var(--color-primary, #4CAF50)' : '#f0f0f0',
                  color: activeCategory === cat.id ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  transition: 'background 0.15s',
                }}
              >
                {cat.icon}
              </button>
            ))}
          </div>
        )}

        {/* Category label */}
        {!isSearching && activeCategoryData && (
          <div
            style={{
              padding: '0 16px 6px',
              fontSize: 13,
              fontWeight: 600,
              color: '#888',
            }}
          >
            {activeCategoryData.label}
          </div>
        )}

        {/* Search results label */}
        {isSearching && (
          <div
            style={{
              padding: '0 16px 6px',
              fontSize: 13,
              fontWeight: 600,
              color: '#888',
            }}
          >
            {filteredEmojis.length > 0
              ? `${filteredEmojis.length} תוצאות`
              : 'לא נמצאו תוצאות'}
          </div>
        )}

        {/* Emoji grid */}
        <div
          ref={gridRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 12px 12px',
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 4,
            }}
          >
            {(isSearching
              ? filteredEmojis
              : activeCategoryData?.emojis ?? []
            ).map((item, idx) => {
              const value = 'emoji' in item ? item.emoji : `asset:${item.assetId}`;
              const isSelected = value === resolvedSelected;
              return (
                <button
                  key={`${value}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(value)}
                  title={item.keywords[0]}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    aspectRatio: '1',
                    fontSize: 28,
                    background: isSelected ? '#e8f5e9' : 'transparent',
                    border: isSelected ? '2px solid var(--color-primary, #4CAF50)' : '2px solid transparent',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'background 0.1s, transform 0.1s',
                    lineHeight: 1,
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.9)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = '';
                  }}
                >
                  {'emoji' in item ? (
                    item.emoji
                  ) : (
                    <img
                      src={isAssetIconId(item.assetId) ? ASSET_ICON_MAP[item.assetId].src : ''}
                      alt=""
                      style={{ width: 28, height: 28, objectFit: 'contain', display: 'block' }}
                      draggable={false}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Remove icon button */}
        <div style={{ padding: '8px 16px 14px', borderTop: '1px solid #eee' }}>
          <button
            type="button"
            onClick={() => handleSelect('')}
            style={{
              width: '100%',
              padding: 10,
              background: '#f5f5f5',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 14,
              color: '#666',
              fontWeight: 500,
            }}
          >
            ללא אייקון
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EmojiPicker – Button trigger + dialog                             */
/* ------------------------------------------------------------------ */

export interface EmojiPickerProps {
  /** Current emoji or legacy icon ID */
  value: string;
  /** Called with the emoji character (or '' to clear) */
  onChange: (emoji: string) => void;
  /** Optional label shown above the button */
  label?: string;
  /** When true, open the emoji selection dialog immediately on mount */
  openImmediately?: boolean;
}

export function EmojiPicker({ value, onChange, label, openImmediately }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (openImmediately) setOpen(true);
  }, [openImmediately]);

  // Resolve display: if value is a legacy ID, show the mapped emoji
  const displayEmoji = value ? (LEGACY_ICON_MAP[value] ?? value) : '';

  return (
    <div>
      {label && <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 15,
          minHeight: 40,
          minWidth: 120,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#999')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#ccc')}
      >
        {displayEmoji ? (
          <>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{displayEmoji}</span>
            <span style={{ color: '#333' }}>שינוי</span>
          </>
        ) : (
          <span style={{ color: '#999' }}>בחר אייקון</span>
        )}
      </button>

      {open && createPortal(
        <EmojiPickerDialog
          selectedEmoji={value}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />,
        document.body,
      )}
    </div>
  );
}

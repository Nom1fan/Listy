import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { CategoryIcon } from './CategoryIcon';
import type { ProductDto } from '../types';

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  products: ProductDto[];
  onSelectProduct?: (product: ProductDto) => void;
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
  /** When set, shows a "duplicate" warning instead of auto-filling */
  warnOnly?: boolean;
  /** Target category ID -- exact-duplicate warning only fires for this category */
  categoryId?: string;
}

const MAX_SUGGESTIONS = 7;
const MIN_CHARS = 2;

export function ProductAutocomplete({
  value,
  onChange,
  products,
  onSelectProduct,
  placeholder,
  required,
  style,
  warnOnly,
  categoryId,
}: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const trimmed = value.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (trimmed.length < MIN_CHARS) return [];
    const results: ProductDto[] = [];
    for (const p of products) {
      if (p.nameHe.toLowerCase().includes(trimmed)) {
        results.push(p);
        if (results.length >= MAX_SUGGESTIONS) break;
      }
    }
    return results;
  }, [trimmed, products]);

  const hasSuggestions = suggestions.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [suggestions]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      item?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const selectProduct = useCallback(
    (product: ProductDto) => {
      onSelectProduct?.(product);
      if (!warnOnly) {
        onChange(product.nameHe);
      }
      setOpen(false);
    },
    [onSelectProduct, onChange, warnOnly],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || !hasSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      selectProduct(suggestions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Exact-match duplicate for warning mode -- only within the same target category
  const exactDuplicate = warnOnly
    ? suggestions.find((p) => p.nameHe.toLowerCase() === trimmed && (!categoryId || p.categoryId === categoryId))
    : null;

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (hasSuggestions) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        style={style}
        autoComplete="off"
      />

      {/* Duplicate warning banner (for Categories inline form) */}
      {warnOnly && exactDuplicate && (
        <div
          style={{
            marginTop: 4,
            padding: '6px 10px',
            background: '#fff3e0',
            border: '1px solid #ffb74d',
            borderRadius: 8,
            fontSize: 13,
            color: '#e65100',
          }}
        >
          פריט בשם זה כבר קיים בקטגוריה <strong>{exactDuplicate.categoryNameHe}</strong>
        </div>
      )}

      {/* Autocomplete dropdown */}
      {open && hasSuggestions && !warnOnly && (
        <ul
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1100,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
            margin: '4px 0 0',
            padding: 0,
            listStyle: 'none',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((p, i) => (
            <li
              key={p.id}
              onMouseDown={(e) => {
                e.preventDefault();
                selectProduct(p);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                background: i === highlightIndex ? '#e3f2fd' : 'transparent',
                borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <CategoryIcon iconId={p.iconId ?? p.categoryIconId} imageUrl={p.imageUrl} size={24} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14 }}>{p.nameHe}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{p.categoryNameHe}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Suggestion dropdown for warnOnly mode (show similar items) */}
      {open && hasSuggestions && warnOnly && (
        <ul
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1100,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
            margin: '4px 0 0',
            padding: 0,
            listStyle: 'none',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          <li style={{ padding: '6px 12px', fontSize: 12, color: '#888', borderBottom: '1px solid #f0f0f0' }}>
            פריטים דומים שכבר קיימים:
          </li>
          {suggestions.map((p, i) => (
            <li
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                fontSize: 13,
                color: '#555',
              }}
            >
              <CategoryIcon iconId={p.iconId ?? p.categoryIconId} imageUrl={p.imageUrl} size={20} />
              <span>{p.nameHe}</span>
              <span style={{ fontSize: 12, color: '#999' }}>({p.categoryNameHe})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

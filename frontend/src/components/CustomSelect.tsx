import { useState, useRef, useEffect, useCallback } from 'react';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  label?: string;
  id?: string;
  /** Optional trigger style (e.g. for workspace in header) */
  style?: React.CSSProperties;
  /** Full width for form usage */
  fullWidth?: boolean;
  /** Optional aria-label for trigger */
  'aria-label'?: string;
}

const triggerBaseStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ccc',
  background: '#fff',
  fontSize: 14,
  cursor: 'pointer',
  textAlign: 'right',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  minHeight: 42,
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  left: 0,
  marginTop: 4,
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  maxHeight: 280,
  overflowY: 'auto',
  zIndex: 1000,
};

const optionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  cursor: 'pointer',
  fontSize: 14,
  textAlign: 'right',
  border: 'none',
  background: 'transparent',
  width: '100%',
  fontFamily: 'inherit',
  transition: 'background 0.15s',
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  id,
  style,
  fullWidth = true,
  'aria-label': ariaLabel,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder ?? '';

  const close = useCallback(() => {
    setOpen(false);
    setHighlightIndex(-1);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [close]);

  useEffect(() => {
    if (open && highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      item?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [open, highlightIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
        setHighlightIndex(value ? options.findIndex((o) => o.value === value) : 0);
        if (options.length > 0 && !value) setHighlightIndex(0);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0 && options[highlightIndex]) {
      e.preventDefault();
      onChange(options[highlightIndex].value);
      close();
    }
  }

  const triggerStyle: React.CSSProperties = {
    ...triggerBaseStyle,
    ...(fullWidth ? {} : { width: 'auto', minWidth: 140 }),
    ...style,
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ display: 'block', marginBottom: 4, fontSize: 14 }}
        >
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        aria-label={ariaLabel ?? label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-selected={undefined}
        role="combobox"
        onClick={() => {
          if (!open) {
            const idx = value ? options.findIndex((o) => o.value === value) : 0;
            setHighlightIndex(idx >= 0 ? idx : 0);
          }
          setOpen((v) => !v);
        }}
        onKeyDown={handleKeyDown}
        style={triggerStyle}
      >
        {selectedOption?.icon && (
          <span style={{ flexShrink: 0 }}>{selectedOption.icon}</span>
        )}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <span style={{ flexShrink: 0 }} aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          style={{ ...dropdownStyle, listStyle: 'none', margin: 0, padding: 0 }}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isHighlighted = i === highlightIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                style={{
                  ...optionStyle,
                  background: isHighlighted ? 'var(--color-bar, #9ccc65)' : isSelected ? '#e8f5e9' : 'transparent',
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                onClick={() => {
                  onChange(opt.value);
                  close();
                }}
              >
                {opt.icon && <span style={{ flexShrink: 0 }}>{opt.icon}</span>}
                <span style={{ flex: 1 }}>{opt.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

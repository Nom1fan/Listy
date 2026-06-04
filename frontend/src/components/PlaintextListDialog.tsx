import { useMemo, useState } from 'react';
import type { ListItemResponse } from '../types';

type PlaintextListDialogProps = {
  title: string;
  items: ListItemResponse[];
  onClose: () => void;
};

export function PlaintextListDialog({ title, items, onClose }: PlaintextListDialogProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const text = useMemo(() => items.map((item) => item.displayName).join('\n'), [items]);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('הועתק');
    } catch {
      setCopyStatus('לא ניתן להעתיק');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plaintext-list-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1600,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          maxWidth: 460,
          width: '100%',
          direction: 'rtl',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <h3 id="plaintext-list-title" style={{ margin: 0, fontSize: 18 }}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              color: '#666',
              cursor: 'pointer',
              padding: '2px 8px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <textarea
          aria-label="פריטי הרשימה כטקסט"
          readOnly
          value={text}
          rows={Math.min(Math.max(items.length, 4), 12)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            resize: 'vertical',
            minHeight: 140,
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 10,
            fontSize: 15,
            lineHeight: 1.6,
            direction: 'rtl',
            background: '#fafafa',
            color: '#222',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={copyAll}
            style={{
              flex: 1,
              padding: 12,
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
            }}
          >
            העתק הכל
          </button>
          {copyStatus && (
            <span role="status" style={{ color: 'var(--color-primary-dark)', fontSize: 14, fontWeight: 600 }}>
              {copyStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSideMenuStore } from '../store/sideMenuStore';

const accordionSections = [
  { id: 'section-1', label: 'קטע 1' },
  { id: 'section-2', label: 'קטע 2' },
  { id: 'section-3', label: 'קטע 3' },
] as const;

export function SideMenu() {
  const isOpen = useSideMenuStore((s) => s.isOpen);
  const close = useSideMenuStore((s) => s.close);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        role="presentation"
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 999,
          animation: 'sideMenuOverlayIn 0.2s ease-out',
        }}
        onClick={close}
      />
      <aside
        role="dialog"
        aria-label="תפריט צד"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(320px, 85vw)',
          maxWidth: 320,
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'sideMenuPanelIn 0.25s ease-out',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="Listyyy" style={{ height: 28, width: 28, objectFit: 'contain' }} />
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Listyyy</h2>
          </div>
          <button
            type="button"
            onClick={close}
            style={{
              padding: 8,
              background: 'transparent',
              fontSize: 24,
              lineHeight: 1,
            }}
            aria-label="סגור תפריט"
          >
            ×
          </button>
        </div>
        <nav style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          <Link
            to="/profile"
            onClick={close}
            style={{
              display: 'block',
              padding: '14px 20px',
              textAlign: 'right',
              fontSize: 15,
              fontWeight: 500,
              color: 'inherit',
              textDecoration: 'none',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            הפרופיל שלי
          </Link>
          {accordionSections.map(({ id, label }) => {
            const isExpanded = expandedId === id;
            return (
              <div
                key={id}
                style={{
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(id)}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    textAlign: 'right',
                    background: 'transparent',
                    fontSize: 15,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                  aria-expanded={isExpanded}
                  aria-controls={`${id}-content`}
                  id={`${id}-header`}
                >
                  {label}
                  <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </button>
                <div
                  id={`${id}-content`}
                  role="region"
                  aria-labelledby={`${id}-header`}
                  style={{
                    overflow: 'hidden',
                    maxHeight: isExpanded ? 200 : 0,
                    transition: 'max-height 0.25s ease-out',
                  }}
                >
                  <div style={{ padding: '8px 20px 16px', color: '#666', fontSize: 14 }}>
                    {/* Placeholder for future content */}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
      <style>{`
        @keyframes sideMenuOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sideMenuPanelIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

import { useState, useEffect } from 'react';
import type { DisplayImageType } from './DisplayImageForm';
import { ImageSearchPicker } from './ImageSearchPicker';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  animation: 'imageSourceDialogIn 0.2s ease-out',
};

const dialogStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 20,
  padding: 28,
  width: 'min(360px, 100%)',
  maxHeight: '85vh',
  overflow: 'auto',
  direction: 'rtl',
  boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 24px',
  fontSize: 18,
  fontWeight: 600,
  color: '#1a1a1a',
  textAlign: 'center',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
};

const buttonBaseStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: '20px 16px',
  borderRadius: 14,
  border: '2px solid #e8e8e8',
  background: '#fafafa',
  cursor: 'pointer',
  transition: 'border-color 0.15s, background 0.15s, transform 0.1s',
  minHeight: 100,
};

const iconSize = 40;

function EmojiIcon() {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
      <path d="M8 6h8" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function SearchWebIcon() {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

type DialogView = 'choice' | 'link' | 'web';

const choiceOptions: { type: DisplayImageType; label: string; Icon: () => React.ReactElement }[] = [
  { type: 'icon', label: 'אייקון', Icon: EmojiIcon },
  { type: 'device', label: 'בחר מהמכשיר', Icon: DeviceIcon },
  { type: 'link', label: 'קישור לתמונה', Icon: LinkIcon },
  { type: 'web', label: 'חיפוש באינטרנט', Icon: SearchWebIcon },
];

const backButtonStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: '8px 12px',
  background: 'none',
  border: 'none',
  color: '#666',
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

export interface ImageSourceDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called when user chooses Icon – parent should close dialog and open emoji picker */
  onSelectIcon: () => void;
  /** Called when user chooses Device – parent should close dialog and trigger file input */
  onSelectDevice: () => void;
  /** Initial value for link URL input (e.g. current image URL) */
  initialLinkUrl?: string;
  /** Called when user submits a link URL – parent should close dialog and set image */
  onLinkSubmit: (url: string) => void;
  /** Called when user selects an image from web search – parent should close dialog and set image */
  onSearchSelect: (url: string) => void;
}

export function ImageSourceDialog({
  open,
  onClose,
  onSelectIcon,
  onSelectDevice,
  initialLinkUrl = '',
  onLinkSubmit,
  onSearchSelect,
}: ImageSourceDialogProps) {
  const [view, setView] = useState<DialogView>('choice');
  const [linkUrl, setLinkUrl] = useState(initialLinkUrl);

  useEffect(() => {
    if (open) {
      setView('choice');
      setLinkUrl(initialLinkUrl);
    }
  }, [open, initialLinkUrl]);

  if (!open) return null;

  function handleChoice(type: DisplayImageType) {
    if (type === 'icon') {
      onSelectIcon();
      onClose();
    } else if (type === 'device') {
      onSelectDevice();
      onClose();
    } else if (type === 'link') {
      setView('link');
    } else if (type === 'web') {
      setView('web');
    }
  }

  function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = linkUrl.trim();
    if (url) {
      onLinkSubmit(url);
      onClose();
    }
  }

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-source-dialog-title"
    >
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        {view === 'choice' && (
          <>
            <h2 id="image-source-dialog-title" style={titleStyle}>
              איך להוסיף תמונה?
            </h2>
            <div style={gridStyle}>
              {choiceOptions.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  type="button"
                  data-testid={`image-source-${type}`}
                  onClick={() => handleChoice(type)}
                  className="image-source-dialog-btn"
                  style={buttonBaseStyle}
                >
                  <span style={{ color: 'var(--color-primary, #7cb342)' }}>
                    <Icon />
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {view === 'link' && (
          <>
            <button type="button" style={backButtonStyle} onClick={() => setView('choice')} data-testid="image-source-link-back">
              ← חזרה
            </button>
            <h2 style={titleStyle}>קישור לתמונה</h2>
            <form onSubmit={handleLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ccc', boxSizing: 'border-box', fontSize: 15 }}
                data-testid="image-source-link-input"
              />
              <button
                type="submit"
                disabled={!linkUrl.trim()}
                style={{
                  padding: 12,
                  background: linkUrl.trim() ? 'var(--color-primary)' : '#ccc',
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: 10,
                  border: 'none',
                  cursor: linkUrl.trim() ? 'pointer' : 'not-allowed',
                }}
                data-testid="image-source-link-submit"
              >
                הוסף תמונה
              </button>
            </form>
          </>
        )}

        {view === 'web' && (
          <>
            <button type="button" style={backButtonStyle} onClick={() => setView('choice')} data-testid="image-source-web-back">
              ← חזרה
            </button>
            <h2 style={titleStyle}>חיפוש תמונה באינטרנט</h2>
            <ImageSearchPicker
              onSelect={(url) => {
                onSearchSelect(url);
                onClose();
              }}
              placeholder="חיפוש תמונה..."
            />
          </>
        )}
      </div>
      <style>{`
        @keyframes imageSourceDialogIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .image-source-dialog-btn:hover {
          background: #f0f5eb !important;
          border-color: var(--color-primary, #7cb342) !important;
        }
        .image-source-dialog-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

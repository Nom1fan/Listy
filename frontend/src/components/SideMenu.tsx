import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSideMenuStore } from '../store/sideMenuStore';
import { useAuthStore } from '../store/authStore';

const APP_VERSION = __APP_VERSION__;
const SUPPORT_EMAIL = 'listyyysupp@gmail.com';

export function SideMenu() {
  const isOpen = useSideMenuStore((s) => s.isOpen);
  const close = useSideMenuStore((s) => s.close);
  const user = useAuthStore((s) => s.user);

  const [aboutOpen, setAboutOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const handleSupport = () => {
    const subject = encodeURIComponent('פנייה לתמיכה - Listyyy');
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Listyyy',
      text: 'Listyyy - אפליקציה חכמה לניהול רשימות.\nשתפו רשימות עם המשפחה והחברים, ותנהלו הכל בצורה קלה ומהירה.',
      url: 'https://listyyy.com',
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
      }
    } catch {
      // User cancelled share - ignore
    }
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
        {/* Header */}
        <div
          style={{
            padding: 'max(16px, env(safe-area-inset-top)) 20px 16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png?v=3" alt="Listyyy" style={{ height: 40, width: 40, objectFit: 'contain' }} />
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

        {/* Menu Items */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          <Link
            to="/profile"
            onClick={close}
            style={menuItemStyle}
          >
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt=""
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>👤</span>
            )}
            הפרופיל שלי
          </Link>

          <button type="button" onClick={handleSupport} style={menuItemStyle}>
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>💬</span>
            פנייה לתמיכה
          </button>

          <button type="button" onClick={handleShare} style={menuItemStyle}>
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>📤</span>
            שיתוף האפליקציה
          </button>

          <button type="button" onClick={() => setAboutOpen(true)} style={menuItemStyle}>
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>ℹ️</span>
            אודות
          </button>
        </nav>

        {/* Version footer */}
        <div style={{ padding: '12px 20px max(12px, env(safe-area-inset-bottom))', borderTop: '1px solid #eee', fontSize: 12, color: '#aaa', textAlign: 'center' }}>
          גרסה {APP_VERSION}
        </div>
      </aside>

      {/* About Dialog */}
      {aboutOpen && (
        <div style={overlayStyle} onClick={() => setAboutOpen(false)}>
          <div style={{ ...dialogStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <img src="/logo.png?v=3" alt="Listyyy" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Listyyy</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#999' }}>גרסה {APP_VERSION}</p>
            <p style={{ margin: '0 0 8px', fontSize: 15, color: '#444', lineHeight: 1.7 }}>
              אפליקציה חכמה לניהול רשימות.<br />
              שתפו רשימות עם המשפחה והחברים,<br />
              ותנהלו הכל בצורה קלה ומהירה.
            </p>
            <div style={{ margin: '16px 0 0', padding: '12px 0 0', borderTop: '1px solid #eee' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                נוצר ופותח על ידי
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600, color: '#333' }}>
                מור מרחב
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAboutOpen(false)}
              style={{
                marginTop: 20,
                padding: '10px 32px',
                borderRadius: 8,
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              סגירה
            </button>
          </div>
        </div>
      )}

      {/* Share toast */}
      {shareToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 'max(32px, env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#333',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 24,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 2000,
            animation: 'sideMenuOverlayIn 0.2s ease-out',
          }}
        >
          הקישור הועתק ללוח
        </div>
      )}

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

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '14px 20px',
  textAlign: 'right',
  fontSize: 15,
  fontWeight: 500,
  color: 'inherit',
  textDecoration: 'none',
  background: 'transparent',
  borderBottom: '1px solid #f0f0f0',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  zIndex: 1500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'sideMenuOverlayIn 0.2s ease-out',
};

const dialogStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  width: 'min(400px, 90vw)',
  maxHeight: '80vh',
  overflow: 'auto',
  direction: 'rtl',
};

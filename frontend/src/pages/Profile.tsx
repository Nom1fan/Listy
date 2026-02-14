import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { updateProfile } from '../api/auth';
import { uploadFile } from '../api/client';
import { AppBar } from '../components/AppBar';
import { getUserDisplayLabel } from '../utils/user';

export function Profile() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [imageUrl, setImageUrl] = useState(user?.profileImageUrl ?? '');
  const [linkInput, setLinkInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadFile<{ url: string }>('/api/upload/profile', file);
      setImageUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהעלאה');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleLinkSubmit() {
    const url = linkInput.trim();
    if (!url) return;
    setImageUrl(url);
    setLinkInput('');
    setShowLinkInput(false);
  }

  function handleRemoveImage() {
    setImageUrl('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body: { displayName?: string | null; profileImageUrl?: string | null } = {};
      const trimmedName = displayName.trim();
      if (trimmedName) body.displayName = trimmedName;
      // Always send profileImageUrl so it can be cleared or updated
      body.profileImageUrl = imageUrl || '';
      const res = await updateProfile(body);
      setAuth(res);
      navigate('/lists', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setSaving(false);
    }
  }

  const hasImage = !!imageUrl;

  return (
    <>
      <AppBar title="פרופיל" backTo="/lists" />
      <main style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        {/* Profile picture section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          {hasImage ? (
            <>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <img
                  src={imageUrl}
                  alt="תמונת פרופיל"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--color-primary)',
                  }}
                  onError={() => setImageUrl('')}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  title="הסר תמונה"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#e53935',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: 1,
                    padding: 0,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  ×
                </button>
              </div>
              <span style={{ fontSize: 14, color: '#666' }}>
                {getUserDisplayLabel(user) || '—'}
              </span>
            </>
          ) : (
            <>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  color: '#9e9e9e',
                  marginBottom: 8,
                  border: '3px dashed #bdbdbd',
                }}
              >
                👤
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: '#333' }}>
                {getUserDisplayLabel(user) || '—'}
              </span>
            </>
          )}

          {/* Image action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '8px 16px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                color: '#333',
              }}
            >
              {uploading ? 'מעלה...' : 'העלה תמונה'}
            </button>
            <button
              type="button"
              onClick={() => setShowLinkInput((v) => !v)}
              style={{
                padding: '8px 16px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                color: '#333',
              }}
            >
              קישור לתמונה
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          {showLinkInput && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, width: '100%' }}>
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://..."
                dir="ltr"
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: 13,
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLinkSubmit(); }}
              />
              <button
                type="button"
                onClick={handleLinkSubmit}
                disabled={!linkInput.trim()}
                style={{
                  padding: '8px 14px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: !linkInput.trim() ? 0.5 : 1,
                }}
              >
                אישור
              </button>
            </div>
          )}
        </div>

        {/* Display name form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>שם לתצוגה</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user?.email || user?.phone || ''}
              maxLength={255}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>
              אם ריק, יוצגו אימייל או טלפון.
            </p>
          </div>
          {error && <p style={{ color: 'var(--color-strike)', margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={saving || uploading}
            style={{
              padding: 12,
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              opacity: saving || uploading ? 0.5 : 1,
            }}
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/lists">חזרה לרשימות</Link>
        </p>
      </main>
    </>
  );
}

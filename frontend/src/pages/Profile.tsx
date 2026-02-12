import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { updateProfile } from '../api/auth';
import { AppBar } from '../components/AppBar';
import { getUserDisplayLabel } from '../utils/user';

export function Profile() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await updateProfile(displayName.trim() || null);
      setAuth(res);
      navigate('/lists', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppBar title="פרופיל" backTo="/lists" />
      <main style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        <p style={{ marginBottom: 16, color: '#666' }}>
          כרגע מוצג: <strong>{getUserDisplayLabel(user) || '—'}</strong>
        </p>
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
            disabled={saving}
            style={{
              padding: 12,
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
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

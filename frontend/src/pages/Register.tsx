import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { register } from '../api/auth';
import { AppBar } from '../components/AppBar';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await register(email, password, displayName || undefined);
      setAuth(res);
      navigate('/lists', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    }
  }

  return (
    <>
      <AppBar title="הרשמה" backTo="/login" />
      <main style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>סיסמה (לפחות 6 תווים)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>שם (אופציונלי)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </div>
          {error && <p style={{ color: 'var(--color-strike)', margin: 0 }}>{error}</p>}
          <button
            type="submit"
            style={{
              padding: 12,
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            הרשמה
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/login">כבר יש חשבון? התחבר</Link>
        </p>
      </main>
    </>
  );
}

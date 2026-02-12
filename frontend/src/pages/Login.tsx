import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { login } from '../api/auth';
import { AppBar } from '../components/AppBar';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await login(email, password);
      setAuth(res);
      navigate('/lists', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    }
  }

  return (
    <>
      <AppBar title="התחברות" />
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
            <label style={{ display: 'block', marginBottom: 4 }}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            התחבר
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/register">הרשמה</Link> · <Link to="/login/phone">התחברות עם טלפון</Link>
        </p>
      </main>
    </>
  );
}

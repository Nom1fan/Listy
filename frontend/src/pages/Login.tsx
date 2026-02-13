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
      <AppBar title="התחברות עם אימייל" backTo="/login" />
      <main style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <img src="/logo.png?v=3" alt="Listyyy" style={{ height: 80, objectFit: 'contain' }} />
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 'fit-content', margin: '0 auto', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>אימייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box', minWidth: 280 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            {error && <p style={{ color: 'var(--color-strike)', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password}
              style={{
                padding: 12,
                width: '100%',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                opacity: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password ? 0.5 : 1,
              }}
            >
              התחבר
            </button>
          </div>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/login">התחברות עם טלפון</Link>
        </p>
      </main>
    </>
  );
}

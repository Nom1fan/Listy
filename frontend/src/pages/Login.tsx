import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { requestEmailOtp, verifyEmailOtp } from '../api/auth';
import { AppBar } from '../components/AppBar';

export function Login() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmailValid || !displayName.trim()) return;
    setError('');
    setLoading(true);
    try {
      await requestEmailOtp(email);
      setStep('code');
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setLoading(true);
    try {
      await requestEmailOtp(email);
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await verifyEmailOtp(email, code, displayName);
      setAuth(res);
      navigate('/lists', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppBar title="התחברות עם אימייל" backTo="/login" />
      <main style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <img src="/logo.png?v=3" alt="Listyyy" style={{ height: 80, objectFit: 'contain' }} />
        </div>
        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: 'fit-content', margin: '0 auto', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>שם</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box', minWidth: 280 }}
                />
              </div>
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
              {error && <p style={{ color: 'var(--color-strike)', margin: 0 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading || !isEmailValid || !displayName.trim()}
                style={{
                  padding: 12,
                  width: '100%',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 600,
                  opacity: loading || !isEmailValid || !displayName.trim() ? 0.5 : 1,
                }}
              >
                {loading ? 'שולח...' : 'שלח קוד'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: 'fit-content', margin: '0 auto', gap: 16 }}>
              <p style={{ margin: 0, textAlign: 'center' }}>
                הקוד נשלח ל־<span dir="ltr" style={{ fontWeight: 600, unicodeBidi: 'embed' }}>{email}</span>
              </p>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>קוד</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  autoFocus
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box', minWidth: 280 }}
                />
              </div>
              {error && <p style={{ color: 'var(--color-strike)', margin: 0 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length < 4}
                style={{
                  padding: 12,
                  width: '100%',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 600,
                  opacity: loading || code.length < 4 ? 0.5 : 1,
                }}
              >
                {loading ? 'בודק...' : 'אימות'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError(''); setCountdown(0); }}
                style={{ background: 'transparent', color: '#666' }}
              >
                החלף אימייל
              </button>
              {countdown > 0 ? (
                <p style={{ margin: 0, textAlign: 'center', color: '#999', fontSize: 14 }}>
                  שליחה חוזרת בעוד {countdown} שניות
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  style={{ background: 'transparent', color: 'var(--color-primary)', fontSize: 14, fontWeight: 500 }}
                >
                  שלח קוד שוב
                </button>
              )}
            </div>
          </form>
        )}
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/login">התחברות עם טלפון</Link>
        </p>
      </main>
    </>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { requestEmailOtp, verifyEmailOtp } from '../api/auth';
import { OtpInput } from '../components/OtpInput';

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '32px 24px',
  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  width: '100%',
  maxWidth: 380,
};

const fieldStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: '1.5px solid #ddd',
  fontSize: 16,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const btnStyle: React.CSSProperties = {
  padding: '14px 24px',
  width: '100%',
  background: 'var(--color-primary)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 16,
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.15s',
};

/** Mask email: john.doe@gmail.com → j•••••e@gmail.com */
function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return local[0] + '•••' + domain;
  return local[0] + '•'.repeat(local.length - 2) + local[local.length - 1] + domain;
}

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

  const doVerify = useCallback(
    async (otpCode: string) => {
      setError('');
      setLoading(true);
      try {
        const res = await verifyEmailOtp(email, otpCode, displayName);
        setAuth(res);
        navigate('/lists', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה');
      } finally {
        setLoading(false);
      }
    },
    [email, displayName, setAuth, navigate],
  );

  const handleOtpComplete = useCallback(
    (otpCode: string) => {
      setTimeout(() => doVerify(otpCode), 350);
    },
    [doVerify],
  );

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    doVerify(code);
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <img src="/logo.png?v=3" alt="Listyyy" style={{ height: 72, objectFit: 'contain' }} />
      </div>

      <div style={cardStyle}>
        {step === 'email' ? (
          <>
            <h2 style={{ margin: '0 0 4px', textAlign: 'center', fontSize: 22, fontWeight: 700 }}>
              התחברות עם אימייל
            </h2>
            <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#666', fontSize: 15 }}>
              הזינו שם וכתובת אימייל
            </p>
            <form
              onSubmit={handleRequestOtp}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                  שם
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="השם שלך"
                  style={fieldStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ddd';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                  אימייל
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  placeholder="your@email.com"
                  style={fieldStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ddd';
                  }}
                />
              </div>
              {error && (
                <p style={{ color: 'var(--color-strike)', margin: 0, fontSize: 14, textAlign: 'center' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !isEmailValid || !displayName.trim()}
                style={{
                  ...btnStyle,
                  opacity: loading || !isEmailValid || !displayName.trim() ? 0.5 : 1,
                  cursor:
                    loading || !isEmailValid || !displayName.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'שולח...' : 'שלח קוד'}
              </button>
            </form>
          </>
        ) : (
          <form
            onSubmit={handleVerify}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 17, color: '#444' }}>
                שלחנו קוד חד פעמי לכתובת
              </p>
              <p
                dir="ltr"
                style={{ margin: 0, fontSize: 16, fontWeight: 700, unicodeBidi: 'embed' }}
              >
                {maskEmail(email)}
              </p>
            </div>

            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: '#333' }}>
              מה הקוד שקיבלת?
            </p>

            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={handleOtpComplete}
              disabled={loading}
            />

            {error && (
              <p style={{ color: 'var(--color-strike)', margin: 0, fontSize: 14 }}>{error}</p>
            )}
            {loading && <p style={{ margin: 0, color: '#999', fontSize: 14 }}>מאמת...</p>}

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                  setCountdown(0);
                }}
                style={{ background: 'transparent', color: '#666', fontSize: 14, padding: '8px 4px' }}
              >
                החלף אימייל
              </button>
              <span style={{ color: '#ddd' }}>|</span>
              {countdown > 0 ? (
                <span style={{ color: '#999', fontSize: 14 }}>
                  שליחה חוזרת בעוד {countdown} שניות
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  style={{
                    background: 'transparent',
                    color: 'var(--color-primary)',
                    fontSize: 14,
                    fontWeight: 500,
                    padding: '8px 4px',
                  }}
                >
                  שלח קוד שוב
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
          התחברות עם טלפון
        </Link>
      </p>
    </main>
  );
}

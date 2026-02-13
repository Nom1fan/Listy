import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { requestPhoneOtp, verifyPhoneOtp } from '../api/auth';
import { AppBar } from '../components/AppBar';
import { COUNTRY_OPTIONS } from '../data/countries';

const inputStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 8,
  border: '1px solid #ccc',
  fontSize: 16,
  textAlign: 'center',
  width: 48,
  boxSizing: 'border-box',
};

export function PhoneLogin() {
  const [countryIndex, setCountryIndex] = useState(0);
  const [segmentValues, setSegmentValues] = useState<string[]>(() =>
    COUNTRY_OPTIONS[0].segments.map(() => '')
  );
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const segmentRefs = useRef<(HTMLInputElement | null)[]>([]);

  const country = COUNTRY_OPTIONS[countryIndex];
  const localDigits = segmentValues.join('');
  const fullPhone = '+' + country.code + (
    country.localPrefix && localDigits.startsWith(country.localPrefix)
      ? localDigits.slice(country.localPrefix.length)
      : localDigits
  );
  const isPhoneComplete =
    segmentValues.length === country.segments.length &&
    segmentValues.every((v, i) => v.length === country.segments[i]);

  const formattedPhone = useMemo(() => segmentValues.join('-'), [segmentValues]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    segmentRefs.current = segmentRefs.current.slice(0, country.segments.length);
  }, [country.segments.length]);

  const setSegment = useCallback(
    (index: number, value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, country.segments[index]);
      const maxLen = country.segments[index];
      const shouldJump = digits.length === maxLen && index < country.segments.length - 1;
      setSegmentValues((prev) => {
        const next = [...prev];
        next[index] = digits;
        return next;
      });
      if (shouldJump) {
        setTimeout(() => segmentRefs.current[index + 1]?.focus(), 0);
      }
    },
    [country.segments]
  );

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const i = Number(e.target.value);
    setCountryIndex(i);
    setSegmentValues(COUNTRY_OPTIONS[i].segments.map(() => ''));
  };

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!isPhoneComplete) return;
    setError('');
    setLoading(true);
    try {
      await requestPhoneOtp(fullPhone);
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
      await requestPhoneOtp(fullPhone);
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
      const res = await verifyPhoneOtp(fullPhone, code, displayName);
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
      <AppBar title="התחברות עם מספר טלפון" />
      <main style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <img src="/logo.png?v=3" alt="Listyyy" style={{ height: 80, objectFit: 'contain' }} />
        </div>
        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: 'fit-content', margin: '0 auto', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>שם</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>מספר טלפון</label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    alignItems: 'center',
                    gap: 6,
                    direction: 'ltr',
                    minWidth: 0,
                  }}
                >
                  <select
                    value={countryIndex}
                    onChange={handleCountryChange}
                    aria-label="קוד מדינה"
                    style={{
                      ...inputStyle,
                      width: 108,
                      minWidth: 108,
                      flexShrink: 0,
                      padding: '8px 28px 8px 10px',
                      cursor: 'pointer',
                      fontSize: 15,
                      textAlign: 'left',
                    }}
                  >
                    {COUNTRY_OPTIONS.map((c, i) => (
                      <option key={c.code + c.name} value={i}>
                        {c.flag} {c.name} +{c.code}
                      </option>
                    ))}
                  </select>
                  {country.segments.map((len, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      {i > 0 && <span style={{ color: '#999', fontWeight: 600, fontSize: 14 }}>–</span>}
                      <input
                        ref={(el) => { segmentRefs.current[i] = el; }}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={segmentValues[i] ?? ''}
                        onChange={(e) => setSegment(i, e.target.value)}
                        placeholder={country.example[i]}
                        maxLength={len}
                        required
                        style={{
                          ...inputStyle,
                          width: Math.max(48, len * 14),
                        }}
                        aria-label={`קטע ${i + 1}`}
                      />
                    </span>
                  ))}
                </div>
              </div>
              {error && <p style={{ color: 'var(--color-strike)', margin: 0 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading || !isPhoneComplete || !displayName.trim()}
                style={{
                  padding: 12,
                  width: '100%',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 600,
                  opacity: loading || !isPhoneComplete || !displayName.trim() ? 0.5 : 1,
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
                הקוד נשלח ל־<span dir="ltr" style={{ fontWeight: 600, unicodeBidi: 'embed' }}>{formattedPhone}</span>
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
                onClick={() => { setStep('phone'); setCode(''); setError(''); setCountdown(0); }}
                style={{ background: 'transparent', color: '#666' }}
              >
                החלף מספר
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
          <Link to="/login/email">התחברות עם אימייל</Link>
        </p>
      </main>
    </>
  );
}

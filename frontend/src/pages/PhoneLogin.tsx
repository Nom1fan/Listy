import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const segmentRefs = useRef<(HTMLInputElement | null)[]>([]);

  const country = COUNTRY_OPTIONS[countryIndex];
  const fullPhone = '+' + country.code + segmentValues.join('');
  const isPhoneComplete =
    segmentValues.length === country.segments.length &&
    segmentValues.every((v, i) => v.length === country.segments[i]);

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
      const res = await verifyPhoneOtp(fullPhone, code);
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
      <AppBar title="התחברות עם טלפון" backTo="/login" />
      <main style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: 'fit-content', gap: 16 }}>
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
                        placeholder={'0'.repeat(len)}
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
                disabled={loading || !isPhoneComplete}
                style={{
                  padding: 12,
                  width: '100%',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                {loading ? 'שולח...' : 'שלח קוד'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0 }}>הקוד נשלח ל־<span dir="ltr">{fullPhone}</span></p>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>קוד</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
              />
            </div>
            {error && <p style={{ color: 'var(--color-strike)', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: 12,
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              {loading ? 'בודק...' : 'אימות'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setCode(''); setError(''); }}
              style={{ background: 'transparent', color: '#666' }}
            >
              החלף מספר
            </button>
          </form>
        )}
      </main>
    </>
  );
}

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { requestPhoneOtp, verifyPhoneOtp, devLogin } from '../api/auth';
import { OtpInput } from '../components/OtpInput';
import { COUNTRY_OPTIONS } from '../data/countries';
import SmsConsent, { isNativeAndroid } from '../plugins/smsConsent';

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

const segmentInputStyle: React.CSSProperties = {
  padding: '10px 6px',
  borderRadius: 10,
  border: '1.5px solid #ddd',
  fontSize: 16,
  textAlign: 'center',
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

/** Mask middle digits: 054-1234567 → 05X-XXX4567 */
function maskPhone(segments: string[]): string {
  const full = segments.join('');
  if (full.length <= 5) return segments.join('-');
  const chars = full.split('');
  const masked = chars.map((c, i) => {
    if (i < 2 || i >= chars.length - 4) return c;
    return 'X';
  });
  let result = '';
  let pos = 0;
  for (let i = 0; i < segments.length; i++) {
    if (i > 0) result += '-';
    result += masked.slice(pos, pos + segments[i].length).join('');
    pos += segments[i].length;
  }
  return result;
}

export function PhoneLogin() {
  const [countryIndex, setCountryIndex] = useState(0);
  const [segmentValues, setSegmentValues] = useState<string[]>(() =>
    COUNTRY_OPTIONS[0].segments.map(() => ''),
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
  const fullPhone =
    '+' +
    country.code +
    (country.localPrefix && localDigits.startsWith(country.localPrefix)
      ? localDigits.slice(country.localPrefix.length)
      : localDigits);
  const isPhoneComplete =
    segmentValues.length === country.segments.length &&
    segmentValues.every((v, i) => v.length === country.segments[i]);

  const maskedPhone = useMemo(() => maskPhone(segmentValues), [segmentValues]);

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
    [country.segments],
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

  async function handleDevLogin() {
    setError('');
    setLoading(true);
    try {
      const res = await devLogin();
      setAuth(res);
      navigate('/lists', { replace: true });
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
        const res = await verifyPhoneOtp(fullPhone, otpCode, displayName);
        setAuth(res);
        navigate('/lists', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה');
      } finally {
        setLoading(false);
      }
    },
    [fullPhone, displayName, setAuth, navigate],
  );

  const handleOtpComplete = useCallback(
    (otpCode: string) => {
      setTimeout(() => doVerify(otpCode), 350);
    },
    [doVerify],
  );

  // Auto-read SMS: native Android plugin (SMS User Consent) or WebOTP for browsers
  useEffect(() => {
    if (step !== 'code') return;

    let cancelled = false;
    const ac = new AbortController();

    function applyCode(otpCode: string) {
      if (cancelled) return;
      setCode(otpCode);
      if (otpCode.length === 6) {
        handleOtpComplete(otpCode);
      }
    }

    if (isNativeAndroid()) {
      SmsConsent.startListening()
        .then(({ code: otpCode }) => applyCode(otpCode))
        .catch(() => {});
    } else if ('OTPCredential' in window) {
      navigator.credentials
        .get({
          otp: { transport: ['sms'] },
          signal: ac.signal,
        } as CredentialRequestOptions)
        .then((credential) => {
          const otpCode = (credential as { code: string } | null)?.code;
          if (otpCode) applyCode(otpCode);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      ac.abort();
      if (isNativeAndroid()) {
        SmsConsent.stopListening().catch(() => {});
      }
    };
  }, [step, handleOtpComplete]);

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
        padding: 'max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <img src="/logo.png?v=3" alt="Listyyy" style={{ height: 72, objectFit: 'contain' }} />
      </div>

      <div style={cardStyle}>
        {step === 'phone' ? (
          <>
            <h2 style={{ margin: '0 0 4px', textAlign: 'center', fontSize: 22, fontWeight: 700 }}>
              ברוכים הבאים!
            </h2>
            <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#666', fontSize: 15 }}>
              הזינו שם ומספר טלפון להתחברות
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
                  מספר טלפון
                </label>
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
                      ...segmentInputStyle,
                      width: 108,
                      minWidth: 108,
                      flexShrink: 0,
                      padding: '10px 28px 10px 10px',
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
                  {country.segments.map((len, i) => {
                    const isLast = i === country.segments.length - 1;
                    return (
                      <span
                        key={i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          ...(isLast
                            ? { flex: 1, minWidth: 0 }
                            : { flexShrink: 0 }),
                        }}
                      >
                        {i > 0 && (
                          <span style={{ color: '#bbb', fontWeight: 600, fontSize: 14 }}>–</span>
                        )}
                        <input
                          ref={(el) => {
                            segmentRefs.current[i] = el;
                          }}
                          type="tel"
                          inputMode="numeric"
                          autoComplete={i === 0 ? 'tel-national' : 'off'}
                          value={segmentValues[i] ?? ''}
                          onChange={(e) => setSegment(i, e.target.value)}
                          placeholder={country.example[i]}
                          maxLength={len}
                          required
                          style={{
                            ...segmentInputStyle,
                            ...(isLast
                              ? { width: '100%' }
                              : { width: Math.max(48, len * 14) }),
                          }}
                          aria-label={`קטע ${i + 1}`}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--color-primary)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#ddd';
                          }}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
              {error && (
                <p style={{ color: 'var(--color-strike)', margin: 0, fontSize: 14, textAlign: 'center' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !isPhoneComplete || !displayName.trim()}
                style={{
                  ...btnStyle,
                  opacity: loading || !isPhoneComplete || !displayName.trim() ? 0.5 : 1,
                  cursor:
                    loading || !isPhoneComplete || !displayName.trim() ? 'not-allowed' : 'pointer',
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
                שלחנו קוד חד פעמי למספר
              </p>
              <p
                dir="ltr"
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  unicodeBidi: 'embed',
                  letterSpacing: 1,
                }}
              >
                {maskedPhone}
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
                  setStep('phone');
                  setCode('');
                  setError('');
                  setCountdown(0);
                }}
                style={{ background: 'transparent', color: '#666', fontSize: 14, padding: '8px 4px' }}
              >
                החלף מספר
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
        <Link to="/login/email" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
          התחברות עם אימייל
        </Link>
      </p>

      {import.meta.env.VITE_DEV_LOGIN === 'true' && (
        <button
          type="button"
          onClick={handleDevLogin}
          disabled={loading}
          style={{
            marginTop: 8,
            padding: '8px 16px',
            background: 'transparent',
            color: '#999',
            fontSize: 12,
            border: '1px dashed #ccc',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          Dev Login (skip OTP)
        </button>
      )}
    </main>
  );
}

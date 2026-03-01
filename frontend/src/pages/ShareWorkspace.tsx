import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkspace, getWorkspaceMembers, inviteWorkspaceMember, removeWorkspaceMember } from '../api/workspaces';
import { AppBar } from '../components/AppBar';
import { useAuthStore } from '../store/authStore';
import { COUNTRY_OPTIONS } from '../data/countries';
import type { ListMemberDto } from '../types';

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

function isValidEmail(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  const at = t.indexOf('@');
  return at > 0 && at < t.length - 1 && t.includes('.', at);
}

function memberLabel(m: ListMemberDto, currentUserId: string): string {
  const name = m.displayName?.trim() || m.email || m.phone || 'חבר/ה';
  return m.userId === currentUserId ? `${name} (את/ה)` : name;
}

export function ShareWorkspace() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.userId ?? '';

  const [inviteMethod, setInviteMethod] = useState<'email' | 'phone'>('email');
  const [inviteEmail, setInviteEmail] = useState('');
  const [countryIndex, setCountryIndex] = useState(0);
  const [segmentValues, setSegmentValues] = useState<string[]>(() =>
    COUNTRY_OPTIONS[0].segments.map(() => ''),
  );
  const [inviteError, setInviteError] = useState<string | null>(null);
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

  const validEmail = isValidEmail(inviteEmail);
  const canInvite =
    inviteMethod === 'email' ? validEmail : inviteMethod === 'phone' && isPhoneComplete;

  const { data: workspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId!),
    enabled: !!workspaceId,
  });

  const inviteMutation = useMutation({
    mutationFn: (body: { email?: string; phone?: string }) => inviteWorkspaceMember(workspaceId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceMembers', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setInviteEmail('');
      setSegmentValues(COUNTRY_OPTIONS[countryIndex].segments.map(() => ''));
      setInviteError(null);
    },
    onError: (err: Error) => {
      setInviteError(err.message || 'שגיאה בהזמנה');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberUserId: string) => removeWorkspaceMember(workspaceId!, memberUserId),
    onSuccess: (_data, memberUserId) => {
      queryClient.invalidateQueries({ queryKey: ['workspaceMembers', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      if (memberUserId === currentUserId) navigate('/lists');
    },
    onError: (err: Error) => {
      setInviteError(err.message || 'שגיאה בהסרה');
    },
  });

  const isOwner = workspace?.role === 'owner';

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    if (inviteMethod === 'email') {
      if (!validEmail) return;
      inviteMutation.mutate({ email: inviteEmail.trim() });
    } else {
      if (!isPhoneComplete) return;
      inviteMutation.mutate({ phone: fullPhone });
    }
  }

  return (
    <>
      <AppBar
        title={workspace ? `שיתוף: ${workspace.name}` : 'שיתוף מרחב'}
        backTo="/lists"
      />
      <main style={{ padding: 16 }}>
        <p style={{ margin: '0 0 20px', color: '#555', fontSize: 15 }}>
          חברים במרחב יראו את כל הרשימות והקטגוריות במרחב ויוכלו לערוך. הזמן משתמש לפי אימייל או לפי מספר טלפון.
        </p>

        {isLoading ? (
          <p>טוען...</p>
        ) : (
          <>
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600 }}>חברים במרחב</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map((m) => (
                  <li
                    key={m.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {m.profileImageUrl ? (
                        <img
                          src={m.profileImageUrl}
                          alt=""
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            color: '#9e9e9e',
                            flexShrink: 0,
                          }}
                        >
                          👤
                        </div>
                      )}
                      <div>
                        <span style={{ fontWeight: 500 }}>{memberLabel(m, currentUserId)}</span>
                        <span style={{ marginRight: 8, fontSize: 13, color: '#666' }}>
                          {m.role === 'owner' ? 'בעל/ת המרחב' : 'עורך/ת'}
                        </span>
                      </div>
                    </div>
                    {m.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(m.userId)}
                        disabled={removeMutation.isPending}
                        style={{
                          padding: '6px 12px',
                          background: m.userId === currentUserId ? '#fff3e0' : '#ffebee',
                          color: m.userId === currentUserId ? '#e65100' : '#c62828',
                          fontSize: 13,
                        }}
                      >
                        {m.userId === currentUserId ? 'עזוב מרחב' : 'הסר'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {isOwner && (
              <section style={{ padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600 }}>הזמן חבר/ה</h2>
                <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 15 }}>
                      <input
                        type="radio"
                        name="inviteMethod"
                        checked={inviteMethod === 'email'}
                        onChange={() => { setInviteMethod('email'); setInviteError(null); }}
                      />
                      הזמן לפי אימייל
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 15 }}>
                      <input
                        type="radio"
                        name="inviteMethod"
                        checked={inviteMethod === 'phone'}
                        onChange={() => { setInviteMethod('phone'); setInviteError(null); }}
                      />
                      הזמן לפי טלפון
                    </label>
                  </div>

                  {inviteMethod === 'email' ? (
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>אימייל</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                        placeholder="email@example.com"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1.5px solid #ddd',
                          fontSize: 16,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ) : (
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
                                ...(isLast ? { flex: 1, minWidth: 0 } : { flexShrink: 0 }),
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
                                placeholder=""
                                maxLength={len}
                                style={{
                                  ...segmentInputStyle,
                                  ...(isLast ? { width: '100%' } : { width: Math.max(48, len * 14) }),
                                }}
                                aria-label={`קטע ${i + 1}`}
                              />
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {inviteError && (
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--color-strike)' }}>{inviteError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending || !canInvite}
                    style={{
                      padding: 12,
                      background: 'var(--color-primary)',
                      color: '#fff',
                      fontWeight: 600,
                      borderRadius: 10,
                      opacity: inviteMutation.isPending || !canInvite ? 0.5 : 1,
                      cursor: inviteMutation.isPending || !canInvite ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {inviteMutation.isPending ? 'שולח...' : 'הזמן'}
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

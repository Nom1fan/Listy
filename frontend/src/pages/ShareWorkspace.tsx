import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkspace, getWorkspaceMembers, inviteWorkspaceMember, removeWorkspaceMember } from '../api/workspaces';
import { AppBar } from '../components/AppBar';
import { useAuthStore } from '../store/authStore';
import type { ListMemberDto } from '../types';

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

  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);

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
      setInvitePhone('');
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
    const email = inviteEmail.trim() || undefined;
    const phone = invitePhone.trim() || undefined;
    if (!email && !phone) {
      setInviteError('הזן אימייל או טלפון');
      return;
    }
    inviteMutation.mutate({ email, phone });
  }

  return (
    <>
      <AppBar
        title={workspace ? `שיתוף: ${workspace.name}` : 'שיתוף מרחב'}
        backTo="/lists"
      />
      <main style={{ padding: 16 }}>
        <p style={{ margin: '0 0 20px', color: '#555', fontSize: 15 }}>
          חברים במרחב יראו את כל הרשימות והקטגוריות במרחב ויוכלו לערוך. הוסף משתמשים לפי אימייל או מספר טלפון.
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
                <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>אימייל</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                      placeholder="email@example.com"
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>או מספר טלפון</label>
                    <input
                      type="tel"
                      value={invitePhone}
                      onChange={(e) => { setInvitePhone(e.target.value); setInviteError(null); }}
                      placeholder="050-1234567"
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                    />
                  </div>
                  {inviteError && (
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--color-strike)' }}>{inviteError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending}
                    style={{ padding: 12, background: 'var(--color-primary)', color: '#fff', fontWeight: 600 }}
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

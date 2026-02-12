import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLists, createList } from '../api/lists';
import { useAuthStore } from '../store/authStore';
import { AppBar } from '../components/AppBar';
import { getUserDisplayLabel } from '../utils/user';

export function Lists() {
  const [name, setName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['lists'],
    queryFn: getLists,
  });

  const createMutation = useMutation({
    mutationFn: (n: string) => createList(n || 'רשימה חדשה'),
    onSuccess: (list) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setShowNew(false);
      setName('');
      navigate(`/lists/${list.id}`);
    },
  });

  return (
    <>
      <AppBar
        title={getUserDisplayLabel(user) || 'הרשימות שלי'}
        right={
          <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link to="/categories" style={{ background: 'transparent', color: 'inherit', fontSize: 14 }}>
              קטגוריות
            </Link>
            <button onClick={logout} style={{ background: 'transparent', color: 'inherit', fontSize: 14 }}>
              יציאה
            </button>
          </span>
        }
      />
      <main style={{ padding: 16 }}>
        <h1
          style={{
            margin: '0 0 20px 0',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--color-text, #1a1a1a)',
          }}
        >
          רשימות
        </h1>
        {isLoading ? (
          <p>טוען...</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lists.map((list) => (
              <li key={list.id}>
                <Link
                  to={`/lists/${list.id}`}
                  style={{
                    display: 'block',
                    padding: 16,
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    color: 'inherit',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {list.name}
                    {user?.userId && list.ownerId !== user.userId && (
                      <span
                        style={{
                          fontSize: 12,
                          color: '#666',
                          background: '#f0f0f0',
                          padding: '2px 8px',
                          borderRadius: 6,
                        }}
                      >
                        רשימה משותפת
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {showNew ? (
          <div style={{ marginTop: 24, padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם הרשימה"
              autoFocus
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => createMutation.mutate(name)}
                disabled={createMutation.isPending}
                style={{ padding: '10px 16px', background: 'var(--color-primary)', color: '#fff', fontWeight: 600 }}
              >
                {createMutation.isPending ? 'יוצר...' : 'צור רשימה'}
              </button>
              <button onClick={() => { setShowNew(false); setName(''); }} style={{ padding: '10px 16px', background: '#eee' }}>
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            style={{
              marginTop: 24,
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
            aria-label="הוסף רשימה"
          >
            +
          </button>
        )}
      </main>
    </>
  );
}

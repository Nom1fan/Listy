import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLists, createList } from '../api/lists';
import { uploadFile } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { DisplayImageForm, type DisplayImageType } from '../components/DisplayImageForm';
import { getUserDisplayLabel } from '../utils/user';

export function Lists() {
  const [name, setName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [createDisplayImageType, setCreateDisplayImageType] = useState<DisplayImageType>('icon');
  const [createIconId, setCreateIconId] = useState('');
  const [createImageUrl, setCreateImageUrl] = useState('');
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const pendingCreateFileRef = useRef<File | null>(null);
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['lists'],
    queryFn: getLists,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; iconId?: string | null; imageUrl?: string | null }) => {
      const list = await createList(payload);
      const file = pendingCreateFileRef.current;
      pendingCreateFileRef.current = null;
      if (file && list?.id) {
        await uploadFile(`/api/upload/list/${list.id}`, file);
        queryClient.invalidateQueries({ queryKey: ['lists'] });
        const updated = await getLists();
        const created = updated.find((l) => l.id === list.id);
        if (created) return created;
      }
      return list;
    },
    onSuccess: (list) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setShowNew(false);
      setName('');
      setCreateDisplayImageType('icon');
      setCreateIconId('');
      setCreateImageUrl('');
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
                    <CategoryIcon iconId={list.iconId} imageUrl={list.imageUrl} size={28} />
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
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>שם הרשימה</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם הרשימה"
                autoFocus
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
              />
            </div>
            <DisplayImageForm
              label="אייקון לרשימה"
              displayType={createDisplayImageType}
              iconId={createIconId}
              imageUrl={createImageUrl}
              onDisplayTypeChange={setCreateDisplayImageType}
              onIconIdChange={setCreateIconId}
              onImageUrlChange={setCreateImageUrl}
              fileInputRef={createFileInputRef}
            />
            <input
              ref={createFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) pendingCreateFileRef.current = file;
                e.target.value = '';
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => {
                  const iconId = createDisplayImageType === 'icon' ? createIconId || null : null;
                  const imageUrl = createDisplayImageType === 'link' || createDisplayImageType === 'web' ? createImageUrl || null : null;
                  createMutation.mutate({
                    name: name || 'רשימה חדשה',
                    iconId: iconId ?? null,
                    imageUrl: imageUrl ?? null,
                  });
                }}
                disabled={createMutation.isPending}
                style={{ padding: '10px 16px', background: 'var(--color-primary)', color: '#fff', fontWeight: 600 }}
              >
                {createMutation.isPending ? 'יוצר...' : 'צור רשימה'}
              </button>
              <button
                onClick={() => {
                  setShowNew(false);
                  setName('');
                  setCreateDisplayImageType('icon');
                  setCreateIconId('');
                  setCreateImageUrl('');
                }}
                style={{ padding: '10px 16px', background: '#eee' }}
              >
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

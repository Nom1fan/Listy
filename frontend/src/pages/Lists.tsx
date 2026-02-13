import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLists, createList, deleteList, reorderLists } from '../api/lists';
import { uploadFile } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { DisplayImageForm, type DisplayImageType } from '../components/DisplayImageForm';
import { getUserDisplayLabel } from '../utils/user';
import type { ListResponse } from '../types';

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

  // Delete confirmation
  const [confirmDeleteList, setConfirmDeleteList] = useState<ListResponse | null>(null);

  // Edit modal
  const [editList, setEditList] = useState<ListResponse | null>(null);
  const [editName, setEditName] = useState('');
  const [editDisplayImageType, setEditDisplayImageType] = useState<DisplayImageType>('icon');
  const [editIconId, setEditIconId] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const pendingEditFileRef = useRef<File | null>(null);

  // Drag reorder
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [orderedLists, setOrderedLists] = useState<ListResponse[] | null>(null);

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['lists'],
    queryFn: getLists,
  });

  const displayLists = orderedLists ?? lists;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setShowNew(false);
      setName('');
      setCreateDisplayImageType('icon');
      setCreateIconId('');
      setCreateImageUrl('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (listId: string) => deleteList(listId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  });

  const updateListMutation = useMutation({
    mutationFn: async ({ listId, payload }: { listId: string; payload: { name?: string; iconId?: string | null; imageUrl?: string | null } }) => {
      const { updateList } = await import('../api/lists');
      const updated = await updateList(listId, payload);
      const file = pendingEditFileRef.current;
      pendingEditFileRef.current = null;
      if (file) {
        await uploadFile(`/api/upload/list/${listId}`, file);
        queryClient.invalidateQueries({ queryKey: ['lists'] });
        return updated;
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setEditList(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (listIds: string[]) => reorderLists(listIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  });

  function openEditList(list: ListResponse) {
    setEditList(list);
    setEditName(list.name);
    setEditDisplayImageType(list.imageUrl ? 'link' : 'icon');
    setEditIconId(list.iconId ?? '');
    setEditImageUrl(list.imageUrl ?? '');
  }

  function handleEditListSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editList) return;
    const nameVal = editName.trim() || editList.name;
    const iconId = editDisplayImageType === 'icon' ? (editIconId || '') : '';
    const imageUrl = (editDisplayImageType === 'link' || editDisplayImageType === 'web') ? (editImageUrl.trim() || '') : '';
    if (editDisplayImageType === 'device' && pendingEditFileRef.current) {
      updateListMutation.mutate({ listId: editList.id, payload: { name: nameVal } });
      return;
    }
    updateListMutation.mutate({ listId: editList.id, payload: { name: nameVal, iconId, imageUrl } });
  }

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
    setOrderedLists([...lists]);
  }, [lists]);

  const handleDragOver = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
    setOrderedLists((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      setDragIndex(index);
      return updated;
    });
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    if (orderedLists) {
      const ids = orderedLists.map((l) => l.id);
      reorderMutation.mutate(ids);
    }
    setDragIndex(null);
    setOverIndex(null);
    setOrderedLists(null);
  }, [orderedLists, reorderMutation]);

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
            {displayLists.map((list, index) => (
              <li
                key={list.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  handleDragStart(index);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleDragOver(index);
                }}
                onDragEnd={handleDragEnd}
                style={{
                  opacity: dragIndex === index ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                  cursor: 'grab',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 16,
                    background: overIndex === index ? '#e3f2fd' : '#fff',
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    gap: 12,
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Drag handle */}
                  <span
                    style={{
                      color: '#bbb',
                      fontSize: 18,
                      cursor: 'grab',
                      userSelect: 'none',
                      touchAction: 'none',
                      flexShrink: 0,
                    }}
                    title="גרור לשינוי סדר"
                  >
                    ⠿
                  </span>

                  {/* List name - clickable link */}
                  <Link
                    to={`/lists/${list.id}`}
                    style={{
                      flex: 1,
                      color: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      textDecoration: 'none',
                    }}
                    onClick={(e) => {
                      // Prevent navigation during drag
                      if (dragIndex !== null) e.preventDefault();
                    }}
                  >
                    <CategoryIcon iconId={list.iconId} imageUrl={list.imageUrl} size={28} />
                    <span style={{ fontWeight: 500 }}>{list.name}</span>
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
                  </Link>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/lists/${list.id}/share`);
                      }}
                      style={{
                        padding: '6px 10px',
                        background: '#e3f2fd',
                        color: '#1565c0',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                      title="שיתוף"
                    >
                      שיתוף
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditList(list);
                      }}
                      style={{
                        padding: '6px 10px',
                        background: '#fff3e0',
                        color: '#e65100',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                      title="ערוך"
                    >
                      ערוך
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmDeleteList(list);
                      }}
                      style={{
                        padding: '6px 10px',
                        background: '#ffebee',
                        color: '#c62828',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                      title="מחק"
                    >
                      מחק
                    </button>
                  </div>
                </div>
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
                  const iconId = createDisplayImageType === 'icon' ? createIconId || '' : '';
                  const imageUrl = createDisplayImageType === 'link' || createDisplayImageType === 'web' ? createImageUrl || '' : '';
                  createMutation.mutate({
                    name: name || 'רשימה חדשה',
                    iconId: iconId || undefined,
                    imageUrl: imageUrl || undefined,
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

        {/* Delete confirmation dialog */}
        {confirmDeleteList && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
              padding: 24,
            }}
            onClick={() => setConfirmDeleteList(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 24,
                maxWidth: 360,
                width: '100%',
              }}
            >
              <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>מחיקת רשימה</h3>
              <p style={{ margin: '0 0 20px', fontSize: 15, color: '#333', lineHeight: 1.6 }}>
                אתה באמת מעוניין למחוק את הרשימה <strong>{confirmDeleteList.name}</strong>?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    deleteMutation.mutate(confirmDeleteList.id);
                    setConfirmDeleteList(null);
                  }}
                  disabled={deleteMutation.isPending}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#c62828',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                  }}
                >
                  {deleteMutation.isPending ? 'מוחק...' : 'כן, מחק'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteList(null)}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#eee',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                  }}
                >
                  לא
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit list modal */}
        {editList && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
              padding: 24,
            }}
            onClick={() => setEditList(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 24,
                maxWidth: 400,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <h3 style={{ margin: '0 0 16px' }}>ערוך רשימה</h3>
              <form onSubmit={handleEditListSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>שם הרשימה</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="שם הרשימה"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                  />
                </div>
                <DisplayImageForm
                  label="אייקון לרשימה"
                  displayType={editDisplayImageType}
                  iconId={editIconId}
                  imageUrl={editImageUrl}
                  onDisplayTypeChange={setEditDisplayImageType}
                  onIconIdChange={setEditIconId}
                  onImageUrlChange={setEditImageUrl}
                  fileInputRef={editFileInputRef}
                />
                {editDisplayImageType === 'device' && (
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>בחר קובץ מהמכשיר ואז שמור</p>
                )}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) pendingEditFileRef.current = file;
                    e.target.value = '';
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    disabled={updateListMutation.isPending}
                    style={{ flex: 1, padding: 12, background: 'var(--color-primary)', color: '#fff', fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' }}
                  >
                    {updateListMutation.isPending ? 'שומר...' : 'שמור'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditList(null)}
                    style={{ padding: 12, background: '#eee', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

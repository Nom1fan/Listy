import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLists, createList, deleteList, reorderLists } from '../api/lists';
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '../api/workspaces';
import { uploadFile } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { DisplayImageForm, type DisplayImageType } from '../components/DisplayImageForm';
import { getUserDisplayLabel } from '../utils/user';
import { WorkspaceTabs, type TabKey } from '../components/WorkspaceTabs';
import { Categories } from './Categories';
import type { ListResponse } from '../types';

export function Lists() {
  const [activeTab, setActiveTab] = useState<TabKey>('lists');
  const [name, setName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const [createDisplayImageType, setCreateDisplayImageType] = useState<DisplayImageType>('icon');
  const [createIconId, setCreateIconId] = useState('');
  const [createImageUrl, setCreateImageUrl] = useState('');
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const pendingCreateFileRef = useRef<File | null>(null);
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const clearActiveWorkspace = useWorkspaceStore((s) => s.clearActiveWorkspace);

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  useEffect(() => {
    if (workspaces.length > 0 && (!activeWorkspaceId || !workspaces.some((w) => w.id === activeWorkspaceId))) {
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspace]);

  useEffect(() => {
    setOrderedLists(null);
  }, [activeWorkspaceId]);

  // Kebab menus
  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  const [listMenuOpenId, setListMenuOpenId] = useState<string | null>(null);

  // Workspace CRUD state
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState(false);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [confirmDeleteWorkspace, setConfirmDeleteWorkspace] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? null;

  function showToast(msg: string, isError = false) {
    setToast({ message: msg, isError });
    setTimeout(() => setToast(null), isError ? 5000 : 4000);
  }

  const createWorkspaceMutation = useMutation({
    mutationFn: (body: { name: string }) => createWorkspace(body),
    onSuccess: (ws) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setActiveWorkspace(ws.id);
      setShowCreateWorkspace(false);
      setNewWorkspaceName('');
    },
    onError: (err: Error) => {
      showToast(err.message || 'שגיאה ביצירת מרחב עבודה', true);
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateWorkspace(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setEditingWorkspace(false);
      setEditWorkspaceName('');
    },
    onError: (err: Error) => {
      showToast(err.message || 'שגיאה בעדכון מרחב עבודה', true);
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setConfirmDeleteWorkspace(false);
      // Switch to another workspace if available, otherwise clear
      clearActiveWorkspace();
    },
    onError: (err: Error) => {
      showToast(err.message || 'שגיאה במחיקת מרחב עבודה', true);
    },
  });

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
    queryKey: ['lists', activeWorkspaceId],
    queryFn: () => getLists(activeWorkspaceId || undefined),
  });

  const displayLists = orderedLists ?? lists;
  const workspaceById = Object.fromEntries(workspaces.map((w) => [w.id, w]));

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; workspaceId: string; iconId?: string | null; imageUrl?: string | null }) => {
      const list = await createList(payload);
      const file = pendingCreateFileRef.current;
      pendingCreateFileRef.current = null;
      if (file && list?.id) {
        await uploadFile(`/api/upload/list/${list.id}`, file);
        queryClient.invalidateQueries({ queryKey: ['lists', activeWorkspaceId] });
        const updated = await getLists(activeWorkspaceId || undefined);
        const created = updated.find((l) => l.id === list.id);
        if (created) return created;
      }
      return list;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', activeWorkspaceId] });
      setShowNew(false);
      setName('');
      setCreateDisplayImageType('icon');
      setCreateIconId('');
      setCreateImageUrl('');
    },
    onError: (err: Error) => {
      showToast(err.message || 'שגיאה ביצירת הרשימה', true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (listId: string) => deleteList(listId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists', activeWorkspaceId] }),
    onError: (err: Error) => {
      showToast(err.message || 'שגיאה במחיקת הרשימה', true);
    },
  });

  const updateListMutation = useMutation({
    mutationFn: async ({ listId, payload }: { listId: string; payload: { name?: string; iconId?: string | null; imageUrl?: string | null } }) => {
      const { updateList } = await import('../api/lists');
      const updated = await updateList(listId, payload);
      const file = pendingEditFileRef.current;
      pendingEditFileRef.current = null;
      if (file) {
        await uploadFile(`/api/upload/list/${listId}`, file);
        queryClient.invalidateQueries({ queryKey: ['lists', activeWorkspaceId] });
        return updated;
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', activeWorkspaceId] });
      setEditList(null);
    },
    onError: (err: Error) => {
      showToast(err.message || 'שגיאה בעדכון הרשימה', true);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (listIds: string[]) => reorderLists(listIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists', activeWorkspaceId] }),
    onError: (err: Error) => {
      showToast(err.message || 'שגיאה בשינוי הסדר', true);
    },
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
      {toast && (
        <div
          onClick={() => setToast(null)}
          style={{
            position: 'fixed',
            bottom: 24,
            left: 16,
            right: 16,
            padding: 14,
            background: toast.isError ? 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)' : 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
            color: '#fff',
            borderRadius: 12,
            textAlign: 'center',
            zIndex: 2000,
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {toast.isError ? '✕ ' : '✓ '}{toast.message}
        </div>
      )}
      <AppBar
        title={
          <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
            {user?.profileImageUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <img
                  src={user.profileImageUrl}
                  alt=""
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.5)',
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>
                  {getUserDisplayLabel(user)}
                </span>
              </div>
            ) : (
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                {getUserDisplayLabel(user) || 'הרשימות שלי'}
              </h1>
            )}
          </Link>
        }
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {workspaces.length > 0 && (
              <select
                id="workspace-select"
                value={activeWorkspaceId ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) setActiveWorkspace(id);
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: 15,
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.15)',
                  color: 'inherit',
                  cursor: 'pointer',
                  maxWidth: 180,
                }}
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id} style={{ color: '#1a1a1a' }}>
                    {w.name}{w.memberCount > 1 ? ` 👥 (${w.memberCount})` : ''}
                  </option>
                ))}
              </select>
            )}
            {/* Kebab menu for workspace */}
            {!editingWorkspace && !showCreateWorkspace && (
              <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setWsMenuOpen((v) => !v)}
                  aria-label="תפריט מרחב עבודה"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 20,
                    padding: '4px 8px',
                    lineHeight: 1,
                    color: 'inherit',
                    borderRadius: 6,
                  }}
                >
                  &#8942;
                </button>
                {wsMenuOpen && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                      onClick={() => setWsMenuOpen(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 4,
                        background: '#fff',
                        borderRadius: 10,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        minWidth: 160,
                        overflow: 'hidden',
                      }}
                    >
                      {activeWorkspace && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setWsMenuOpen(false);
                              setEditingWorkspace(true);
                              setEditWorkspaceName(activeWorkspace.name);
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '10px 16px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'right',
                              fontSize: 14,
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                          >
                            שנה שם
                          </button>
                          <button
                            type="button"
                            onClick={() => { setWsMenuOpen(false); navigate(`/workspaces/${activeWorkspaceId}/share`); }}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '10px 16px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'right',
                              fontSize: 14,
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                          >
                            שיתוף
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => { setWsMenuOpen(false); setShowCreateWorkspace(true); }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'right',
                          fontSize: 14,
                          cursor: 'pointer',
                          borderBottom: activeWorkspace?.role === 'owner' && workspaces.length > 1 ? '1px solid #f0f0f0' : 'none',
                        }}
                      >
                        + מרחב עבודה חדש
                      </button>
                      {activeWorkspace?.role === 'owner' && workspaces.length > 1 && (
                        <button
                          type="button"
                          onClick={() => { setWsMenuOpen(false); setConfirmDeleteWorkspace(true); }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 16px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'right',
                            fontSize: 14,
                            cursor: 'pointer',
                            color: '#c00',
                          }}
                        >
                          מחק מרחב עבודה
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <button onClick={logout} style={{ background: 'transparent', color: 'inherit', fontSize: 14 }}>
              יציאה
            </button>
          </div>
        }
      />
      <main style={{ padding: 0, direction: 'rtl' }}>
        {/* Workspace management forms (inline rename / create) */}
        {editingWorkspace && activeWorkspace && (
          <div style={{ padding: '12px 16px', background: '#f8f9fa' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editWorkspaceName.trim() && activeWorkspaceId) {
                  updateWorkspaceMutation.mutate({ id: activeWorkspaceId, name: editWorkspaceName.trim() });
                }
              }}
              style={{ display: 'flex', gap: 8, alignItems: 'center' }}
            >
              <input
                type="text"
                value={editWorkspaceName}
                onChange={(e) => setEditWorkspaceName(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: 14,
                }}
              />
              <button
                type="submit"
                disabled={!editWorkspaceName.trim() || updateWorkspaceMutation.isPending}
                style={{
                  padding: '8px 14px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {updateWorkspaceMutation.isPending ? 'שומר...' : 'שמור'}
              </button>
              <button
                type="button"
                onClick={() => { setEditingWorkspace(false); setEditWorkspaceName(''); }}
                style={{
                  padding: '8px 14px',
                  background: '#eee',
                  borderRadius: 8,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ביטול
              </button>
            </form>
          </div>
        )}

        {showCreateWorkspace && (
          <div style={{ padding: '12px 16px', background: '#f8f9fa' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newWorkspaceName.trim()) {
                  createWorkspaceMutation.mutate({ name: newWorkspaceName.trim() });
                }
              }}
              style={{ display: 'flex', gap: 8, alignItems: 'center' }}
            >
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="שם מרחב עבודה חדש"
                autoFocus
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: 14,
                }}
              />
              <button
                type="submit"
                disabled={!newWorkspaceName.trim() || createWorkspaceMutation.isPending}
                style={{
                  padding: '8px 14px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {createWorkspaceMutation.isPending ? 'יוצר...' : 'צור'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreateWorkspace(false); setNewWorkspaceName(''); }}
                style={{
                  padding: '8px 14px',
                  background: '#eee',
                  borderRadius: 8,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ביטול
              </button>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div style={{ padding: '0 16px', background: '#f8f9fa' }}>
          <WorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab content */}
        <div style={{ padding: 16 }}>
        {activeTab === 'lists' ? (
          <>
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
                    {workspaceById[list.workspaceId]?.memberCount > 1 && (
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

                  {/* Kebab menu */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setListMenuOpenId((prev) => prev === list.id ? null : list.id);
                      }}
                      aria-label="תפריט רשימה"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 20,
                        padding: '4px 8px',
                        lineHeight: 1,
                        color: '#555',
                        borderRadius: 6,
                      }}
                    >
                      &#8942;
                    </button>
                    {listMenuOpenId === list.id && (
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setListMenuOpenId(null); }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: 4,
                            background: '#fff',
                            borderRadius: 10,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: 140,
                            overflow: 'hidden',
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setListMenuOpenId(null);
                              openEditList(list);
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '10px 16px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'right',
                              fontSize: 14,
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                          >
                            ערוך
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setListMenuOpenId(null);
                              navigate(`/workspaces/${list.workspaceId}/share`);
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '10px 16px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'right',
                              fontSize: 14,
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                          >
                            שיתוף
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setListMenuOpenId(null);
                              setConfirmDeleteList(list);
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '10px 16px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'right',
                              fontSize: 14,
                              cursor: 'pointer',
                              color: '#c00',
                            }}
                          >
                            מחק
                          </button>
                        </div>
                      </>
                    )}
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
                  if (!activeWorkspaceId) return;
                  const iconId = createDisplayImageType === 'icon' ? createIconId || '' : '';
                  const imageUrl = createDisplayImageType === 'link' || createDisplayImageType === 'web' ? createImageUrl || '' : '';
                  createMutation.mutate({
                    name: name || 'רשימה חדשה',
                    workspaceId: activeWorkspaceId,
                    iconId: iconId || undefined,
                    imageUrl: imageUrl || undefined,
                  });
                }}
                disabled={createMutation.isPending || !activeWorkspaceId}
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
            disabled={!activeWorkspaceId}
            style={{
              marginTop: 24,
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: activeWorkspaceId ? 'var(--color-primary)' : '#ccc',
              color: '#fff',
              fontSize: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: activeWorkspaceId ? 'pointer' : 'not-allowed',
            }}
            aria-label="הוסף רשימה"
          >
            +
          </button>
        )}
          </>
        ) : (
          <Categories />
        )}
        </div>

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
        {/* Delete workspace confirmation */}
        {confirmDeleteWorkspace && activeWorkspace && (
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
            onClick={() => setConfirmDeleteWorkspace(false)}
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
              <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>מחיקת מרחב עבודה</h3>
              <p style={{ margin: '0 0 8px', fontSize: 15, color: '#333', lineHeight: 1.6 }}>
                אתה באמת מעוניין למחוק את מרחב העבודה <strong>{activeWorkspace.name}</strong>?
              </p>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#c00', lineHeight: 1.5 }}>
                כל הרשימות והקטגוריות במרחב זה יימחקו לצמיתות.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (activeWorkspaceId) deleteWorkspaceMutation.mutate(activeWorkspaceId);
                  }}
                  disabled={deleteWorkspaceMutation.isPending}
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
                  {deleteWorkspaceMutation.isPending ? 'מוחק...' : 'כן, מחק'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteWorkspace(false)}
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
      </main>
    </>
  );
}

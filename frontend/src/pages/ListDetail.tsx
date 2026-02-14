import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getList,
  getListItems,
  addListItem,
  updateListItem,
  removeListItem,
  updateList,
  deleteList,
} from '../api/lists';
import { updateProduct } from '../api/products';
import { uploadFile } from '../api/client';
import { useListEvents } from '../hooks/useListEvents';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { DisplayImageForm, type DisplayImageType } from '../components/DisplayImageForm';
import type { ListItemResponse, ListEvent } from '../types';

function getImageUrl(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_BASE || '';
  return base + url;
}

export function ListDetail() {
  const { listId } = useParams<{ listId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editImageItem, setEditImageItem] = useState<ListItemResponse | null>(null);
  const [itemDisplayImageType, setItemDisplayImageType] = useState<DisplayImageType>('icon');
  const [itemIconId, setItemIconId] = useState('');
  const [itemImageUrlInput, setItemImageUrlInput] = useState('');
  const itemFileInputRef = useRef<HTMLInputElement>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);
  const [quickAddUnit, setQuickAddUnit] = useState('יחידה');
  const [quickAddNote, setQuickAddNote] = useState('');
  const [quickAddImageType, setQuickAddImageType] = useState<DisplayImageType>('icon');
  const [quickAddIconId, setQuickAddIconId] = useState('');
  const [quickAddImageUrl, setQuickAddImageUrl] = useState('');
  const [quickAddImageFile, setQuickAddImageFile] = useState<File | null>(null);
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const quickAddFileInputRef = useRef<HTMLInputElement>(null);
  const [listDetailMenuOpen, setListDetailMenuOpen] = useState(false);
  const [editListOpen, setEditListOpen] = useState(false);
  const [editListName, setEditListName] = useState('');
  const [editListDisplayImageType, setEditListDisplayImageType] = useState<DisplayImageType>('icon');
  const [editListIconId, setEditListIconId] = useState('');
  const [editListImageUrl, setEditListImageUrl] = useState('');
  const editListFileInputRef = useRef<HTMLInputElement>(null);
  const pendingListImageFileRef = useRef<File | null>(null);

  const { data: list } = useQuery({
    queryKey: ['list', listId],
    queryFn: () => getList(listId!),
    enabled: !!listId,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['listItems', listId],
    queryFn: () => getListItems(listId!),
    enabled: !!listId,
  });

  useListEvents(listId ?? null, useCallback((event: ListEvent) => {
    queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
    const who = event.userDisplayName || 'מישהו';
    const what = event.itemDisplayName + ' ' + event.quantityUnit;
    if (event.type === 'ADDED') setNotification(`${who} הוסיף: ${what}`);
    if (event.type === 'REMOVED') setNotification(`${who} הסיר: ${what}`);
    if (event.type === 'UPDATED') setNotification(`${who} עדכן: ${what}`);
    setTimeout(() => setNotification(null), 4000);
  }, [listId, queryClient]));

  const updateMutation = useMutation({
    mutationFn: ({
      itemId,
      body,
    }: {
      itemId: string;
      body: { crossedOff?: boolean; quantity?: number; unit?: string; note?: string; itemImageUrl?: string | null; iconId?: string | null };
    }) => updateListItem(listId!, itemId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listItems', listId] }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, imageUrl, iconId }: { productId: string; imageUrl: string | null; iconId: string }) =>
      updateProduct(productId, { imageUrl, iconId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeListItem(listId!, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listItems', listId] }),
  });

  const addItemMutation = useMutation({
    mutationFn: (body: Parameters<typeof addListItem>[1]) => addListItem(listId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
      closeQuickAddModal();
    },
  });

  const updateListMutation = useMutation({
    mutationFn: async (payload: { name?: string; iconId?: string | null; imageUrl?: string | null }) => {
      const updated = await updateList(listId!, payload);
      const file = pendingListImageFileRef.current;
      pendingListImageFileRef.current = null;
      if (file && listId) {
        await uploadFile(`/api/upload/list/${listId}`, file);
        queryClient.invalidateQueries({ queryKey: ['list', listId] });
        queryClient.invalidateQueries({ queryKey: ['lists'] });
        return (await getList(listId)) ?? updated;
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list', listId] });
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setEditListOpen(false);
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: () => deleteList(listId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      navigate('/lists');
    },
  });

  function closeQuickAddModal() {
    setQuickAddOpen(false);
    setQuickAddName('');
    setQuickAddQuantity(1);
    setQuickAddUnit('יחידה');
    setQuickAddNote('');
    setQuickAddImageType('icon');
    setQuickAddIconId('');
    setQuickAddImageUrl('');
    setQuickAddImageFile(null);
    setQuickAddSubmitting(false);
  }

  async function handleQuickAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = quickAddName.trim();
    if (!name || addItemMutation.isPending || quickAddSubmitting || !listId) return;

    const body: Parameters<typeof addListItem>[1] = {
      customNameHe: name,
      quantity: quickAddQuantity,
      unit: quickAddUnit || 'יחידה',
      note: quickAddNote.trim() || undefined,
    };
    if (quickAddImageType === 'icon' && quickAddIconId) {
      body.iconId = quickAddIconId;
    }
    if ((quickAddImageType === 'link' || quickAddImageType === 'web') && quickAddImageUrl.trim()) {
      body.itemImageUrl = quickAddImageUrl.trim();
    }

    if (quickAddImageType === 'device' && quickAddImageFile) {
      setQuickAddSubmitting(true);
      try {
        const created = await addListItem(listId, body);
        await uploadFile(`/api/upload/lists/${listId}/items/${created.id}`, quickAddImageFile);
        queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
        closeQuickAddModal();
      } catch (err) {
        console.error(err);
      } finally {
        setQuickAddSubmitting(false);
      }
      return;
    }

    addItemMutation.mutate(body);
  }

  function handleQuickAddImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    setQuickAddImageFile(file || null);
    if (file) setQuickAddImageUrl('');
  }

  const grouped = items.reduce<Record<string, ListItemResponse[]>>((acc, item) => {
    const key = item.categoryNameHe || 'אחר';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => (a === 'אחר' ? 1 : b === 'אחר' ? -1 : a.localeCompare(b)));

  function getCategoryIconId(cat: string): string | null {
    const first = grouped[cat]?.[0];
    return first ? first.categoryIconId ?? null : null;
  }

  function openEditItemImage(item: ListItemResponse, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditImageItem(item);
    setItemDisplayImageType(item.itemImageUrl ? 'link' : 'icon');
    setItemIconId(item.iconId ?? item.categoryIconId ?? '');
    setItemImageUrlInput(item.itemImageUrl || '');
  }

  function closeEditItemImage() {
    setEditImageItem(null);
    setItemDisplayImageType('icon');
    setItemIconId('');
    setItemImageUrlInput('');
  }

  function handleItemImageSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editImageItem || !listId) return;
    const url = itemDisplayImageType === 'icon' ? '' : (itemImageUrlInput.trim() || '');
    updateMutation.mutate({ itemId: editImageItem.id, body: { itemImageUrl: url } });
    // Update the product's icon (not the category) when editing icon from list
    const productId = editImageItem.productId;
    if (productId && productId !== editImageItem.categoryId && itemDisplayImageType === 'icon') {
      updateProductMutation.mutate({
        productId,
        imageUrl: '',
        iconId: itemIconId || '',
      });
    }
    closeEditItemImage();
  }

  async function handleItemImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editImageItem || !listId) return;
    e.target.value = '';
    try {
      const { url } = await uploadFile(`/api/upload/lists/${listId}/items/${editImageItem.id}`, file);
      setItemImageUrlInput(url);
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
    } catch (err) {
      console.error(err);
    }
  }

  function openEditList() {
    if (!list) return;
    setEditListName(list.name);
    setEditListDisplayImageType(list.imageUrl ? 'link' : 'icon');
    setEditListIconId(list.iconId ?? '');
    setEditListImageUrl(list.imageUrl ?? '');
    setEditListOpen(true);
  }

  function handleEditListSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listId) return;
    const name = editListName.trim() || list?.name;
    const iconId = editListDisplayImageType === 'icon' ? (editListIconId || '') : '';
    const imageUrl = editListDisplayImageType === 'link' || editListDisplayImageType === 'web' ? (editListImageUrl.trim() || '') : '';
    if (editListDisplayImageType === 'device' && pendingListImageFileRef.current) {
      updateListMutation.mutate({ name });
      return;
    }
    updateListMutation.mutate({ name, iconId, imageUrl });
  }

  return (
    <>
      <AppBar
        title={list?.name || 'רשימה'}
        titleRight={list ? <CategoryIcon iconId={list.iconId} imageUrl={list.imageUrl} size={28} /> : null}
        backTo="/lists"
        right={
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setListDetailMenuOpen((v) => !v)}
              aria-label="תפריט רשימה"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 22,
                padding: '4px 8px',
                lineHeight: 1,
                color: '#fff',
                borderRadius: 6,
              }}
            >
              &#8942;
            </button>
            {listDetailMenuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                  onClick={() => setListDetailMenuOpen(false)}
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
                    onClick={() => { setListDetailMenuOpen(false); openEditList(); }}
                    style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#333' }}
                  >
                    ערוך
                  </button>
                  {list?.workspaceId && (
                    <button
                      type="button"
                      onClick={() => { setListDetailMenuOpen(false); navigate(`/workspaces/${list.workspaceId}/share`); }}
                      style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#333' }}
                    >
                      שיתוף
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setListDetailMenuOpen(false); setConfirmDelete(true); }}
                    style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', fontSize: 14, cursor: 'pointer', color: '#c00' }}
                  >
                    מחק
                  </button>
                </div>
              </>
            )}
          </div>
        }
      />
      <main style={{ padding: 16 }}>
        {notification && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              left: 16,
              right: 16,
              padding: 12,
              background: '#333',
              color: '#fff',
              borderRadius: 8,
              textAlign: 'center',
              zIndex: 1000,
            }}
          >
            {notification}
          </div>
        )}

        {!isLoading && (
          <>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setQuickAddOpen(true)}
                style={{
                  padding: '12px 20px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>➕</span>
                <span>הוסף פריט חופשי</span>
              </button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <Link
                to={`/lists/${listId}/bank`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                  borderRadius: 12,
                  color: '#1b5e20',
                  textDecoration: 'none',
                  fontWeight: 600,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <span style={{ fontSize: 28 }}>🛒</span>
                <span>הוסף מקטגוריות</span>
              </Link>
            </div>
          </>
        )}

        {isLoading ? (
          <p>טוען...</p>
        ) : (
          categories.map((cat) => (
            <section key={cat} style={{ marginBottom: 24 }}>
              <div
                style={{
                  background: 'var(--color-bar)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CategoryIcon iconId={getCategoryIconId(cat)} imageUrl={null} size={24} />
                <span style={{ fontWeight: 600 }}>{cat}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[cat].map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      textDecoration: item.crossedOff ? 'line-through' : 'none',
                      color: item.crossedOff ? 'var(--color-strike)' : 'inherit',
                    }}
                  >
                    {(item.itemImageUrl || item.productImageUrl) ? (
                      <img
                        src={getImageUrl(item.itemImageUrl || item.productImageUrl)}
                        alt=""
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                      />
                    ) : (
                      <CategoryIcon
                        iconId={item.iconId ?? item.categoryIconId ?? null}
                        imageUrl={null}
                        size={48}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div>{item.displayName}</div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        {item.quantity} {item.unit}
                        {item.note && ` · ${item.note}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={(e) => openEditItemImage(item, e)}
                        style={{ padding: 6, background: 'transparent', color: '#666' }}
                        aria-label="שנה תמונה"
                        title="שנה תמונה"
                      >
                        🖼
                      </button>
                      <button
                        onClick={() =>
                          updateMutation.mutate({
                            itemId: item.id,
                            body: { crossedOff: !item.crossedOff },
                          })
                        }
                        style={{
                          padding: '6px 10px',
                          background: item.crossedOff ? '#e0e0e0' : 'var(--color-primary)',
                          color: item.crossedOff ? '#666' : '#fff',
                          fontSize: 12,
                        }}
                      >
                        {item.crossedOff ? 'בטל סימון' : 'סימן'}
                      </button>
                      <button
                        onClick={() => removeMutation.mutate(item.id)}
                        style={{ padding: 6, background: 'transparent', color: 'var(--color-strike)' }}
                        aria-label="הסר"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        {quickAddOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 24,
            }}
            onClick={closeQuickAddModal}
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
              <h3 style={{ margin: '0 0 16px' }}>הוסף פריט לרשימה</h3>
              <form onSubmit={handleQuickAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>שם הפריט</label>
                  <input
                    type="text"
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    placeholder="למשל: חלב, לחם"
                    required
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 80px' }}>
                    <label style={{ display: 'block', marginBottom: 4 }}>כמות</label>
                    <input
                      type="number"
                      min={0.001}
                      step="any"
                      value={quickAddQuantity}
                      onChange={(e) => setQuickAddQuantity(parseFloat(e.target.value) || 1)}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={{ display: 'block', marginBottom: 4 }}>יחידה</label>
                    <input
                      type="text"
                      value={quickAddUnit}
                      onChange={(e) => setQuickAddUnit(e.target.value)}
                      list="quick-add-units"
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                    />
                    <datalist id="quick-add-units">
                      <option value="יחידה" />
                      <option value={'ק"ג'} />
                      <option value="גרם" />
                      <option value="ליטר" />
                      <option value={'מ"ל'} />
                      <option value="חבילה" />
                      <option value="קופסה" />
                    </datalist>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>הערה</label>
                  <textarea
                    value={quickAddNote}
                    onChange={(e) => setQuickAddNote(e.target.value)}
                    rows={2}
                    placeholder="אופציונלי"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', resize: 'vertical' }}
                  />
                </div>
                <DisplayImageForm
                  label="תמונה / אייקון"
                  displayType={quickAddImageType}
                  iconId={quickAddIconId}
                  imageUrl={quickAddImageUrl}
                  onDisplayTypeChange={(t) => { setQuickAddImageType(t); setQuickAddImageFile(null); }}
                  onIconIdChange={setQuickAddIconId}
                  onImageUrlChange={setQuickAddImageUrl}
                  fileInputRef={quickAddFileInputRef}
                />
                {quickAddImageType === 'device' && quickAddImageFile && (
                  <p style={{ margin: 0, fontSize: 13, color: '#2e7d32' }}>נבחר קובץ: {quickAddImageFile.name}</p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    disabled={!quickAddName.trim() || addItemMutation.isPending || quickAddSubmitting}
                    style={{ flex: 1, padding: 12, background: 'var(--color-primary)', color: '#fff', fontWeight: 600, borderRadius: 8 }}
                  >
                    {addItemMutation.isPending || quickAddSubmitting ? 'מוסיף...' : 'הוסף לרשימה'}
                  </button>
                  <button
                    type="button"
                    onClick={closeQuickAddModal}
                    style={{ padding: 12, background: '#eee', borderRadius: 8 }}
                  >
                    ביטול
                  </button>
                </div>
              </form>
              <input
                ref={quickAddFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleQuickAddImageFile}
              />
            </div>
          </div>
        )}

        {editImageItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 24,
            }}
            onClick={closeEditItemImage}
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
              <h3 style={{ margin: '0 0 16px' }}>תמונת פריט: {editImageItem.displayName}</h3>
              <form onSubmit={handleItemImageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <DisplayImageForm
                  displayType={itemDisplayImageType}
                  iconId={itemIconId}
                  imageUrl={itemImageUrlInput}
                  onDisplayTypeChange={setItemDisplayImageType}
                  onIconIdChange={setItemIconId}
                  onImageUrlChange={setItemImageUrlInput}
                  fileInputRef={itemFileInputRef}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    style={{ flex: 1, padding: 12, background: 'var(--color-primary)', color: '#fff', fontWeight: 600 }}
                  >
                    {updateMutation.isPending ? 'שומר...' : 'שמור'}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditItemImage}
                    style={{ padding: 12, background: '#eee' }}
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <input
          ref={itemFileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleItemImageFile}
        />

        {/* Delete confirmation dialog */}
        {confirmDelete && list && (
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
            onClick={() => setConfirmDelete(false)}
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
                אתה באמת מעוניין למחוק את הרשימה <strong>{list.name}</strong>?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    deleteListMutation.mutate();
                    setConfirmDelete(false);
                  }}
                  disabled={deleteListMutation.isPending}
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
                  {deleteListMutation.isPending ? 'מוחק...' : 'כן, מחק'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
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

        {editListOpen && list && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 24,
            }}
            onClick={() => setEditListOpen(false)}
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
              <h3 style={{ margin: '0 0 16px' }}>ערוך רשימה ואייקון</h3>
              <form onSubmit={handleEditListSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>שם הרשימה</label>
                  <input
                    type="text"
                    value={editListName}
                    onChange={(e) => setEditListName(e.target.value)}
                    placeholder="שם הרשימה"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                  />
                </div>
                <DisplayImageForm
                  label="אייקון לרשימה"
                  displayType={editListDisplayImageType}
                  iconId={editListIconId}
                  imageUrl={editListImageUrl}
                  onDisplayTypeChange={setEditListDisplayImageType}
                  onIconIdChange={setEditListIconId}
                  onImageUrlChange={setEditListImageUrl}
                  fileInputRef={editListFileInputRef}
                />
                {editListDisplayImageType === 'device' && (
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>בחר קובץ מהמכשיר ואז שמור</p>
                )}
                <input
                  ref={editListFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) pendingListImageFileRef.current = file;
                    e.target.value = '';
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    disabled={updateListMutation.isPending}
                    style={{ flex: 1, padding: 12, background: 'var(--color-primary)', color: '#fff', fontWeight: 600, borderRadius: 8 }}
                  >
                    {updateListMutation.isPending ? 'שומר...' : 'שמור'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditListOpen(false)}
                    style={{ padding: 12, background: '#eee', borderRadius: 8 }}
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

import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getList,
  getListItems,
  addListItem,
  updateListItem,
  removeListItem,
  updateList,
  deleteList,
  reorderListItems,
} from '../api/lists';
import { getCategories, getProducts, updateProduct } from '../api/products';
import { uploadFile } from '../api/client';
import { useListEvents } from '../hooks/useListEvents';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { DisplayImageForm, type DisplayImageType } from '../components/DisplayImageForm';
import { ViewModeToggle, useViewMode } from '../components/ViewModeToggle';
import type { ListItemResponse, ListEvent } from '../types';

function SortableItem({ id, children }: {
  id: string;
  children: (props: { handleProps: React.HTMLAttributes<HTMLElement> }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {children({ handleProps: { ...attributes, ...listeners } })}
    </div>
  );
}

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
  const [notificationIsError, setNotificationIsError] = useState(false);
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
  const [quickAddCategoryId, setQuickAddCategoryId] = useState('');
  const quickAddFileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useViewMode();
  const [itemMenuOpenId, setItemMenuOpenId] = useState<string | null>(null);
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

  const { data: workspaceCategories = [] } = useQuery({
    queryKey: ['categories', list?.workspaceId],
    queryFn: () => getCategories(list!.workspaceId),
    enabled: !!list?.workspaceId,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
    enabled: !!list?.workspaceId,
  });

  const hasProductsInCategories = allProducts.length > 0;

  function showNotification(msg: string, isError = false) {
    setNotification(msg);
    setNotificationIsError(isError);
    setTimeout(() => setNotification(null), isError ? 5000 : 4000);
  }

  useListEvents(listId ?? null, useCallback((event: ListEvent) => {
    queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
    const who = event.userDisplayName || 'מישהו';
    const what = event.itemDisplayName + ' ' + event.quantityUnit;
    if (event.type === 'ADDED') showNotification(`${who} הוסיף: ${what}`);
    if (event.type === 'REMOVED') showNotification(`${who} הסיר: ${what}`);
    if (event.type === 'UPDATED') showNotification(`${who} עדכן: ${what}`);
  }, [listId, queryClient]));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const reorderMutation = useMutation({
    mutationFn: (itemIds: string[]) => reorderListItems(listId!, itemIds),
    onError: () => queryClient.invalidateQueries({ queryKey: ['listItems', listId] }),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find which category the dragged item is in
    let targetCat = '';
    for (const cat of categories) {
      if (grouped[cat].some((i) => i.id === active.id)) {
        targetCat = cat;
        break;
      }
    }

    const catItems = grouped[targetCat];
    const oldIndex = catItems.findIndex((i) => i.id === active.id);
    const newIndex = catItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedCatItems = arrayMove(catItems, oldIndex, newIndex);

    // Build full item order across all categories
    const newItems = categories.flatMap((cat) =>
      cat === targetCat ? reorderedCatItems : grouped[cat]
    );

    // Optimistic update
    queryClient.setQueryData(['listItems', listId], newItems);

    // Persist to server
    reorderMutation.mutate(newItems.map((i) => i.id));
  }

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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeQuickAddModal();
    },
    onError: (err: Error) => {
      showNotification(err.message || 'שגיאה בהוספת הפריט', true);
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
    setQuickAddCategoryId('');
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
      categoryId: quickAddCategoryId || undefined,
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
        const { url } = await uploadFile(`/api/upload/lists/${listId}/items/${created.id}`, quickAddImageFile);
        // Also set the image on the auto-created product so it shows in Categories
        if (created.productId && url) {
          await updateProduct(created.productId, { imageUrl: url });
        }
        queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        closeQuickAddModal();
      } catch (err) {
        showNotification(err instanceof Error ? err.message : 'שגיאה בהוספת הפריט', true);
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

  function getCategoryImageUrl(cat: string): string | null {
    const first = grouped[cat]?.[0];
    if (!first?.categoryId) return null;
    const category = workspaceCategories.find((c) => c.id === first.categoryId);
    return category?.imageUrl ?? null;
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
            onClick={() => setNotification(null)}
            style={{
              position: 'fixed',
              bottom: 24,
              left: 16,
              right: 16,
              padding: '14px 40px 14px 14px',
              background: notificationIsError
                ? 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)'
                : '#333',
              color: '#fff',
              borderRadius: 12,
              textAlign: 'center',
              zIndex: 1100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {notification}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setNotification(null); }}
              aria-label="סגור"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: 40,
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
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
                <span>הוסף פריט</span>
              </button>
            </div>
            {workspaceCategories.length > 0 && hasProductsInCategories && (
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
            )}
            {items.length === 0 && (
              <p style={{ fontSize: 14, color: '#999', margin: '8px 0 12px', textAlign: 'center' }}>
                הרשימה ריקה — הוסיפו פריטים לרשימה
              </p>
            )}
          </>
        )}

        {!isLoading && items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        )}

        {isLoading ? (
          <p>טוען...</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {categories.map((cat) => (
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
                <CategoryIcon iconId={getCategoryIconId(cat)} imageUrl={getCategoryImageUrl(cat)} size={24} />
                <span style={{ fontWeight: 600 }}>{cat}</span>
              </div>
              <SortableContext items={grouped[cat].map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {viewMode === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[cat].map((item) => (
                  <SortableItem key={item.id} id={item.id}>
                    {({ handleProps }) => (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        background: '#fff',
                        borderRadius: 12,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                    >
                      <span {...handleProps} style={{ cursor: 'grab', touchAction: 'none', color: '#bbb', fontSize: 18, flexShrink: 0, lineHeight: 1, padding: '0 2px' }} aria-label="גרור לשינוי סדר">⠿</span>
                      <input
                        type="checkbox"
                        checked={!!item.crossedOff}
                        onChange={() =>
                          updateMutation.mutate({
                            itemId: item.id,
                            body: { crossedOff: !item.crossedOff },
                          })
                        }
                        style={{ width: 22, height: 22, cursor: 'pointer', accentColor: 'var(--color-primary)', flexShrink: 0 }}
                        aria-label={item.crossedOff ? 'בטל סימון' : 'סימן'}
                      />
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
                        <div style={{ textDecoration: item.crossedOff ? 'line-through' : 'none', color: item.crossedOff ? 'var(--color-strike)' : 'inherit' }}>{item.displayName}</div>
                        <div style={{ fontSize: 14, color: '#666' }}>
                          {item.quantity} {item.unit}
                          {item.note && ` · ${item.note}`}
                        </div>
                      </div>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setItemMenuOpenId((prev) => prev === item.id ? null : item.id)}
                          aria-label="תפריט פריט"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '4px 8px', lineHeight: 1, color: '#555', borderRadius: 6 }}
                        >
                          &#8942;
                        </button>
                        {itemMenuOpenId === item.id && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setItemMenuOpenId(null)} />
                            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: 120, overflow: 'hidden' }}>
                              <button type="button" onClick={(e) => { setItemMenuOpenId(null); openEditItemImage(item, e); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontSize: 14 }}>שנה תמונה</button>
                              <button type="button" onClick={() => { setItemMenuOpenId(null); removeMutation.mutate(item.id); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontSize: 14, color: 'var(--color-strike)' }}>הסר</button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    )}
                  </SortableItem>
                ))}
              </div>
              ) : viewMode === 'compact' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {grouped[cat].map((item) => (
                  <SortableItem key={item.id} id={item.id}>
                    {({ handleProps }) => (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        background: '#fff',
                        borderRadius: 6,
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <span {...handleProps} style={{ cursor: 'grab', touchAction: 'none', color: '#ccc', fontSize: 14, flexShrink: 0, lineHeight: 1, padding: '0 1px' }} aria-label="גרור לשינוי סדר">⠿</span>
                      <input
                        type="checkbox"
                        checked={!!item.crossedOff}
                        onChange={() =>
                          updateMutation.mutate({
                            itemId: item.id,
                            body: { crossedOff: !item.crossedOff },
                          })
                        }
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)', flexShrink: 0 }}
                        aria-label={item.crossedOff ? 'בטל סימון' : 'סימן'}
                      />
                      <span style={{
                        flex: 1,
                        fontSize: 14,
                        textDecoration: item.crossedOff ? 'line-through' : 'none',
                        color: item.crossedOff ? 'var(--color-strike)' : 'inherit',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.displayName}
                      </span>
                      <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>
                        {item.quantity} {item.unit}
                      </span>
                      {item.note && (
                        <span style={{ fontSize: 11, color: '#aaa', flexShrink: 1, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.note}
                        </span>
                      )}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setItemMenuOpenId((prev) => prev === item.id ? null : item.id)}
                          aria-label="תפריט פריט"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 4px', lineHeight: 1, color: '#999', borderRadius: 4 }}
                        >
                          &#8942;
                        </button>
                        {itemMenuOpenId === item.id && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setItemMenuOpenId(null)} />
                            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: 120, overflow: 'hidden' }}>
                              <button type="button" onClick={(e) => { setItemMenuOpenId(null); openEditItemImage(item, e); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontSize: 14 }}>שנה תמונה</button>
                              <button type="button" onClick={() => { setItemMenuOpenId(null); removeMutation.mutate(item.id); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontSize: 14, color: 'var(--color-strike)' }}>הסר</button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    )}
                  </SortableItem>
                ))}
              </div>
              ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {grouped[cat].map((item) => (
                  <SortableItem key={item.id} id={item.id}>
                    {({ handleProps }) => (
                    <div
                      style={{
                        position: 'relative',
                        padding: 10,
                        background: '#fff',
                        borderRadius: 12,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        textAlign: 'center',
                        opacity: item.crossedOff ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <input
                          type="checkbox"
                          checked={!!item.crossedOff}
                          onChange={() =>
                            updateMutation.mutate({
                              itemId: item.id,
                              body: { crossedOff: !item.crossedOff },
                            })
                          }
                          style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                          aria-label={item.crossedOff ? 'בטל סימון' : 'סימן'}
                        />
                        <span {...handleProps} style={{ cursor: 'grab', touchAction: 'none', color: '#bbb', fontSize: 16, lineHeight: 1 }} aria-label="גרור לשינוי סדר">⠿</span>
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setItemMenuOpenId((prev) => prev === item.id ? null : item.id)}
                            aria-label="תפריט פריט"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 6px', lineHeight: 1, color: '#555', borderRadius: 6 }}
                          >
                            &#8942;
                          </button>
                          {itemMenuOpenId === item.id && (
                            <>
                              <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setItemMenuOpenId(null)} />
                              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: 110, overflow: 'hidden' }}>
                                <button type="button" onClick={(e) => { setItemMenuOpenId(null); openEditItemImage(item, e); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontSize: 14 }}>שנה תמונה</button>
                                <button type="button" onClick={() => { setItemMenuOpenId(null); removeMutation.mutate(item.id); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontSize: 14, color: 'var(--color-strike)' }}>הסר</button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
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
                      <span style={{ fontWeight: 500, fontSize: 13, wordBreak: 'break-word', textDecoration: item.crossedOff ? 'line-through' : 'none', color: item.crossedOff ? 'var(--color-strike)' : 'inherit' }}>{item.displayName}</span>
                      <span style={{ fontSize: 11, color: '#666' }}>
                        {item.quantity} {item.unit}
                      </span>
                      {item.note && (
                        <span style={{ fontSize: 11, color: '#888', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.note}
                        </span>
                      )}
                    </div>
                    )}
                  </SortableItem>
                ))}
              </div>
              )}
              </SortableContext>
            </section>
          ))}
          </DndContext>
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
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>שם הפריט <span style={{ color: '#c00' }}>*</span></label>
                  <input
                    type="text"
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    placeholder="שם פריט"
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
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>קטגוריה</label>
                  <select
                    value={quickAddCategoryId}
                    onChange={(e) => setQuickAddCategoryId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #ccc',
                      background: '#fff',
                      fontSize: 14,
                    }}
                  >
                    <option value="">ללא קטגוריה (אחר)</option>
                    {workspaceCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameHe}
                      </option>
                    ))}
                  </select>
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
                    style={{
                      flex: 1,
                      padding: 12,
                      background: !quickAddName.trim() || addItemMutation.isPending || quickAddSubmitting ? '#ccc' : 'var(--color-primary)',
                      color: !quickAddName.trim() || addItemMutation.isPending || quickAddSubmitting ? '#666' : '#fff',
                      fontWeight: 600,
                      borderRadius: 8,
                      border: 'none',
                      cursor: !quickAddName.trim() || addItemMutation.isPending || quickAddSubmitting ? 'not-allowed' : 'pointer',
                    }}
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

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
import { useWorkspaceEvents } from '../hooks/useWorkspaceEvents';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { DisplayImageForm, type DisplayImageType } from '../components/DisplayImageForm';
import { ViewModeToggle, useViewMode } from '../components/ViewModeToggle';
import { ProductAutocomplete } from '../components/ProductAutocomplete';
import type { ListItemResponse, ListEvent, WorkspaceEvent, ProductDto } from '../types';

function TrashIcon({ size = 18, color = '#999' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z" fill={color} />
      <path d="M3 6a1 1 0 0 1 1-1h16a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" fill={color} />
      <path d="M5 8h14l-1.2 13a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" fill={color} />
      <rect x="9.5" y="11" width="1.2" height="8" rx="0.6" fill="#fff" />
      <rect x="11.4" y="11" width="1.2" height="8" rx="0.6" fill="#fff" />
      <rect x="13.3" y="11" width="1.2" height="8" rx="0.6" fill="#fff" />
    </svg>
  );
}

function EyeIcon({ size = 18, color = '#666' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ size = 18, color = '#666' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

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
  // Old standalone image editing state removed - image editing now in main edit modal
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddQuantity, setQuickAddQuantity] = useState('1');
  const [quickAddUnit, setQuickAddUnit] = useState('');
  const [quickAddNote, setQuickAddNote] = useState('');
  const [quickAddImageType, setQuickAddImageType] = useState<DisplayImageType>('icon');
  const [quickAddIconId, setQuickAddIconId] = useState('');
  const [quickAddImageUrl, setQuickAddImageUrl] = useState('');
  const [quickAddImageFile, setQuickAddImageFile] = useState<File | null>(null);
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [quickAddCategoryId, setQuickAddCategoryId] = useState('');
  const quickAddFileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useViewMode(`list-${listId}`);
  const [hideCrossedOff, setHideCrossedOff] = useState(false);
  const [editItem, setEditItem] = useState<ListItemResponse | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemQuantity, setEditItemQuantity] = useState('1');
  const [editItemUnit, setEditItemUnit] = useState('');
  const [editItemNote, setEditItemNote] = useState('');
  const [editItemCategoryId, setEditItemCategoryId] = useState('');
  const [editItemDisplayImageType, setEditItemDisplayImageType] = useState<DisplayImageType>('icon');
  const [editItemIconId, setEditItemIconId] = useState('');
  const [editItemImageUrl, setEditItemImageUrl] = useState('');
  const editItemFileInputRef = useRef<HTMLInputElement>(null);
  // itemMenuOpenId removed - items now use single-click edit + trash icon
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
  const hasCrossedOff = items.some(i => i.crossedOff);

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

  useWorkspaceEvents(list?.workspaceId ?? null, useCallback((event: WorkspaceEvent) => {
    if (event.entityType === 'LIST') {
      queryClient.invalidateQueries({ queryKey: ['list', listId] });
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    }
    if (event.entityType === 'CATEGORY') {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
    }
    if (event.entityType === 'PRODUCT') {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
    }
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
      body: { crossedOff?: boolean; quantity?: number; unit?: string; note?: string; itemImageUrl?: string | null; iconId?: string | null; categoryId?: string; version?: number };
    }) => updateListItem(listId!, itemId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: Error) => {
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
      showNotification(err.message || 'שגיאה בעדכון הפריט', true);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, imageUrl, iconId, version }: { productId: string; imageUrl: string | null; iconId: string; version?: number }) =>
      updateProduct(productId, { imageUrl, iconId, version }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
    },
    onError: (err: Error) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
      showNotification(err.message || 'שגיאה בעדכון הפריט', true);
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
    mutationFn: async (payload: { name?: string; iconId?: string | null; imageUrl?: string | null; version?: number }) => {
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
    onError: (err: Error) => {
      queryClient.invalidateQueries({ queryKey: ['list', listId] });
      showNotification(err.message || 'שגיאה בעדכון הרשימה', true);
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
    setQuickAddQuantity('1');
    setQuickAddUnit('');
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
      ...(quickAddUnit ? { quantity: parseFloat(quickAddQuantity) || 1, unit: quickAddUnit } : {}),
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

  function openEditItem(item: ListItemResponse) {
    setEditItem(item);
    setEditItemName(item.displayName);
    setEditItemQuantity(String(item.quantity));
    setEditItemUnit(item.unit || '');
    setEditItemNote(item.note || '');
    setEditItemCategoryId(item.categoryId || '');
    setEditItemDisplayImageType(item.itemImageUrl || item.productImageUrl ? 'link' : 'icon');
    setEditItemIconId(item.iconId ?? item.categoryIconId ?? '');
    setEditItemImageUrl(item.itemImageUrl || item.productImageUrl || '');
  }

  function closeEditItem() {
    setEditItem(null);
    setEditItemName('');
    setEditItemQuantity('1');
    setEditItemUnit('');
    setEditItemNote('');
    setEditItemCategoryId('');
    setEditItemDisplayImageType('icon');
    setEditItemIconId('');
    setEditItemImageUrl('');
  }

  function handleEditItemSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem || !listId) return;
    const body: Record<string, unknown> = {
      version: editItem.version,
    };
    const newQty = parseFloat(editItemQuantity);
    if (!isNaN(newQty) && newQty !== editItem.quantity) body.quantity = newQty;
    if (editItemUnit !== (editItem.unit || '')) body.unit = editItemUnit;
    if (editItemNote !== (editItem.note || '')) body.note = editItemNote;
    if (editItemCategoryId && editItemCategoryId !== (editItem.categoryId || '')) {
      body.categoryId = editItemCategoryId;
    }
    // Image
    const newImageUrl = editItemDisplayImageType === 'icon' ? '' : (editItemImageUrl.trim() || '');
    const origImageUrl = editItem.itemImageUrl || '';
    if (newImageUrl !== origImageUrl) body.itemImageUrl = newImageUrl;
    const newIconId = editItemDisplayImageType === 'icon' ? (editItemIconId || '') : '';
    const origIconId = editItem.iconId ?? '';
    if (newIconId !== origIconId) body.iconId = newIconId;
    // Also sync product icon when changing icon from list
    const productId = editItem.productId;
    if (productId && editItemDisplayImageType === 'icon' && newIconId !== origIconId) {
      const product = allProducts.find((p) => p.id === productId);
      updateProductMutation.mutate({
        productId,
        imageUrl: '',
        iconId: newIconId,
        version: product?.version,
      });
    }
    updateMutation.mutate({
      itemId: editItem.id,
      body: body as { version?: number; quantity?: number; unit?: string; note?: string; categoryId?: string; itemImageUrl?: string | null; iconId?: string | null },
    });
    closeEditItem();
  }

  // Old standalone image modal functions removed - image editing now in main edit modal

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
      updateListMutation.mutate({ name, version: list?.version });
      return;
    }
    updateListMutation.mutate({ name, iconId, imageUrl, version: list?.version });
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            {hasCrossedOff && (
              <button
                type="button"
                onClick={() => setHideCrossedOff(v => !v)}
                title={hideCrossedOff ? 'הצג פריטים מסומנים' : 'הסתר פריטים מסומנים'}
                aria-label={hideCrossedOff ? 'הצג פריטים מסומנים' : 'הסתר פריטים מסומנים'}
                style={{
                  padding: '6px 8px',
                  background: hideCrossedOff ? 'var(--color-primary)' : '#fff',
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  lineHeight: 1,
                }}
              >
                {hideCrossedOff ? <EyeOffIcon size={18} color={hideCrossedOff ? '#fff' : '#666'} /> : <EyeIcon size={18} color="#666" />}
              </button>
            )}
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        )}

        {isLoading ? (
          <p>טוען...</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {categories.map((cat) => {
            const visibleItems = hideCrossedOff ? grouped[cat].filter(i => !i.crossedOff) : grouped[cat];
            if (visibleItems.length === 0) return null;
            return (
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
              <SortableContext items={visibleItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {viewMode === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleItems.map((item) => (
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
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openEditItem(item)}>
                        <div style={{ textDecoration: item.crossedOff ? 'line-through' : 'none', color: item.crossedOff ? 'var(--color-strike)' : 'inherit' }}>{item.displayName}</div>
                        <div style={{ fontSize: 14, color: '#666' }}>
                          {item.quantity} {item.unit}
                          {item.note && ` · ${item.note}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(item.id)}
                        aria-label="הסר פריט"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', lineHeight: 1, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    )}
                  </SortableItem>
                ))}
              </div>
              ) : viewMode === 'compact' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {visibleItems.map((item) => (
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
                      <span
                        onClick={() => openEditItem(item)}
                        style={{
                        flex: 1,
                        fontSize: 14,
                        textDecoration: item.crossedOff ? 'line-through' : 'none',
                        color: item.crossedOff ? 'var(--color-strike)' : 'inherit',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
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
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(item.id)}
                        aria-label="הסר פריט"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', lineHeight: 1, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                    )}
                  </SortableItem>
                ))}
              </div>
              ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {visibleItems.map((item) => (
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
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(item.id)}
                          aria-label="הסר פריט"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', lineHeight: 1, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                      <div onClick={() => openEditItem(item)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
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
                    </div>
                    )}
                  </SortableItem>
                ))}
              </div>
              )}
              </SortableContext>
            </section>
            );
          })}
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
                  <ProductAutocomplete
                    value={quickAddName}
                    onChange={setQuickAddName}
                    products={allProducts}
                    placeholder="שם פריט"
                    required
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                    onSelectProduct={(p: ProductDto) => {
                      setQuickAddName(p.nameHe);
                      if (p.defaultUnit && p.defaultUnit !== 'יחידה') {
                        setQuickAddUnit(p.defaultUnit);
                        if (!quickAddQuantity || quickAddQuantity === '1') setQuickAddQuantity('1');
                      }
                      if (p.categoryId) setQuickAddCategoryId(p.categoryId);
                      if (p.iconId) {
                        setQuickAddImageType('icon');
                        setQuickAddIconId(p.iconId);
                      } else if (p.imageUrl) {
                        setQuickAddImageType('link');
                        setQuickAddImageUrl(p.imageUrl);
                      }
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 120px' }}>
                    <label htmlFor="quick-add-unit" style={{ display: 'block', marginBottom: 4 }}>יחידה</label>
                    <select
                      id="quick-add-unit"
                      value={quickAddUnit}
                      onChange={(e) => {
                        setQuickAddUnit(e.target.value);
                        if (e.target.value && !quickAddUnit) setQuickAddQuantity('1');
                      }}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', background: '#fff' }}
                    >
                      <option value="">ללא</option>
                      <option value="יחידה">יחידה</option>
                      <option value={'ק"ג'}>ק&quot;ג</option>
                      <option value="גרם">גרם</option>
                      <option value="ליטר">ליטר</option>
                      <option value={'מ"ל'}>מ&quot;ל</option>
                      <option value="חבילה">חבילה</option>
                      <option value="קופסה">קופסה</option>
                    </select>
                  </div>
                  {quickAddUnit && (
                    <div style={{ flex: '0 0 auto' }}>
                      <label htmlFor="quick-add-qty" style={{ display: 'block', marginBottom: 4 }}>כמות</label>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const n = parseFloat(quickAddQuantity) || 1;
                            if (n > 1) setQuickAddQuantity(String(n - 1));
                          }}
                          style={{
                            width: 36, height: 40, border: '1px solid #ccc', borderRadius: '8px 0 0 8px',
                            background: '#f5f5f5', cursor: 'pointer', fontSize: 18, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          −
                        </button>
                        <input
                          id="quick-add-qty"
                          type="text"
                          inputMode="decimal"
                          value={quickAddQuantity}
                          onChange={(e) => setQuickAddQuantity(e.target.value)}
                          onBlur={() => {
                            const n = parseFloat(quickAddQuantity);
                            if (isNaN(n) || n <= 0) setQuickAddQuantity('1');
                          }}
                          style={{
                            width: 56, height: 40, border: '1px solid #ccc', borderLeft: 'none', borderRight: 'none',
                            textAlign: 'center', fontSize: 16, padding: 0, boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const n = parseFloat(quickAddQuantity) || 0;
                            setQuickAddQuantity(String(n + 1));
                          }}
                          style={{
                            width: 36, height: 40, border: '1px solid #ccc', borderRadius: '0 8px 8px 0',
                            background: '#f5f5f5', cursor: 'pointer', fontSize: 18, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
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

        {/* Old standalone image modal removed - image editing is now in the main edit modal */}

        {editItem && (
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
            onClick={closeEditItem}
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
              <h3 style={{ margin: '0 0 16px' }}>עריכת פריט</h3>
              <form onSubmit={handleEditItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>שם פריט</label>
                  <input
                    type="text"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    disabled={!!editItem.productId}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box', background: editItem.productId ? '#f5f5f5' : '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>יחידת מידה</label>
                    <input
                      type="text"
                      value={editItemUnit}
                      onChange={(e) => setEditItemUnit(e.target.value)}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: '0 0 auto' }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>כמות</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const n = parseFloat(editItemQuantity) || 1;
                          if (n > 1) setEditItemQuantity(String(n - 1));
                        }}
                        style={{
                          width: 36, height: 40, border: '1px solid #ccc', borderRadius: '8px 0 0 8px',
                          background: '#f5f5f5', cursor: 'pointer', fontSize: 18, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        −
                      </button>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editItemQuantity}
                        onChange={(e) => setEditItemQuantity(e.target.value)}
                        onBlur={() => {
                          const n = parseFloat(editItemQuantity);
                          if (isNaN(n) || n <= 0) setEditItemQuantity('1');
                        }}
                        style={{
                          width: 56, height: 40, border: '1px solid #ccc', borderLeft: 'none', borderRight: 'none',
                          textAlign: 'center', fontSize: 16, padding: 0, boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const n = parseFloat(editItemQuantity) || 0;
                          setEditItemQuantity(String(n + 1));
                        }}
                        style={{
                          width: 36, height: 40, border: '1px solid #ccc', borderRadius: '0 8px 8px 0',
                          background: '#f5f5f5', cursor: 'pointer', fontSize: 18, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>הערה</label>
                  <textarea
                    value={editItemNote}
                    onChange={(e) => setEditItemNote(e.target.value)}
                    rows={2}
                    placeholder="אופציונלי"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                {workspaceCategories.length > 0 && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>קטגוריה</label>
                    <select
                      value={editItemCategoryId}
                      onChange={(e) => setEditItemCategoryId(e.target.value)}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', background: '#fff', fontSize: 14, boxSizing: 'border-box' }}
                    >
                      <option value="">ללא קטגוריה (אחר)</option>
                      {workspaceCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameHe}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <DisplayImageForm
                  label="תמונה / אייקון"
                  displayType={editItemDisplayImageType}
                  iconId={editItemIconId}
                  imageUrl={editItemImageUrl}
                  onDisplayTypeChange={(v) => {
                    setEditItemDisplayImageType(v);
                    if (v === 'icon') setEditItemImageUrl('');
                    if (v === 'link' || v === 'web') { setEditItemImageUrl(''); }
                    if (v === 'device') setTimeout(() => editItemFileInputRef.current?.click(), 0);
                  }}
                  onIconIdChange={setEditItemIconId}
                  onImageUrlChange={setEditItemImageUrl}
                  fileInputRef={editItemFileInputRef}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: updateMutation.isPending ? '#ccc' : 'var(--color-primary)',
                      color: updateMutation.isPending ? '#666' : '#fff',
                      fontWeight: 600,
                      borderRadius: 8,
                      border: 'none',
                      cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {updateMutation.isPending ? 'שומר...' : 'שמור'}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditItem}
                    style={{ padding: 12, background: '#eee', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                  >
                    ביטול
                  </button>
                </div>
              </form>
              <input
                ref={editItemFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !editItem || !listId) return;
                  e.target.value = '';
                  try {
                    const { url } = await uploadFile(`/api/upload/lists/${listId}/items/${editItem.id}`, file);
                    setEditItemImageUrl(url);
                    queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
                  } catch (err) {
                    console.error(err);
                  }
                }}
              />
            </div>
          </div>
        )}

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

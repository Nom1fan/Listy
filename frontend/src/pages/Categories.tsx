import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, getProducts, createCategory, createProduct, deleteCategory, deleteProduct, reorderCategories } from '../api/products';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useWorkspaceEvents } from '../hooks/useWorkspaceEvents';
import { uploadFile } from '../api/client';
import { CategoryIcon } from '../components/CategoryIcon';
import { DisplayImageForm } from '../components/DisplayImageForm';
import { ViewModeToggle, useViewMode } from '../components/ViewModeToggle';
import { ProductAutocomplete } from '../components/ProductAutocomplete';
import type { CategoryDto, ProductDto, WorkspaceEvent } from '../types';

type DisplayImageType = 'icon' | 'device' | 'link' | 'web';

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

function PencilIcon({ size = 18, color = '#666' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function ExpandAllIcon({ size = 20, color = '#555' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10l5 5 5-5M7 4l5 5 5-5" />
    </svg>
  );
}

function CollapseAllIcon({ size = 20, color = '#555' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 14l5-5 5 5M7 20l5-5 5 5" />
    </svg>
  );
}

function ChevronDownIcon({ size = 20, color = '#555' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ size = 20, color = '#555' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function Categories() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [viewMode, setViewMode] = useViewMode('categories');
  const [nameHe, setNameHe] = useState('');
  const [addProductCategoryId, setAddProductCategoryId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('יחידה');
  const [newProductDisplayImageType, setNewProductDisplayImageType] = useState<DisplayImageType>('icon');
  const [newProductIconId, setNewProductIconId] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const newProductPendingFileRef = useRef<File | null>(null);
  const newProductFileInputRef = useRef<HTMLInputElement>(null);
  const [newProductNote, setNewProductNote] = useState('');
  const [productImageToast, setProductImageToast] = useState<{ message: string; isError: boolean } | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<CategoryDto | null>(null);
  const [categoryMenuOpenId, setCategoryMenuOpenId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Drag reorder
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [orderedCategories, setOrderedCategories] = useState<CategoryDto[] | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => new Set());

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', activeWorkspaceId],
    queryFn: () => getCategories(activeWorkspaceId || undefined),
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  const productsByCategory = allProducts.reduce<Record<string, ProductDto[]>>((acc, p) => {
    if (!acc[p.categoryId]) acc[p.categoryId] = [];
    acc[p.categoryId].push(p);
    return acc;
  }, {});

  useWorkspaceEvents(activeWorkspaceId, useCallback((event: WorkspaceEvent) => {
    if (event.entityType === 'CATEGORY') {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
    if (event.entityType === 'PRODUCT') {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  }, [queryClient]));

  const [, setCreateError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (body: { nameHe: string; workspaceId: string; sortOrder?: number }) =>
      createCategory({ nameHe: body.nameHe, workspaceId: body.workspaceId, sortOrder: body.sortOrder }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeCreateModal();
    },
    onError: (err: Error) => {
      setCreateError(err.message || 'שגיאה בהוספת קטגוריה');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (body: { categoryId: string; nameHe: string; defaultUnit?: string; iconId?: string | null; imageUrl?: string | null }) => createProduct(body),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setNewProductName('');
      setNewProductUnit('יחידה');
      setNewProductNote('');
      setNewProductDisplayImageType('icon');
      setNewProductIconId('');
      setNewProductImageUrl('');
      setAddProductCategoryId(null);
      const file = newProductPendingFileRef.current;
      newProductPendingFileRef.current = null;
      if (file && data?.id) {
        try {
          await uploadFile(`/api/upload/product/${data.id}`, file);
          queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (err) {
          console.error(err);
        }
      }
    },
    onError: (err: Error) => {
      setProductImageToast({ message: err.message || 'שגיאה בהוספת פריט', isError: true });
      setTimeout(() => setProductImageToast(null), 5000);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (categoryIds: string[]) => reorderCategories(categoryIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err: Error) => {
      setProductImageToast({ message: err.message || 'שגיאה בשינוי הסדר', isError: true });
      setTimeout(() => setProductImageToast(null), 5000);
    },
  });

  const displayCategories = orderedCategories ?? categories;

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
    setOrderedCategories([...categories]);
  }, [categories]);

  const handleDragOver = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
    setOrderedCategories((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      setDragIndex(index);
      return updated;
    });
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    if (orderedCategories) {
      const ids = orderedCategories.map((c) => c.id);
      reorderMutation.mutate(ids);
    }
    setDragIndex(null);
    setOverIndex(null);
    setOrderedCategories(null);
  }, [orderedCategories, reorderMutation]);

  function closeCreateModal() {
    setShowCreateModal(false);
    setNameHe('');
    setCreateError(null);
  }

  function handleAddProduct(e: React.FormEvent, categoryId: string) {
    e.preventDefault();
    if (!newProductName.trim()) return;
    const iconId = newProductDisplayImageType === 'icon' ? (newProductIconId || undefined) : undefined;
    const imageUrl = (newProductDisplayImageType === 'link' || newProductDisplayImageType === 'web') && newProductImageUrl.trim()
      ? newProductImageUrl.trim()
      : undefined;
    if (newProductDisplayImageType === 'device' && newProductPendingFileRef.current) {
      // Keep ref for onSuccess upload; don't send imageUrl in create
    }
    createProductMutation.mutate({
      categoryId,
      nameHe: newProductName.trim(),
      defaultUnit: newProductUnit.trim() || 'יחידה',
      ...(iconId !== undefined && { iconId }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(newProductNote.trim() && { note: newProductNote.trim() }),
    });
  }

  /** Show unit only when set and not the default "יחידה" (same behavior as list item display). */
  function formatProductUnit(p: ProductDto): string | null {
    const u = (p.defaultUnit ?? '').trim();
    if (u === '' || u === 'יחידה') return null;
    return u;
  }

  return (
    <>
      {productImageToast && (
        <div
          onClick={() => setProductImageToast(null)}
          style={{
            position: 'fixed',
            bottom: 'max(24px, env(safe-area-inset-bottom))',
            left: 16,
            right: 16,
            padding: 14,
            background: productImageToast.isError ? 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)' : 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
            color: '#fff',
            borderRadius: 12,
            textAlign: 'center',
            zIndex: 1002,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {productImageToast.isError ? '✕ ' : '✓ '}{productImageToast.message}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        {showCreateModal ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={nameHe}
              onChange={(e) => setNameHe(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (activeWorkspaceId && nameHe.trim()) {
                    createMutation.mutate({ nameHe: nameHe.trim(), workspaceId: activeWorkspaceId, sortOrder: categories.length });
                  }
                }
                if (e.key === 'Escape') {
                  closeCreateModal();
                }
              }}
              placeholder="שם קטגוריה"
              autoFocus
              style={{
                minWidth: 140,
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #ddd',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (activeWorkspaceId && nameHe.trim()) {
                  createMutation.mutate({ nameHe: nameHe.trim(), workspaceId: activeWorkspaceId, sortOrder: categories.length });
                }
              }}
              disabled={!activeWorkspaceId || !nameHe.trim() || createMutation.isPending}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: activeWorkspaceId && nameHe.trim() && !createMutation.isPending ? 'var(--color-primary)' : '#ccc',
                color: '#fff',
                fontSize: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: activeWorkspaceId && nameHe.trim() && !createMutation.isPending ? 'pointer' : 'not-allowed',
              }}
              aria-label="צור קטגוריה"
            >
              +
            </button>
            <button
              type="button"
              onClick={closeCreateModal}
              style={{
                padding: '10px 14px',
                background: '#eee',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              ביטול
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!activeWorkspaceId}
            style={{
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
              border: 'none',
            }}
            aria-label="הוסף קטגוריה"
            >
              +
            </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {displayCategories.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setCollapsedCategories(new Set())}
                title="פתח את כל הקטגוריות"
                aria-label="פתח את כל הקטגוריות"
                style={{
                  padding: '8px 10px',
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ExpandAllIcon size={20} color="#555" />
              </button>
              <button
                type="button"
                onClick={() => setCollapsedCategories(new Set(displayCategories.map((c) => c.id)))}
                title="סגור את כל הקטגוריות"
                aria-label="סגור את כל הקטגוריות"
                style={{
                  padding: '8px 10px',
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CollapseAllIcon size={20} color="#555" />
              </button>
            </>
          )}
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

        {displayCategories.length === 0 && (
          <p style={{ fontSize: 14, color: '#999', margin: '8px 0 12px', textAlign: 'center' }}>
            עדיין אין קטגוריות — לחצו על + כדי ליצור קטגוריה ראשונה
          </p>
        )}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayCategories.map((c, index) => (
            <li
              key={c.id}
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
                background: overIndex === index ? '#e3f2fd' : '#fff',
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                opacity: dragIndex === index ? 0.5 : 1,
                transition: 'opacity 0.15s, background 0.15s',
                cursor: 'grab',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                }}
              >
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
                <CategoryIcon iconId={c.iconId} imageUrl={c.imageUrl} size={32} />
                <button
                  type="button"
                  onClick={() => setCollapsedCategories((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id);
                    else next.add(c.id);
                    return next;
                  })}
                  aria-expanded={!collapsedCategories.has(c.id)}
                  aria-label={collapsedCategories.has(c.id) ? `פתח קטגוריה ${c.nameHe}` : `סגור קטגוריה ${c.nameHe}`}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    font: 'inherit',
                    fontWeight: 500,
                    textAlign: 'right',
                  }}
                >
                  <span>{c.nameHe}</span>
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#666', opacity: 0.9 }}>{(productsByCategory[c.id] || []).length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCollapsedCategories((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id);
                    else next.add(c.id);
                    return next;
                  })}
                  aria-expanded={!collapsedCategories.has(c.id)}
                  aria-label={collapsedCategories.has(c.id) ? `פתח קטגוריה ${c.nameHe}` : `סגור קטגוריה ${c.nameHe}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    color: '#555',
                  }}
                >
                  {collapsedCategories.has(c.id) ? <ChevronRightIcon size={22} color="#555" /> : <ChevronDownIcon size={22} color="#555" />}
                </button>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setCategoryMenuOpenId((prev) => prev === c.id ? null : c.id)}
                    aria-label="תפריט קטגוריה"
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
                  {categoryMenuOpenId === c.id && (
                    <>
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                        onClick={() => setCategoryMenuOpenId(null)}
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
                          onClick={() => { setCategoryMenuOpenId(null); navigate(`/categories/${c.id}/edit`, { state: { from: 'categories' } }); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 8,
                            width: '100%',
                            padding: '10px 16px',
                            background: 'none',
                            border: 'none',
                            fontSize: 14,
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            color: '#333',
                          }}
                        >
                          ערוך
                          <PencilIcon size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCategoryMenuOpenId(null); setConfirmDeleteCategory(c); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 8,
                            width: '100%',
                            padding: '10px 16px',
                            background: 'none',
                            border: 'none',
                            fontSize: 14,
                            cursor: 'pointer',
                            color: '#c00',
                          }}
                        >
                          מחק
                          <TrashIcon size={16} color="#c00" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {!collapsedCategories.has(c.id) && (
              <div style={{ padding: '0 12px 12px 12px', borderTop: '1px solid #eee', marginTop: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8, marginTop: 8 }}>פריטים בקטגוריה</div>
                  {!(productsByCategory[c.id]?.length) && addProductCategoryId !== c.id && (
                    <p style={{ fontSize: 14, color: '#999', margin: '8px 0 12px', textAlign: 'center' }}>
                      הקטגוריה ריקה — הוסיפו פריטים לקטגוריה
                    </p>
                  )}
                  {viewMode === 'list' ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}>
                    {(productsByCategory[c.id] || []).map((p) => (
                      <li
                        key={p.id}
                        onClick={() => navigate(`/products/${p.id}/edit`, { state: { from: 'categories' } })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 0',
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                        }}
                      >
                        <CategoryIcon iconId={p.iconId ?? p.categoryIconId} imageUrl={p.imageUrl} size={24} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span>{p.nameHe}</span>
                          {p.note && (
                            <div style={{ fontSize: 12, color: '#888', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.note}
                            </div>
                          )}
                        </div>
                        {formatProductUnit(p) != null && (
                          <span style={{ fontSize: 12, color: '#666' }}>{formatProductUnit(p)}</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); if (window.confirm(`למחוק את הפריט "${p.nameHe}"?`)) deleteProductMutation.mutate(p.id); }}
                          aria-label="מחק פריט"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', lineHeight: 1, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                        >
                          <TrashIcon />
                        </button>
                      </li>
                    ))}
                  </ul>
                  ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 12 }}>
                    {(productsByCategory[c.id] || []).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/products/${p.id}/edit`, { state: { from: 'categories' } })}
                        style={{
                          position: 'relative',
                          padding: 10,
                          background: '#fafafa',
                          borderRadius: 10,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <CategoryIcon iconId={p.iconId ?? p.categoryIconId} imageUrl={p.imageUrl} size={48} />
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{p.nameHe}</span>
                        {formatProductUnit(p) != null && (
                          <span style={{ fontSize: 11, color: '#666' }}>{formatProductUnit(p)}</span>
                        )}
                        {p.note && (
                          <span style={{ fontSize: 11, color: '#888', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.note}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); if (window.confirm(`למחוק את הפריט "${p.nameHe}"?`)) deleteProductMutation.mutate(p.id); }}
                          aria-label="מחק פריט"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', lineHeight: 1, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  )}
                  {addProductCategoryId === c.id ? (
                    <form
                      onSubmit={(e) => handleAddProduct(e, c.id)}
                      style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}
                    >
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>שם פריט <span style={{ color: '#c00' }}>*</span></label>
                          <ProductAutocomplete
                            value={newProductName}
                            onChange={setNewProductName}
                            products={allProducts}
                            placeholder="שם פריט"
                            style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', minWidth: 120 }}
                            warnOnly
                            categoryId={c.id}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>יחידה</label>
                          <input
                            type="text"
                            value={newProductUnit}
                            onChange={(e) => setNewProductUnit(e.target.value)}
                            placeholder="יחידה"
                            style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', width: 80 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>הערה קבועה</label>
                          <input
                            type="text"
                            value={newProductNote}
                            onChange={(e) => setNewProductNote(e.target.value)}
                            placeholder="אופציונלי"
                            style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', minWidth: 160 }}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={createProductMutation.isPending || !newProductName.trim()}
                          style={{
                            padding: '8px 12px',
                            background: createProductMutation.isPending || !newProductName.trim() ? '#ccc' : 'var(--color-primary)',
                            color: createProductMutation.isPending || !newProductName.trim() ? '#666' : '#fff',
                            borderRadius: 8,
                            fontSize: 14,
                            border: 'none',
                            cursor: createProductMutation.isPending || !newProductName.trim() ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {createProductMutation.isPending ? 'מוסיף...' : 'הוסף פריט'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddProductCategoryId(null);
                            setNewProductName('');
                            setNewProductUnit('יחידה');
                            setNewProductNote('');
                            setNewProductDisplayImageType('icon');
                            setNewProductIconId('');
                            setNewProductImageUrl('');
                            newProductPendingFileRef.current = null;
                          }}
                          style={{ padding: '8px 12px', background: '#eee', borderRadius: 8 }}
                        >
                          ביטול
                        </button>
                      </div>
                      <DisplayImageForm
                        label="תמונת פריט"
                        displayType={newProductDisplayImageType}
                        iconId={newProductIconId}
                        imageUrl={newProductImageUrl}
                        onDisplayTypeChange={(v) => {
                          setNewProductDisplayImageType(v);
                          if (v === 'icon') setNewProductImageUrl('');
                          if (v === 'link' || v === 'web') { setNewProductImageUrl(''); }
                          if (v === 'device') { newProductPendingFileRef.current = null; setNewProductImageUrl(''); }
                        }}
                        onIconIdChange={setNewProductIconId}
                        onImageUrlChange={setNewProductImageUrl}
                        fileInputRef={newProductFileInputRef}
                      />
                      <input
                        ref={newProductFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            newProductPendingFileRef.current = file;
                            setNewProductImageUrl(' ');
                          }
                          e.target.value = '';
                        }}
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddProductCategoryId(c.id)}
                      style={{ padding: '6px 12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: 8, fontSize: 14 }}
                    >
                      + הוסף פריט לקטגוריה
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

      {confirmDeleteCategory && (
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
          onClick={() => setConfirmDeleteCategory(null)}
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
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>מחיקת קטגוריה</h3>
            <p style={{ margin: '0 0 20px', fontSize: 15, color: '#333', lineHeight: 1.6 }}>
              אתה באמת מעוניין למחוק את קטגוריה <strong>{confirmDeleteCategory.nameHe}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  deleteMutation.mutate(confirmDeleteCategory.id);
                  setConfirmDeleteCategory(null);
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
                onClick={() => setConfirmDeleteCategory(null)}
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

    </>
  );
}

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, getProducts, createCategory, createProduct, updateCategory, updateProduct, deleteCategory, deleteProduct } from '../api/products';
import { useWorkspaceStore } from '../store/workspaceStore';
import { uploadFile } from '../api/client';
import { CategoryIcon } from '../components/CategoryIcon';
import { DisplayImageForm } from '../components/DisplayImageForm';
import { EmojiPicker } from '../components/EmojiPicker';
import { ImageSearchPicker } from '../components/ImageSearchPicker';
import { ViewModeToggle, useViewMode } from '../components/ViewModeToggle';
import type { CategoryDto, ProductDto } from '../types';

type DisplayImageType = 'icon' | 'device' | 'link' | 'web';

export function Categories() {
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [viewMode, setViewMode] = useViewMode();
  const [nameHe, setNameHe] = useState('');
  const [displayImageType, setDisplayImageType] = useState<DisplayImageType>('icon');
  const [iconId, setIconId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [pendingCategoryFile, setPendingCategoryFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [editName, setEditName] = useState('');
  const [editDisplayImageType, setEditDisplayImageType] = useState<DisplayImageType>('icon');
  const [editIconId, setEditIconId] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const categoryImageInputRef = useRef<HTMLInputElement>(null);
  const createCategoryFileInputRef = useRef<HTMLInputElement>(null);
  const pendingCreateFileRef = useRef<File | null>(null);
  const [addProductCategoryId, setAddProductCategoryId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('יחידה');
  const [newProductDisplayImageType, setNewProductDisplayImageType] = useState<DisplayImageType>('icon');
  const [newProductIconId, setNewProductIconId] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const newProductPendingFileRef = useRef<File | null>(null);
  const newProductFileInputRef = useRef<HTMLInputElement>(null);
  const [editProduct, setEditProduct] = useState<ProductDto | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductUnit, setEditProductUnit] = useState('');
  const [editProductNote, setEditProductNote] = useState('');
  const [editProductDisplayImageType, setEditProductDisplayImageType] = useState<DisplayImageType>('icon');
  const [editProductIconId, setEditProductIconId] = useState('');
  const [editProductImageUrl, setEditProductImageUrl] = useState('');
  const editProductFileInputRef = useRef<HTMLInputElement>(null);
  const [newProductNote, setNewProductNote] = useState('');
  const [productImageToast, setProductImageToast] = useState<{ message: string; isError: boolean } | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<CategoryDto | null>(null);
  const [categoryMenuOpenId, setCategoryMenuOpenId] = useState<string | null>(null);
  const [productMenuOpenId, setProductMenuOpenId] = useState<string | null>(null);

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

  const [createError, setCreateError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (body: { nameHe: string; iconId?: string | null; imageUrl?: string | null; sortOrder?: number; workspaceId: string }) =>
      createCategory(body),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setNameHe('');
      setDisplayImageType('icon');
      setIconId('');
      setImageUrl('');
      setPendingCategoryFile(null);
      setCreateError(null);
      const file = pendingCreateFileRef.current;
      pendingCreateFileRef.current = null;
      if (file && data?.id) {
        try {
          await uploadFile(`/api/upload/category/${data.id}`, file);
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        } catch (err) {
          console.error(err);
        }
      }
    },
    onError: (err: Error) => {
      setCreateError(err.message || 'שגיאה בהוספת קטגוריה');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { nameHe?: string; iconId?: string | null; imageUrl?: string | null } }) =>
      updateCategory(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditing(null);
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

  const updateProductMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; nameHe?: string; defaultUnit?: string; imageUrl?: string | null; iconId?: string | null; note?: string | null }) =>
      updateProduct(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditProduct(null);
      setProductImageToast({ message: 'הפריט עודכן', isError: false });
      setTimeout(() => setProductImageToast(null), 3000);
    },
    onError: (err: Error) => {
      setProductImageToast({ message: err.message || 'שגיאה בעדכון הפריט', isError: true });
      setTimeout(() => setProductImageToast(null), 5000);
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!nameHe.trim()) return;
    if (displayImageType === 'device' && !pendingCategoryFile) return;
    if (displayImageType === 'link' && !imageUrl.trim()) return;
    pendingCreateFileRef.current = displayImageType === 'device' ? pendingCategoryFile : null;
    createMutation.mutate({
      nameHe: nameHe.trim(),
      iconId: displayImageType === 'icon' ? (iconId || '') : '',
      imageUrl: (displayImageType === 'link' || displayImageType === 'web') ? (imageUrl.trim() || '') : '',
      sortOrder: categories.length,
      workspaceId: activeWorkspaceId!,
    });
  }

  function startEdit(c: CategoryDto) {
    setEditing(c);
    setEditName(c.nameHe);
    setEditDisplayImageType(c.imageUrl ? 'link' : 'icon');
    setEditIconId(c.iconId || '');
    setEditImageUrl(c.imageUrl || '');
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    updateMutation.mutate({
      id: editing.id,
      body: {
        nameHe: editName.trim(),
        iconId: editDisplayImageType === 'icon' ? (editIconId || '') : '',
        imageUrl: editDisplayImageType !== 'icon' ? (editImageUrl.trim() || '') : '',
      },
    });
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

  function openEditProduct(p: ProductDto) {
    setEditing(null);
    setEditProduct(p);
    setEditProductName(p.nameHe);
    setEditProductUnit(p.defaultUnit);
    setEditProductNote(p.note || '');
    setEditProductDisplayImageType(p.imageUrl ? 'link' : 'icon');
    setEditProductIconId(p.iconId ?? p.categoryIconId ?? '');
    setEditProductImageUrl(p.imageUrl || '');
  }

  function handleEditProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editProduct) return;
    const imageUrl = editProductDisplayImageType === 'icon' ? '' : (editProductImageUrl.trim() || '');
    const iconId = editProductDisplayImageType === 'icon' ? (editProductIconId || '') : '';
    updateProductMutation.mutate({
      id: editProduct.id,
      nameHe: editProductName.trim(),
      defaultUnit: editProductUnit.trim() || 'יחידה',
      imageUrl,
      iconId,
      note: editProductNote.trim() || '',
    });
  }

  return (
    <>
      {productImageToast && (
        <div
          onClick={() => setProductImageToast(null)}
          style={{
            position: 'fixed',
            bottom: 24,
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
      </div>
        <form
          onSubmit={handleCreate}
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 24,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>שם קטגוריה</label>
            <input
              type="text"
              value={nameHe}
              onChange={(e) => setNameHe(e.target.value)}
              placeholder="שם קטגוריה"
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', minWidth: 140 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>תמונת תצוגה</label>
            <select
              value={displayImageType}
              onChange={(e) => {
                const v = e.target.value as DisplayImageType;
                setDisplayImageType(v);
                if (v === 'icon') { setImageUrl(''); setPendingCategoryFile(null); }
                if (v === 'device') {
                  setImageUrl('');
                  setTimeout(() => createCategoryFileInputRef.current?.click(), 0);
                }
                if (v === 'link' || v === 'web') { setPendingCategoryFile(null); }
              }}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', minWidth: 160 }}
            >
              <option value="icon">אייקון</option>
              <option value="device">בחר מהמכשיר...</option>
              <option value="link">קישור לתמונה</option>
              <option value="web">חיפוש באינטרנט</option>
            </select>
          </div>
          {displayImageType === 'icon' && (
            <EmojiPicker
              label="בחירת אייקון"
              value={iconId}
              onChange={setIconId}
            />
          )}
          {displayImageType === 'device' && (
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>בחר קובץ</label>
              <input
                ref={createCategoryFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPendingCategoryFile(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => createCategoryFileInputRef.current?.click()}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', background: '#fff' }}
              >
                {pendingCategoryFile ? pendingCategoryFile.name : 'בחר מהמכשיר...'}
              </button>
            </div>
          )}
          {displayImageType === 'link' && (
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>קישור לתמונה</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', minWidth: 180 }}
              />
            </div>
          )}
          {displayImageType === 'web' && (
            <div style={{ minWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>חיפוש תמונה באינטרנט</label>
              <ImageSearchPicker onSelect={(url) => setImageUrl(url)} placeholder="חיפוש תמונה..." />
              {imageUrl && (
                <p style={{ marginTop: 8, fontSize: 12, color: '#2e7d32' }}>נבחרה תמונה ✓</p>
              )}
            </div>
          )}
          {(() => {
            const hasName = !!nameHe.trim();
            const imageReady =
              displayImageType === 'icon' ||
              (displayImageType === 'device' && !!pendingCategoryFile) ||
              (displayImageType === 'link' && !!imageUrl.trim()) ||
              (displayImageType === 'web' && !!imageUrl.trim());
            const canSubmit = !!activeWorkspaceId && hasName && imageReady && !createMutation.isPending;
            return (
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  padding: '10px 16px',
                  fontWeight: 600,
                  borderRadius: 8,
                  background: canSubmit ? 'var(--color-primary)' : '#ccc',
                  color: canSubmit ? '#fff' : '#666',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  border: 'none',
                }}
              >
                {createMutation.isPending ? 'מוסיף...' : 'הוסף קטגוריה'}
              </button>
            );
          })()}
        </form>
        {createError && (
          <p style={{ color: '#c00', marginBottom: 16, fontSize: 14 }} role="alert">
            {createError}
          </p>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {categories.map((c) => (
            <li
              key={c.id}
              style={{
                background: '#fff',
                borderRadius: 12,
                marginBottom: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
                <CategoryIcon iconId={c.iconId} imageUrl={c.imageUrl} size={32} />
                {editing?.id === c.id ? (
                <form
                  onSubmit={handleUpdate}
                  style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', minWidth: 120 }}
                  />
                  <div>
                    <label style={{ fontSize: 12, marginBottom: 2, display: 'block' }}>תמונת קטגוריה (ברירת מחדל)</label>
                    <select
                      value={editDisplayImageType}
                      onChange={(e) => {
                        const v = e.target.value as DisplayImageType;
                        setEditDisplayImageType(v);
                        if (v === 'icon') setEditImageUrl('');
                        if (v === 'device') setTimeout(() => categoryImageInputRef.current?.click(), 0);
                      }}
                      style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
                    >
                      <option value="icon">אייקון</option>
                      <option value="device">בחר מהמכשיר...</option>
                      <option value="link">קישור לתמונה</option>
                      <option value="web">חיפוש באינטרנט</option>
                    </select>
                  </div>
                  {editDisplayImageType === 'icon' && (
                    <EmojiPicker
                      value={editIconId}
                      onChange={setEditIconId}
                    />
                  )}
                  {editDisplayImageType === 'device' && (
                    <div>
                      <input
                        ref={categoryImageInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !editing) return;
                          e.target.value = '';
                          try {
                            const { url } = await uploadFile(`/api/upload/category/${editing.id}`, file);
                            queryClient.invalidateQueries({ queryKey: ['categories'] });
                            setEditImageUrl(url);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => categoryImageInputRef.current?.click()}
                        style={{ padding: '8px 12px', background: '#eee', border: '1px solid #ccc', borderRadius: 8 }}
                      >
                        {editImageUrl ? 'התמונה הועלתה' : 'בחר מהמכשיר...'}
                      </button>
                    </div>
                  )}
                  {editDisplayImageType === 'link' && (
                    <div>
                      <label style={{ fontSize: 12, marginBottom: 2, display: 'block' }}>קישור לתמונה</label>
                      <input
                        type="url"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="https://..."
                        style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', minWidth: 140 }}
                      />
                    </div>
                  )}
                  {editDisplayImageType === 'web' && (
                    <div style={{ minWidth: 180 }}>
                      <label style={{ fontSize: 12, marginBottom: 2, display: 'block' }}>חיפוש תמונה באינטרנט</label>
                      <ImageSearchPicker
                        onSelect={(url) => setEditImageUrl(url)}
                        placeholder="חיפוש תמונה..."
                      />
                      {editImageUrl && <p style={{ marginTop: 6, fontSize: 12, color: '#2e7d32' }}>נבחרה תמונה ✓</p>}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    style={{ padding: '8px 12px', background: 'var(--color-primary)', color: '#fff', borderRadius: 8 }}
                  >
                    שמור
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    style={{ padding: '8px 12px', background: '#eee', borderRadius: 8 }}
                  >
                    ביטול
                  </button>
                </form>
              ) : (
                <>
                  <span style={{ flex: 1, fontWeight: 500 }}>{c.nameHe}</span>
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
                            minWidth: 120,
                            overflow: 'hidden',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => { setCategoryMenuOpenId(null); startEdit(c); }}
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
                            onClick={() => { setCategoryMenuOpenId(null); setConfirmDeleteCategory(c); }}
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
                </>
              )}
              </div>

              {editing?.id !== c.id && (
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
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 0',
                          borderBottom: '1px solid #f0f0f0',
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
                        <span style={{ fontSize: 12, color: '#666' }}>{p.defaultUnit}</span>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => setProductMenuOpenId((prev) => prev === p.id ? null : p.id)}
                            aria-label="תפריט פריט"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 6px', lineHeight: 1, color: '#555', borderRadius: 6 }}
                          >
                            &#8942;
                          </button>
                          {productMenuOpenId === p.id && (
                            <>
                              <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setProductMenuOpenId(null)} />
                              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: 110, overflow: 'hidden' }}>
                                <button type="button" onClick={() => { setProductMenuOpenId(null); openEditProduct(p); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                                  ערוך
                                </button>
                                <button type="button" onClick={() => { setProductMenuOpenId(null); if (window.confirm(`למחוק את הפריט "${p.nameHe}"?`)) deleteProductMutation.mutate(p.id); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', fontSize: 14, cursor: 'pointer', color: '#c00' }}>
                                  מחק
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 12 }}>
                    {(productsByCategory[c.id] || []).map((p) => (
                      <div
                        key={p.id}
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
                        }}
                      >
                        <CategoryIcon iconId={p.iconId ?? p.categoryIconId} imageUrl={p.imageUrl} size={48} />
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{p.nameHe}</span>
                        <span style={{ fontSize: 11, color: '#666' }}>{p.defaultUnit}</span>
                        {p.note && (
                          <span style={{ fontSize: 11, color: '#888', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.note}
                          </span>
                        )}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setProductMenuOpenId((prev) => prev === p.id ? null : p.id)}
                            aria-label="תפריט פריט"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 6px', lineHeight: 1, color: '#555', borderRadius: 6 }}
                          >
                            &#8942;
                          </button>
                          {productMenuOpenId === p.id && (
                            <>
                              <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setProductMenuOpenId(null)} />
                              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: 110, overflow: 'hidden' }}>
                                <button type="button" onClick={() => { setProductMenuOpenId(null); openEditProduct(p); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                                  ערוך
                                </button>
                                <button type="button" onClick={() => { setProductMenuOpenId(null); if (window.confirm(`למחוק את הפריט "${p.nameHe}"?`)) deleteProductMutation.mutate(p.id); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'right', fontSize: 14, cursor: 'pointer', color: '#c00' }}>
                                  מחק
                                </button>
                              </div>
                            </>
                          )}
                        </div>
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
                        <input
                          type="text"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          placeholder="שם פריט"
                          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', minWidth: 120 }}
                        />
                        <input
                          type="text"
                          value={newProductUnit}
                          onChange={(e) => setNewProductUnit(e.target.value)}
                          placeholder="יחידה"
                          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', width: 80 }}
                        />
                        <input
                          type="text"
                          value={newProductNote}
                          onChange={(e) => setNewProductNote(e.target.value)}
                          placeholder="הערה קבועה (אופציונלי)"
                          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', minWidth: 160 }}
                        />
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

      {editProduct && (
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
          onClick={() => setEditProduct(null)}
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
            <form onSubmit={handleEditProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>שם פריט</label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>יחידת מידה</label>
                <input
                  type="text"
                  value={editProductUnit}
                  onChange={(e) => setEditProductUnit(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>הערה קבועה</label>
                <textarea
                  value={editProductNote}
                  onChange={(e) => setEditProductNote(e.target.value)}
                  rows={2}
                  placeholder="תופיע אוטומטית כשמוסיפים את הפריט לרשימה"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <DisplayImageForm
                label="תמונה / אייקון"
                displayType={editProductDisplayImageType}
                iconId={editProductIconId}
                imageUrl={editProductImageUrl}
                onDisplayTypeChange={(v) => {
                  setEditProductDisplayImageType(v);
                  if (v === 'icon') setEditProductImageUrl('');
                  if (v === 'link' || v === 'web') { setEditProductImageUrl(''); }
                  if (v === 'device') setTimeout(() => editProductFileInputRef.current?.click(), 0);
                }}
                onIconIdChange={setEditProductIconId}
                onImageUrlChange={setEditProductImageUrl}
                fileInputRef={editProductFileInputRef}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="submit"
                  disabled={updateProductMutation.isPending || !editProductName.trim()}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: updateProductMutation.isPending || !editProductName.trim() ? '#ccc' : 'var(--color-primary)',
                    color: updateProductMutation.isPending || !editProductName.trim() ? '#666' : '#fff',
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    cursor: updateProductMutation.isPending || !editProductName.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updateProductMutation.isPending ? 'שומר...' : 'שמור'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  style={{ padding: 12, background: '#eee', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                >
                  ביטול
                </button>
              </div>
            </form>
            <input
              ref={editProductFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !editProduct) return;
                e.target.value = '';
                const productName = editProduct.nameHe;
                try {
                  await uploadFile(`/api/upload/product/${editProduct.id}`, file);
                  queryClient.invalidateQueries({ queryKey: ['products'] });
                  setEditProduct(null);
                  setProductImageToast({ message: `תמונת "${productName}" עודכנה`, isError: false });
                  setTimeout(() => setProductImageToast(null), 3000);
                } catch (err) {
                  console.error(err);
                  setProductImageToast({ message: err instanceof Error ? err.message : 'שגיאה בהעלאת התמונה', isError: true });
                  setTimeout(() => setProductImageToast(null), 5000);
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

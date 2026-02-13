import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, getProducts, createCategory, createProduct, updateCategory, updateProduct, deleteCategory, deleteProduct, inviteToAllCategories } from '../api/products';
import { uploadFile } from '../api/client';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { DisplayImageForm, ICON_OPTIONS } from '../components/DisplayImageForm';
import { ImageSearchPicker } from '../components/ImageSearchPicker';
import { useAuthStore } from '../store/authStore';
import type { CategoryDto, ProductDto } from '../types';

type DisplayImageType = 'icon' | 'device' | 'link' | 'web';

function isProductImageErrorToast(msg: string): boolean {
  return /(401|403|404|500)\b|^HTTP\s|\bשגיאה\b|Forbidden|Unauthorized/i.test(msg);
}

export function Categories() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.userId ?? '';
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
  const [editImageProduct, setEditImageProduct] = useState<ProductDto | null>(null);
  const [productDisplayImageType, setProductDisplayImageType] = useState<DisplayImageType>('icon');
  const [productIconId, setProductIconId] = useState('');
  const [productImageUrlInput, setProductImageUrlInput] = useState('');
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const [productImageToast, setProductImageToast] = useState<string | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<CategoryDto | null>(null);
  const [shareAllOpen, setShareAllOpen] = useState(false);
  const [shareAllEmail, setShareAllEmail] = useState('');
  const [shareAllPhone, setShareAllPhone] = useState('');
  const [shareAllError, setShareAllError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
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
    mutationFn: (body: { nameHe: string; iconId?: string | null; imageUrl?: string | null; sortOrder?: number }) =>
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
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, imageUrl, iconId }: { id: string; imageUrl: string | null; iconId: string }) =>
      updateProduct(id, { imageUrl, iconId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditImageProduct(null);
    },
  });

  const shareAllMutation = useMutation({
    mutationFn: (body: { email?: string; phone?: string }) => inviteToAllCategories(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShareAllOpen(false);
      setShareAllEmail('');
      setShareAllPhone('');
      setShareAllError(null);
      const msg = data.categoriesAdded === data.totalCategories
        ? `הוזמן ל־${data.categoriesAdded} קטגוריות`
        : `הוזמן ל־${data.categoriesAdded} מתוך ${data.totalCategories} קטגוריות`;
      setProductImageToast(msg);
      setTimeout(() => setProductImageToast(null), 3000);
    },
    onError: (err: Error) => {
      setShareAllError(err.message || 'שגיאה בהזמנה');
    },
  });

  const ownedCategories = categories.filter((c) => c.ownerId === currentUserId);
  const ownedCategoriesCount = ownedCategories.length;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!nameHe.trim()) return;
    if (displayImageType === 'icon' && !iconId) return;
    if (displayImageType === 'device' && !pendingCategoryFile) return;
    if (displayImageType === 'link' && !imageUrl.trim()) return;
    pendingCreateFileRef.current = displayImageType === 'device' ? pendingCategoryFile : null;
    createMutation.mutate({
      nameHe: nameHe.trim(),
      iconId: displayImageType === 'icon' ? (iconId || null) : null,
      imageUrl: (displayImageType === 'link' || displayImageType === 'web') ? (imageUrl.trim() || null) : null,
      sortOrder: categories.length,
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
        iconId: editDisplayImageType === 'icon' ? (editIconId || null) : null,
        imageUrl: editDisplayImageType !== 'icon' ? (editImageUrl.trim() || null) : null,
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
    });
  }

  function openProductImageEdit(p: ProductDto, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(null); // close category edit so we only edit the product, not the category
    setEditImageProduct(p);
    setProductDisplayImageType(p.imageUrl ? 'link' : 'icon');
    setProductIconId(p.iconId ?? p.categoryIconId ?? '');
    setProductImageUrlInput(p.imageUrl || '');
  }

  function handleProductImageSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editImageProduct) return;
    const imageUrl = productDisplayImageType === 'icon' ? '' : (productImageUrlInput.trim() || null);
    const iconId = productDisplayImageType === 'icon' ? (productIconId || '') : '';
    updateProductMutation.mutate({ id: editImageProduct.id, imageUrl, iconId });
  }

  function handleShareAllSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShareAllError(null);
    const email = shareAllEmail.trim() || undefined;
    const phone = shareAllPhone.trim() || undefined;
    if (!email && !phone) {
      setShareAllError('הזן אימייל או טלפון');
      return;
    }
    shareAllMutation.mutate({ email, phone });
  }

  return (
    <>
      <AppBar title="ניהול קטגוריות" backTo="/lists" />
      {productImageToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: 16,
            right: 16,
            padding: 14,
            background: isProductImageErrorToast(productImageToast) ? 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)' : 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
            color: '#fff',
            borderRadius: 12,
            textAlign: 'center',
            zIndex: 1002,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            fontWeight: 500,
          }}
        >
          {isProductImageErrorToast(productImageToast) ? '✕ ' : '✓ '}{productImageToast}
        </div>
      )}
      <main style={{ padding: 16 }}>
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
              placeholder="למשל: משקאות"
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
                  setIconId('');
                  setImageUrl('');
                  setTimeout(() => createCategoryFileInputRef.current?.click(), 0);
                }
                if (v === 'link' || v === 'web') { setIconId(''); setPendingCategoryFile(null); }
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
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>בחירת אייקון</label>
              <select
                value={iconId}
                onChange={(e) => setIconId(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
              >
                <option value="">— בחר אייקון —</option>
                {ICON_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
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
              <ImageSearchPicker onSelect={(url) => setImageUrl(url)} placeholder="למשל: חלב, לחם, ירקות" />
              {imageUrl && (
                <p style={{ marginTop: 8, fontSize: 12, color: '#2e7d32' }}>נבחרה תמונה ✓</p>
              )}
            </div>
          )}
          {(() => {
            const hasName = !!nameHe.trim();
            const hasIconOrImage =
              (displayImageType === 'icon' && !!iconId) ||
              (displayImageType === 'device' && !!pendingCategoryFile) ||
              (displayImageType === 'link' && !!imageUrl.trim()) ||
              (displayImageType === 'web' && !!imageUrl.trim());
            const canSubmit = hasName && hasIconOrImage && !createMutation.isPending;
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

        {categories.length > 0 && (
          <div style={{
            marginBottom: 24,
            padding: 16,
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 600, color: '#1565c0', fontSize: 15 }}>שיתוף קטגוריות</div>
              <div style={{ fontSize: 13, color: '#1976d2', marginTop: 2 }}>
                שתף את כל הקטגוריות שלך עם משתמש אחר, או לחץ על קטגוריה לניהול שיתוף
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setShareAllOpen(true); setShareAllError(null); setShareAllEmail(''); setShareAllPhone(''); }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: '#fff',
                borderRadius: 8,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontSize: 15,
                boxShadow: '0 2px 6px rgba(21,101,192,0.3)',
              }}
            >
              👥 שיתוף כל הקטגוריות
            </button>
          </div>
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
                overflow: 'hidden',
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
                {c.memberCount > 1 && (
                  <span
                    title={`משותף עם ${c.memberCount - 1} משתמשים`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '2px 8px',
                      background: '#e3f2fd',
                      color: '#1565c0',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    👥 {c.memberCount}
                  </span>
                )}
                {c.ownerId !== currentUserId && (
                  <span
                    style={{
                      padding: '2px 8px',
                      background: '#fff3e0',
                      color: '#e65100',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    קטגוריה משותפת
                  </span>
                )}
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
                        if (v === 'link' || v === 'web') setEditIconId('');
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
                    <select
                      value={editIconId}
                      onChange={(e) => setEditIconId(e.target.value)}
                      style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
                    >
                      <option value="">ללא</option>
                      {ICON_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
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
                        placeholder="למשל: חלב, לחם"
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
                  <Link
                    to={`/categories/${c.id}/share`}
                    style={{
                      padding: '6px 12px',
                      background: c.ownerId === currentUserId
                        ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                        : '#e3f2fd',
                      color: c.ownerId === currentUserId ? '#fff' : '#1565c0',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: 'none',
                      boxShadow: c.ownerId === currentUserId ? '0 1px 3px rgba(21,101,192,0.3)' : 'none',
                    }}
                  >
                    👥 {c.ownerId === currentUserId ? 'שיתוף' : 'חברים'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    style={{ padding: '6px 10px', background: '#eee', borderRadius: 8, fontSize: 14 }}
                  >
                    ערוך
                  </button>
                  {c.ownerId === currentUserId && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteCategory(c)}
                      style={{ padding: '6px 10px', background: '#fee', color: '#c00', borderRadius: 8, fontSize: 14 }}
                    >
                      מחק
                    </button>
                  )}
                </>
              )}
              </div>

              {editing?.id !== c.id && (
                <div style={{ padding: '0 12px 12px 12px', borderTop: '1px solid #eee', marginTop: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8, marginTop: 8 }}>מוצרים בקטגוריה</div>
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
                        <span style={{ flex: 1 }}>{p.nameHe}</span>
                        <span style={{ fontSize: 12, color: '#666' }}>{p.defaultUnit}</span>
                        <button
                          type="button"
                          onClick={(e) => openProductImageEdit(p, e)}
                          style={{ padding: '4px 8px', background: '#eee', borderRadius: 6, fontSize: 12 }}
                          title="תמונת מוצר / אייקון"
                        >
                          אייקון
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`למחוק את המוצר "${p.nameHe}"?`)) deleteProductMutation.mutate(p.id);
                          }}
                          style={{ padding: '4px 8px', background: '#fee', color: '#c00', borderRadius: 6, fontSize: 12 }}
                        >
                          מחק
                        </button>
                      </li>
                    ))}
                  </ul>
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
                          placeholder="שם מוצר"
                          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', minWidth: 120 }}
                        />
                        <input
                          type="text"
                          value={newProductUnit}
                          onChange={(e) => setNewProductUnit(e.target.value)}
                          placeholder="יחידה"
                          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', width: 80 }}
                        />
                        <button
                          type="submit"
                          disabled={createProductMutation.isPending || !newProductName.trim()}
                          style={{ padding: '8px 12px', background: 'var(--color-primary)', color: '#fff', borderRadius: 8, fontSize: 14 }}
                        >
                          {createProductMutation.isPending ? 'מוסיף...' : 'הוסף מוצר'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddProductCategoryId(null);
                            setNewProductName('');
                            setNewProductUnit('יחידה');
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
                        label="תמונת מוצר"
                        displayType={newProductDisplayImageType}
                        iconId={newProductIconId}
                        imageUrl={newProductImageUrl}
                        onDisplayTypeChange={(v) => {
                          setNewProductDisplayImageType(v);
                          if (v === 'icon') setNewProductImageUrl('');
                          if (v === 'link' || v === 'web') { setNewProductIconId(''); setNewProductImageUrl(''); }
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
                      + הוסף מוצר לקטגוריה
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 24, fontSize: 14, color: '#666' }}>
          <Link to="/lists" style={{ color: 'var(--color-primary)' }}>
            ← חזרה לרשימות
          </Link>
        </p>
      </main>

      {shareAllOpen && (
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
          onClick={() => { if (!shareAllError && !shareAllMutation.isPending) { setShareAllOpen(false); setShareAllError(null); } }}
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
            <h3 style={{ margin: '0 0 8px' }}>שיתוף כל הקטגוריות</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#555' }}>
              המשתמש יקבל גישה לעריכה לכל הקטגוריות שבבעלותך.
            </p>
            <form onSubmit={handleShareAllSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>אימייל</label>
                <input
                  type="email"
                  value={shareAllEmail}
                  onChange={(e) => { setShareAllEmail(e.target.value); setShareAllError(null); }}
                  placeholder="email@example.com"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>או מספר טלפון</label>
                <input
                  type="tel"
                  value={shareAllPhone}
                  onChange={(e) => { setShareAllPhone(e.target.value); setShareAllError(null); }}
                  placeholder="050-1234567"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                />
              </div>
              {shareAllError && (
                <p style={{ margin: 0, fontSize: 14, color: '#c00', fontWeight: 500 }}>{shareAllError}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="submit"
                  disabled={shareAllMutation.isPending}
                  style={{ flex: 1, padding: 12, background: 'var(--color-primary)', color: '#fff', fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer' }}
                >
                  {shareAllMutation.isPending ? 'שולח...' : 'הזמן'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShareAllOpen(false); setShareAllError(null); }}
                  style={{ padding: 12, background: '#eee', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {editImageProduct && (
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
          onClick={() => setEditImageProduct(null)}
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
            <h3 style={{ margin: '0 0 16px' }}>תמונת מוצר: {editImageProduct.nameHe}</h3>
            <form onSubmit={handleProductImageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DisplayImageForm
                displayType={productDisplayImageType}
                iconId={productIconId}
                imageUrl={productImageUrlInput}
                onDisplayTypeChange={setProductDisplayImageType}
                onIconIdChange={setProductIconId}
                onImageUrlChange={setProductImageUrlInput}
                fileInputRef={productImageInputRef}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="submit"
                  disabled={updateProductMutation.isPending}
                  style={{ flex: 1, padding: 12, background: 'var(--color-primary)', color: '#fff', fontWeight: 600 }}
                >
                  {updateProductMutation.isPending ? 'שומר...' : 'שמור'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditImageProduct(null)}
                  style={{ padding: 12, background: '#eee' }}
                >
                  ביטול
                </button>
              </div>
            </form>
            <input
              ref={productImageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !editImageProduct) return;
                e.target.value = '';
                const productName = editImageProduct.nameHe;
                try {
                  await uploadFile(`/api/upload/product/${editImageProduct.id}`, file);
                  queryClient.invalidateQueries({ queryKey: ['products'] });
                  setEditImageProduct(null);
                  setProductImageUrlInput('');
                  setProductImageToast(`תמונת "${productName}" עודכנה`);
                  setTimeout(() => setProductImageToast(null), 3000);
                } catch (err) {
                  console.error(err);
                  setProductImageToast(err instanceof Error ? err.message : 'שגיאה בהעלאת התמונה');
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

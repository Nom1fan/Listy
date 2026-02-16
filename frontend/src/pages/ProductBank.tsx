import { useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, getProducts, updateProduct } from '../api/products';
import { addListItem } from '../api/lists';
import { uploadFile } from '../api/client';
import { useWorkspaceStore } from '../store/workspaceStore';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { DisplayImageForm, type DisplayImageType } from '../components/DisplayImageForm';
import { ViewModeToggle, useViewMode } from '../components/ViewModeToggle';
import type { ProductDto } from '../types';

export function ProductBank() {
  const { listId } = useParams<{ listId: string }>();
  const [viewMode, setViewMode] = useViewMode();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState<ProductDto | null>(null);
  const [editImageProduct, setEditImageProduct] = useState<ProductDto | null>(null);
  const [productDisplayImageType, setProductDisplayImageType] = useState<DisplayImageType>('icon');
  const [productIconId, setProductIconId] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', activeWorkspaceId],
    queryFn: () => getCategories(activeWorkspaceId || undefined),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', categoryFilter, search],
    queryFn: () => getProducts(categoryFilter || undefined, search || undefined),
  });

  const showGroupedByCategory = !categoryFilter && products.length > 0;
  const productsByCategory = useMemo(() => {
    if (!showGroupedByCategory) return {} as Record<string, ProductDto[]>;
    const map: Record<string, ProductDto[]> = {};
    for (const p of products) {
      if (!map[p.categoryId]) map[p.categoryId] = [];
      map[p.categoryId].push(p);
    }
    // Within each category: most frequent products right-most (RTL), so sort by addCount descending
    for (const catId of Object.keys(map)) {
      map[catId].sort((a, b) => (b.addCount ?? 0) - (a.addCount ?? 0));
    }
    return map;
  }, [showGroupedByCategory, products]);

  // Categories: API already returns them sorted by addCount desc (most frequent on top), then sortOrder
  const categoryOrder = useMemo(() => {
    if (!showGroupedByCategory) return [] as string[];
    return categories
      .filter((c) => productsByCategory[c.id]?.length)
      .map((c) => c.id);
  }, [showGroupedByCategory, categories, productsByCategory]);

  const addMutation = useMutation({
    mutationFn: (body: { productId?: string; customNameHe?: string; quantity?: number; unit?: string; note?: string }) =>
      addListItem(listId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] });
      const productName = addModal?.nameHe ?? '';
      setToast({ message: productName ? `${productName} נוסף לרשימה` : 'נוסף לרשימה', isError: false });
      setTimeout(() => setToast(null), 3000);
      setAddModal(null);
      setQuantity('1');
      setNote('');
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'שגיאה בהוספת הפריט', isError: true });
      setTimeout(() => setToast(null), 5000);
      setAddModal(null);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, imageUrl, iconId, version }: { id: string; imageUrl: string | null; iconId: string | null; version?: number }) =>
      updateProduct(id, { imageUrl, iconId, version }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditImageProduct(null);
      setImageUrlInput('');
    },
    onError: (err: Error) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setToast({ message: err.message || 'שגיאה בעדכון הפריט', isError: true });
      setTimeout(() => setToast(null), 5000);
    },
  });

  async function handleProductImageSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editImageProduct) return;
    // Send '' for imageUrl when icon so backend clears image; send '' for iconId when custom image to clear override
    const imageUrl = productDisplayImageType === 'icon' ? '' : (imageUrlInput.trim() || null);
    const iconId = productDisplayImageType === 'icon' ? (productIconId || '') : '';
    updateProductMutation.mutate({ id: editImageProduct.id, imageUrl, iconId, version: editImageProduct.version });
  }

  async function handleProductImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editImageProduct) return;
    e.target.value = '';
    try {
      await uploadFile(`/api/upload/product/${editImageProduct.id}`, file);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditImageProduct(null);
      setImageUrlInput('');
      setToast({ message: `תמונת "${editImageProduct.nameHe}" עודכנה`, isError: false });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ message: err instanceof Error ? err.message : 'שגיאה בהעלאת התמונה', isError: true });
      setTimeout(() => setToast(null), 5000);
    }
  }

  function openEditImage(p: ProductDto, e: React.MouseEvent) {
    e.stopPropagation();
    setEditImageProduct(p);
    setProductDisplayImageType(p.imageUrl ? 'link' : 'icon');
    setProductIconId(p.iconId ?? p.categoryIconId ?? '');
    setImageUrlInput(p.imageUrl || '');
  }

  function openAdd(p: ProductDto) {
    setAddModal(p);
    setQuantity('1');
    setNote(p.note || '');
  }

  function submitAdd() {
    if (!addModal) return;
    const q = parseFloat(quantity) || 1;
    addMutation.mutate({
      productId: addModal.id,
      quantity: q,
      unit: addModal.defaultUnit,
      note: note || undefined,
    });
  }

  return (
    <>
      <AppBar title="הוסף מקטגוריות" backTo={`/lists/${listId}`} right={<ViewModeToggle viewMode={viewMode} onChange={setViewMode} />} />
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
            zIndex: 1002,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {toast.isError ? '✕ ' : '✓ '}{toast.message}
        </div>
      )}
      <main style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="search"
            placeholder="חיפוש פריטים"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 120,
              padding: 10,
              borderRadius: 8,
              border: '1px solid #ccc',
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', minWidth: 140 }}
          >
            <option value="">כל הקטגוריות</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameHe}
              </option>
            ))}
          </select>
        </div>

        {showGroupedByCategory ? (
          <>
            {categoryOrder.map((catId) => {
              const cat = categories.find((c) => c.id === catId);
              const catProducts = productsByCategory[catId] ?? [];
              if (!cat || catProducts.length === 0) return null;
              return (
                <section key={catId} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                      paddingBottom: 6,
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    <CategoryIcon iconId={cat.iconId} imageUrl={cat.imageUrl} size={24} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{cat.nameHe}</span>
                  </div>
                  {viewMode === 'grid' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                    {catProducts.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          position: 'relative',
                          padding: 12,
                          background: '#fff',
                          borderRadius: 12,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          textAlign: 'right',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() => openAdd(p)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                          }}
                        >
                          <CategoryIcon iconId={p.iconId ?? p.categoryIconId} imageUrl={p.imageUrl} size={64} />
                          <span style={{ fontWeight: 500 }}>{p.nameHe}</span>
                          <span style={{ fontSize: 12, color: '#666' }}>{p.defaultUnit}</span>
                          {p.note && (
                            <span style={{ fontSize: 11, color: '#888', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.note}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openEditImage(p, e)}
                          style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: 'none',
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            fontSize: 14,
                            cursor: 'pointer',
                          }}
                          aria-label="שנה תמונה"
                        >
                          🖼
                        </button>
                      </div>
                    ))}
                  </div>
                  ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {catProducts.map((p) => (
                      <li
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 0',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <button
                          onClick={() => openAdd(p)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <CategoryIcon iconId={p.iconId ?? p.categoryIconId} imageUrl={p.imageUrl} size={28} />
                          <span style={{ fontWeight: 500, flex: 1, textAlign: 'right' }}>{p.nameHe}</span>
                          <span style={{ fontSize: 12, color: '#666' }}>{p.defaultUnit}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openEditImage(p, e)}
                          style={{
                            padding: '4px 8px',
                            background: '#eee',
                            borderRadius: 6,
                            fontSize: 12,
                            border: 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                          aria-label="שנה תמונה"
                        >
                          🖼
                        </button>
                      </li>
                    ))}
                  </ul>
                  )}
                </section>
              );
            })}
          </>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'relative',
                  padding: 12,
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  textAlign: 'right',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <button
                  onClick={() => openAdd(p)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                  }}
                >
                  <CategoryIcon iconId={p.iconId ?? p.categoryIconId} imageUrl={p.imageUrl} size={64} />
                  <span style={{ fontWeight: 500 }}>{p.nameHe}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>{p.defaultUnit}</span>
                  {p.note && (
                    <span style={{ fontSize: 11, color: '#888', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.note}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => openEditImage(p, e)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: 'none',
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  aria-label="שנה תמונה"
                >
                  🖼
                </button>
              </div>
            ))}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {products.map((p) => (
              <li
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  background: '#fff',
                  borderRadius: 10,
                  marginBottom: 6,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                }}
              >
                <button
                  onClick={() => openAdd(p)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <CategoryIcon iconId={p.iconId ?? p.categoryIconId} imageUrl={p.imageUrl} size={28} />
                  <span style={{ fontWeight: 500, flex: 1, textAlign: 'right' }}>{p.nameHe}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>{p.defaultUnit}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => openEditImage(p, e)}
                  style={{
                    padding: '4px 8px',
                    background: '#eee',
                    borderRadius: 6,
                    fontSize: 12,
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  aria-label="שנה תמונה"
                >
                  🖼
                </button>
              </li>
            ))}
          </ul>
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
              zIndex: 1001,
              padding: 24,
            }}
            onClick={() => { setEditImageProduct(null); setImageUrlInput(''); }}
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
              <h3 style={{ margin: '0 0 16px' }}>תמונת פריט: {editImageProduct.nameHe}</h3>
              <form onSubmit={handleProductImageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <DisplayImageForm
                  displayType={productDisplayImageType}
                  iconId={productIconId}
                  imageUrl={imageUrlInput}
                  onDisplayTypeChange={setProductDisplayImageType}
                  onIconIdChange={setProductIconId}
                  onImageUrlChange={setImageUrlInput}
                  fileInputRef={fileInputRef}
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
                    onClick={() => { setEditImageProduct(null); setImageUrlInput(''); }}
                    style={{ padding: 12, background: '#eee' }}
                  >
                    ביטול
                  </button>
                </div>
              </form>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProductImageFile}
              />
            </div>
          </div>
        )}

        {addModal && (
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
            onClick={() => setAddModal(null)}
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
              <h3 style={{ margin: '0 0 16px' }}>{addModal.nameHe}</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>כמות</label>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>הערה</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={submitAdd}
                  disabled={addMutation.isPending}
                  style={{ flex: 1, padding: 12, background: 'var(--color-primary)', color: '#fff', fontWeight: 600 }}
                >
                  {addMutation.isPending ? 'מוסיף...' : 'הוסף לרשימה'}
                </button>
                <button onClick={() => setAddModal(null)} style={{ padding: 12, background: '#eee' }}>
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

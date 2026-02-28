import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, getProducts, updateProduct, createCategory } from '../api/products';
import { uploadFile, ApiError } from '../api/client';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { CustomSelect } from '../components/CustomSelect';
import type { DisplayImageType } from '../components/DisplayImageForm';
import { ImageSourceDialog } from '../components/ImageSourceDialog';
import { EmojiPickerDialog } from '../components/EmojiPicker';
import { createPortal } from 'react-dom';
import { useWorkspaceStore } from '../store/workspaceStore';

function getImageUrl(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_BASE || '';
  return base + url;
}

function ImagePlaceholderIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function ProductEdit() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const fromCategories = location.state?.from === 'categories';
  const backTo = fromCategories ? '/lists?tab=categories' : '/lists';

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [displayImageType, setDisplayImageType] = useState<DisplayImageType>('icon');
  const [iconId, setIconId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageSourceDialogOpen, setImageSourceDialogOpen] = useState(false);
  const [showEmojiPickerDialog, setShowEmojiPickerDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [unitSectionExpanded, setUnitSectionExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingHighlightRef = useRef<{ categoryId: string; productId: string } | null>(null);

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
    enabled: !!productId,
  });

  const { data: workspaceCategories = [] } = useQuery({
    queryKey: ['categories', activeWorkspaceId],
    queryFn: () => getCategories(activeWorkspaceId || undefined),
    enabled: !!activeWorkspaceId,
  });

  const product = allProducts.find((p) => p.id === productId);

  useEffect(() => {
    if (product) {
      setName(product.nameHe);
      setUnit(product.defaultUnit ?? '');
      setNote(product.note || '');
      setCategoryId(product.categoryId || '');
      setDisplayImageType(product.imageUrl ? 'link' : 'icon');
      setIconId(product.iconId ?? product.categoryIconId ?? '');
      setImageUrl(product.imageUrl || '');
      const hasUnit = (product.defaultUnit ?? '').trim() !== '' && product.defaultUnit !== 'יחידה';
      setUnitSectionExpanded(hasUnit);
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; nameHe?: string; defaultUnit?: string; note?: string | null; imageUrl?: string | null; iconId?: string | null; categoryId?: string; version?: number }) =>
      updateProduct(id, body),
    onSuccess: () => {
      setIsSaving(false);
      setSaveError(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      const highlight = pendingHighlightRef.current;
      pendingHighlightRef.current = null;
      if (fromCategories && highlight) {
        navigate(backTo, { state: { tab: 'categories', highlightCategoryId: highlight.categoryId, highlightProductId: highlight.productId } });
      } else {
        navigate(backTo);
      }
    },
    onError: (err: Error) => {
      setIsSaving(false);
      setSaveError(err instanceof ApiError ? err.message : 'שגיאה בשמירה');
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setIsSaving(true);
    setSaveError(null);
    let effectiveCategoryId = categoryId;
    if (categoryId === '__new__' && newCategoryName.trim() && activeWorkspaceId) {
      try {
        const newCategory = await createCategory({
          nameHe: newCategoryName.trim(),
          workspaceId: activeWorkspaceId,
        });
        queryClient.invalidateQueries({ queryKey: ['categories', activeWorkspaceId] });
        effectiveCategoryId = newCategory.id;
      } catch (err) {
        setIsSaving(false);
        setSaveError(err instanceof ApiError ? err.message : 'שגיאה ביצירת קטגוריה');
        return;
      }
    } else if (categoryId === '__new__') {
      effectiveCategoryId = product.categoryId || '';
    } else if (!effectiveCategoryId && activeWorkspaceId) {
      // "ללא קטגוריה (אחר)" — use "אחר" category (get or create)
      const otherCat = workspaceCategories.find((c) => c.nameHe === 'אחר');
      if (otherCat) {
        effectiveCategoryId = otherCat.id;
      } else {
        try {
          const newCategory = await createCategory({
            nameHe: 'אחר',
            workspaceId: activeWorkspaceId,
          });
          queryClient.invalidateQueries({ queryKey: ['categories', activeWorkspaceId] });
          effectiveCategoryId = newCategory.id;
        } catch (err) {
          setIsSaving(false);
          setSaveError(err instanceof ApiError ? err.message : 'שגיאה ביצירת קטגוריה');
          return;
        }
      }
    }
    const defaultUnitVal = unitSectionExpanded ? (unit.trim() || 'יחידה') : 'יחידה';
    if (fromCategories && effectiveCategoryId) {
      pendingHighlightRef.current = { categoryId: effectiveCategoryId, productId: product.id };
    }
    updateMutation.mutate({
      id: product.id,
      nameHe: name.trim(),
      defaultUnit: defaultUnitVal,
      note: note.trim() || null,
      categoryId: effectiveCategoryId || undefined,
      imageUrl: displayImageType === 'icon' ? '' : (imageUrl.trim() || null),
      iconId: displayImageType === 'icon' ? (iconId || null) : null,
      version: product.version,
    });
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !productId) return;
    e.target.value = '';
    uploadFile(`/api/upload/product/${productId}`, file)
      .then(({ url }) => {
        setImageUrl(url);
        setDisplayImageType('link');
        queryClient.invalidateQueries({ queryKey: ['products'] });
      })
      .catch(console.error);
  }

  if (!productId) {
    return <Navigate to={backTo} replace />;
  }
  if (allProducts.length > 0 && !product) {
    return <Navigate to={backTo} replace />;
  }
  if (!product) {
    return (
      <>
        <AppBar title="עריכת פריט" backTo={backTo} />
        <main style={{ padding: 16 }}><p>טוען...</p></main>
      </>
    );
  }

  const initialDisplayType: DisplayImageType = product.imageUrl ? 'link' : 'icon';
  const initialIconId = product.iconId ?? '';
  const initialImageUrl = product.imageUrl ?? '';
  const effectiveCategoryIdForCompare = categoryId === '__new__' ? (newCategoryName.trim() ? '__new__' : (product.categoryId || '')) : categoryId;
  const hasChanges =
    name.trim() !== (product.nameHe ?? '').trim() ||
    (unitSectionExpanded ? (unit.trim() || 'יחידה') : 'יחידה') !== (product.defaultUnit ?? 'יחידה') ||
    (note || '').trim() !== (product.note ?? '').trim() ||
    effectiveCategoryIdForCompare !== (product.categoryId || '') ||
    displayImageType !== initialDisplayType ||
    (displayImageType === 'icon' && (iconId || '') !== initialIconId) ||
    ((displayImageType === 'link' || displayImageType === 'web') && (imageUrl.trim() || '') !== (initialImageUrl || '').trim());

  const currentImageUrl = imageUrl.trim() || (product.imageUrl || '');
  const showImage = displayImageType === 'link' || displayImageType === 'web' ? currentImageUrl : null;

  return (
    <>
      <AppBar title="עריכת פריט" backTo={backTo} />
      <main style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setImageSourceDialogOpen(true)}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: showImage || (displayImageType === 'icon' && iconId) ? 'transparent' : '#e8e8e8',
              border: '2px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showImage ? (
              <img
                src={getImageUrl(showImage)}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : displayImageType === 'icon' && iconId ? (
              <CategoryIcon iconId={iconId} imageUrl={null} size={64} />
            ) : (
              <span style={{ color: '#999' }}><ImagePlaceholderIcon size={48} /></span>
            )}
          </button>
          <ImageSourceDialog
            open={imageSourceDialogOpen}
            onClose={() => setImageSourceDialogOpen(false)}
            onSelectIcon={() => {
              setDisplayImageType('icon');
              setImageUrl('');
              setShowEmojiPickerDialog(true);
            }}
            onSelectDevice={() => {
              setDisplayImageType('device');
              setImageUrl('');
              setTimeout(() => fileInputRef.current?.click(), 0);
            }}
            initialLinkUrl={displayImageType === 'link' || displayImageType === 'web' ? imageUrl : ''}
            onLinkSubmit={(url) => {
              setDisplayImageType('link');
              setImageUrl(url);
            }}
            onSearchSelect={(url) => {
              setDisplayImageType('web');
              setImageUrl(url);
            }}
          />
          {showEmojiPickerDialog &&
            createPortal(
              <EmojiPickerDialog
                selectedEmoji={iconId}
                onSelect={(emoji) => {
                  setIconId(emoji);
                  setShowEmojiPickerDialog(false);
                }}
                onClose={() => setShowEmojiPickerDialog(false)}
              />,
              document.body,
            )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>שם פריט</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            {unitSectionExpanded ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 14 }}>יחידה</label>
                  <button
                    type="button"
                    onClick={() => setUnitSectionExpanded(false)}
                    style={{
                      fontSize: 12,
                      color: '#666',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    הסתר יחידה
                  </button>
                </div>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="יחידה (למשל ליטר, קילו)"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </>
            ) : (
              <button
                type="button"
                onClick={() => setUnitSectionExpanded(true)}
                style={{
                  fontSize: 13,
                  color: '#666',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                הוסף יחידה (אופציונלי)
              </button>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>הערה קבועה</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="תופיע אוטומטית כשמוסיפים את הפריט לרשימה"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          {workspaceCategories.length > 0 && (
            <div>
              <CustomSelect
                label="קטגוריה"
                value={categoryId}
                onChange={setCategoryId}
                placeholder="ללא קטגוריה (אחר)"
                options={[
                  { value: '', label: 'ללא קטגוריה (אחר)' },
                  ...workspaceCategories.map((cat) => ({
                    value: cat.id,
                    label: cat.nameHe,
                    icon: <CategoryIcon iconId={cat.iconId} imageUrl={cat.imageUrl} size={20} />,
                  })),
                  { value: '__new__', label: '➕ קטגוריה חדשה...' },
                ]}
              />
              {categoryId === '__new__' && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="שם הקטגוריה"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageFile}
          />
          {saveError && (
            <div style={{ padding: 10, background: '#ffebee', color: '#c62828', borderRadius: 8, fontSize: 14 }}>
              {saveError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={isSaving || updateMutation.isPending || !name.trim() || !hasChanges}
              style={{
                flex: 1,
                padding: 12,
                background: isSaving || updateMutation.isPending || !name.trim() || !hasChanges ? '#ccc' : 'var(--color-primary)',
                color: isSaving || updateMutation.isPending || !name.trim() || !hasChanges ? '#666' : '#fff',
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                cursor: isSaving || updateMutation.isPending || !name.trim() || !hasChanges ? 'not-allowed' : 'pointer',
              }}
            >
              {isSaving || updateMutation.isPending ? 'שומר...' : 'שמור'}
            </button>
            <button
              type="button"
              onClick={() => navigate(backTo)}
              style={{ padding: 12, background: '#eee', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            >
              ביטול
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

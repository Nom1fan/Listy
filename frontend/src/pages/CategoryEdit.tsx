import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategory, updateCategory, deleteCategory } from '../api/products';
import { uploadFile } from '../api/client';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import type { DisplayImageType } from '../components/DisplayImageForm';
import { ImageSourceDialog } from '../components/ImageSourceDialog';
import { EmojiPickerDialog } from '../components/EmojiPicker';
import { createPortal } from 'react-dom';

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

export function CategoryEdit() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const backTo = '/categories';

  const [nameHe, setNameHe] = useState('');
  const [displayImageType, setDisplayImageType] = useState<DisplayImageType>('icon');
  const [iconId, setIconId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageSourceDialogOpen, setImageSourceDialogOpen] = useState(false);
  const [showEmojiPickerDialog, setShowEmojiPickerDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: category } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => getCategory(categoryId!),
    enabled: !!categoryId,
  });

  useEffect(() => {
    if (category) {
      setNameHe(category.nameHe);
      setDisplayImageType(category.imageUrl ? 'link' : 'icon');
      setIconId(category.iconId ?? '');
      setImageUrl(category.imageUrl ?? '');
    }
  }, [category]);

  const updateMutation = useMutation({
    mutationFn: (payload: { nameHe?: string; iconId?: string | null; imageUrl?: string | null; version?: number }) =>
      updateCategory(categoryId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['categories', category?.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate(backTo);
    },
    onError: (err: Error) => console.error(err),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCategory(categoryId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', category?.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate(backTo);
    },
    onError: (err: Error) => console.error(err),
  });

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !categoryId) return;
    e.target.value = '';
    uploadFile(`/api/upload/category/${categoryId}`, file)
      .then(({ url }) => {
        setImageUrl(url);
        setDisplayImageType('link');
        queryClient.invalidateQueries({ queryKey: ['category', categoryId] });
        queryClient.invalidateQueries({ queryKey: ['categories', category?.workspaceId] });
      })
      .catch(console.error);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    const iconIdVal = displayImageType === 'icon' ? (iconId || '') : '';
    const imageUrlVal = (displayImageType === 'link' || displayImageType === 'web') ? (imageUrl.trim() || '') : '';
    updateMutation.mutate({
      nameHe: nameHe.trim(),
      iconId: iconIdVal || undefined,
      imageUrl: imageUrlVal || undefined,
      version: category.version,
    });
  }

  if (!categoryId) {
    return <Navigate to={backTo} replace />;
  }
  if (!category) {
    return (
      <>
        <AppBar title="ערוך קטגוריה" backTo={backTo} />
        <main style={{ padding: 16 }}><p>טוען...</p></main>
      </>
    );
  }

  const initialDisplayType: DisplayImageType = category.imageUrl ? 'link' : 'icon';
  const initialIconId = category.iconId ?? '';
  const initialImageUrl = category.imageUrl ?? '';
  const isLinkOrWeb = displayImageType === 'link' || displayImageType === 'web';
  const hasChanges =
    nameHe.trim() !== (category.nameHe ?? '').trim() ||
    displayImageType !== initialDisplayType ||
    (displayImageType === 'icon' && (iconId || '') !== initialIconId) ||
    (isLinkOrWeb && (imageUrl.trim() || '') !== (initialImageUrl || '').trim());

  const currentImageUrl = imageUrl.trim() || (category?.imageUrl ?? '');
  const showImage = isLinkOrWeb ? currentImageUrl : null;

  return (
    <>
      <AppBar title="ערוך קטגוריה" backTo={backTo} />
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
            initialLinkUrl={isLinkOrWeb ? imageUrl : ''}
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageFile}
        />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>שם קטגוריה</label>
            <input
              type="text"
              value={nameHe}
              onChange={(e) => setNameHe(e.target.value)}
              placeholder="שם קטגוריה"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={updateMutation.isPending || !nameHe.trim() || !hasChanges}
              style={{
                flex: 1,
                minWidth: 100,
                padding: 12,
                background: updateMutation.isPending || !nameHe.trim() || !hasChanges ? '#ccc' : 'var(--color-primary)',
                color: updateMutation.isPending || !nameHe.trim() || !hasChanges ? '#666' : '#fff',
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                cursor: updateMutation.isPending || !nameHe.trim() || !hasChanges ? 'not-allowed' : 'pointer',
              }}
            >
              {updateMutation.isPending ? 'שומר...' : 'שמור'}
            </button>
            <button
              type="button"
              onClick={() => navigate(backTo)}
              style={{ padding: 12, background: '#eee', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteMutation.isPending}
              style={{ padding: 12, background: '#c62828', color: '#fff', borderRadius: 8, border: 'none', cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer' }}
            >
              מחק
            </button>
          </div>
        </form>

        {confirmDelete && (
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
              <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>מחיקת קטגוריה</h3>
              <p style={{ margin: '0 0 20px', fontSize: 15, color: '#333', lineHeight: 1.6 }}>
                אתה באמת מעוניין למחוק את הקטגוריה <strong>{category.nameHe}</strong>?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    deleteMutation.mutate();
                    setConfirmDelete(false);
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
                  }}
                >
                  {deleteMutation.isPending ? 'מוחק...' : 'כן, מחק'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, padding: 12, background: '#eee', borderRadius: 8, border: 'none', cursor: 'pointer' }}
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

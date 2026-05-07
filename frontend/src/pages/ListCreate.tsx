import { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createList, updateList } from '../api/lists';
import { getCategories } from '../api/products';
import { uploadFile } from '../api/client';
import { useWorkspaceStore } from '../store/workspaceStore';
import { AppBar } from '../components/AppBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { CategoryAttachPicker } from '../components/CategoryAttachPicker';
import type { DisplayImageType } from '../components/DisplayImageForm';
import { ImageSourceDialog } from '../components/ImageSourceDialog';
import { EmojiPickerDialog } from '../components/EmojiPicker';
import { createPortal } from 'react-dom';
import type { ListResponse } from '../types';

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

export function ListCreate() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const [name, setName] = useState('');
  const [displayImageType, setDisplayImageType] = useState<DisplayImageType>('icon');
  const [iconId, setIconId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imageSourceDialogOpen, setImageSourceDialogOpen] = useState(false);
  const [showEmojiPickerDialog, setShowEmojiPickerDialog] = useState(false);
  const [attachedCategoryIds, setAttachedCategoryIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const { data: workspaceCategories = [] } = useQuery({
    queryKey: ['categories', activeWorkspaceId],
    queryFn: () => getCategories(activeWorkspaceId!),
    enabled: !!activeWorkspaceId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; workspaceId: string; iconId?: string | null; imageUrl?: string | null; categoryIds?: string[] }) =>
      createList(payload),
    onSuccess: async (newList: ListResponse) => {
      queryClient.setQueryData<ListResponse[]>(['lists', activeWorkspaceId], (prev) => [...(prev ?? []), newList]);
      queryClient.invalidateQueries({ queryKey: ['lists', activeWorkspaceId] });
      if (pendingFile) {
        try {
          const { url } = await uploadFile(`/api/upload/list/${newList.id}`, pendingFile);
          await updateList(newList.id, { imageUrl: url, version: newList.version });
          queryClient.invalidateQueries({ queryKey: ['list', newList.id] });
          queryClient.invalidateQueries({ queryKey: ['lists', activeWorkspaceId] });
        } catch (err) {
          setToast({ message: err instanceof Error ? err.message : 'שגיאה בהעלאת התמונה', isError: true });
          setTimeout(() => setToast(null), 5000);
        }
      }
      navigate(`/lists/${newList.id}`);
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'שגיאה ביצירת הרשימה', isError: true });
      setTimeout(() => setToast(null), 5000);
    },
  });

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPendingFile(file);
    setDisplayImageType('device');
    setImageUrl('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nameVal = name.trim();
    if (!activeWorkspaceId || !nameVal) return;
    const iconIdVal = displayImageType === 'icon' ? (iconId || '') : '';
    const imageUrlVal = (displayImageType === 'link' || displayImageType === 'web') ? (imageUrl.trim() || '') : '';
    createMutation.mutate({
      name: nameVal,
      workspaceId: activeWorkspaceId,
      iconId: iconIdVal || undefined,
      imageUrl: imageUrlVal || undefined,
      categoryIds: attachedCategoryIds,
    });
  }

  if (!activeWorkspaceId) {
    return <Navigate to="/lists" replace />;
  }

  const isLinkOrWeb = displayImageType === 'link' || displayImageType === 'web';
  const currentImageUrl = imageUrl.trim();
  const showImage = isLinkOrWeb ? currentImageUrl : null;
  const displayPreviewUrl = showImage ? getImageUrl(showImage) : previewObjectUrl;

  const canSubmit = name.trim().length > 0 && !createMutation.isPending;

  return (
    <>
      {toast && (
        <div
          onClick={() => setToast(null)}
          style={{
            position: 'fixed',
            bottom: 'max(24px, env(safe-area-inset-bottom))',
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
      <AppBar title="רשימה חדשה" backTo="/lists" />
      <main style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setImageSourceDialogOpen(true)}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: displayPreviewUrl || (displayImageType === 'icon' && iconId) ? 'transparent' : '#e8e8e8',
              border: '2px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {displayPreviewUrl ? (
              <img
                src={displayPreviewUrl}
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
              setPendingFile(null);
              setShowEmojiPickerDialog(true);
            }}
            onSelectDevice={() => {
              setDisplayImageType('device');
              setImageUrl('');
              setPendingFile(null);
              setTimeout(() => fileInputRef.current?.click(), 0);
            }}
            initialLinkUrl={isLinkOrWeb ? imageUrl : ''}
            onLinkSubmit={(url) => {
              setDisplayImageType('link');
              setImageUrl(url);
              setPendingFile(null);
            }}
            onSearchSelect={(url) => {
              setDisplayImageType('web');
              setImageUrl(url);
              setPendingFile(null);
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
            <label style={{ display: 'block', marginBottom: 4 }}>שם הרשימה <span style={{ color: '#c00' }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם הרשימה"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          {workspaceCategories.length > 0 && (
            <CategoryAttachPicker
              selectedIds={attachedCategoryIds}
              categories={workspaceCategories}
              onSelectedIdsChange={setAttachedCategoryIds}
            />
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                flex: 1,
                minWidth: 100,
                padding: 12,
                background: canSubmit ? 'var(--color-primary)' : '#ccc',
                color: canSubmit ? '#fff' : '#666',
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {createMutation.isPending ? 'יוצר...' : 'צור רשימה'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/lists')}
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

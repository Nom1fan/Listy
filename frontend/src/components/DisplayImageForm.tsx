import { ImageSearchPicker } from './ImageSearchPicker';
import { EmojiPicker } from './EmojiPicker';

export type DisplayImageType = 'icon' | 'device' | 'link' | 'web';

export interface DisplayImageFormProps {
  displayType: DisplayImageType;
  iconId: string;
  imageUrl: string;
  onDisplayTypeChange: (v: DisplayImageType) => void;
  onIconIdChange: (v: string) => void;
  onImageUrlChange: (v: string) => void;
  /** Ref to the hidden file input; parent must render <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={...} /> */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Optional label override for the main dropdown */
  label?: string;
}

export function DisplayImageForm({
  displayType,
  iconId,
  imageUrl,
  onDisplayTypeChange,
  onIconIdChange,
  onImageUrlChange,
  fileInputRef,
  label = 'תמונת תצוגה',
}: DisplayImageFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ display: 'block', marginBottom: 4 }}>{label}</label>
        <select
          value={displayType}
          onChange={(e) => {
            const v = e.target.value as DisplayImageType;
            onDisplayTypeChange(v);
            if (v === 'icon') onImageUrlChange('');
            // Don't clear iconId when switching to link/web/device — the submit
            // logic uses displayType to pick the right value, and preserving
            // iconId lets the user switch back to icon without losing their selection.
            if (v === 'device') setTimeout(() => fileInputRef.current?.click(), 0);
          }}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        >
          <option value="icon">אייקון</option>
          <option value="device">בחר מהמכשיר...</option>
          <option value="link">קישור לתמונה</option>
          <option value="web">חיפוש באינטרנט</option>
        </select>
      </div>
      {displayType === 'icon' && (
        <EmojiPicker
          label="בחירת אייקון"
          value={iconId}
          onChange={onIconIdChange}
        />
      )}
      {displayType === 'device' && (
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>בחר קובץ</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '10px 16px', background: '#eee', border: '1px solid #ccc', borderRadius: 8 }}
          >
            {imageUrl ? 'התמונה הועלתה' : 'בחר מהמכשיר...'}
          </button>
        </div>
      )}
      {displayType === 'link' && (
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>קישור לתמונה</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            placeholder="https://..."
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </div>
      )}
      {displayType === 'web' && (
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>חיפוש תמונה באינטרנט</label>
          <ImageSearchPicker
            onSelect={(url) => onImageUrlChange(url)}
            placeholder="חיפוש תמונה..."
          />
          {imageUrl && <p style={{ marginTop: 8, fontSize: 12, color: '#2e7d32' }}>נבחרה תמונה ✓</p>}
        </div>
      )}
    </div>
  );
}

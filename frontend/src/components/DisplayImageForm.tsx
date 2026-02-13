import { ImageSearchPicker } from './ImageSearchPicker';

const ICON_OPTIONS_RAW = [
  { id: 'dairy', label: '🥛 חלב' },
  { id: 'bread', label: '🍞 לחם' },
  { id: 'vegetables', label: '🥬 ירקות' },
  { id: 'fruits', label: '🍎 פירות' },
  { id: 'meat', label: '🥩 בשר' },
  { id: 'groceries', label: '🛒 מכולת' },
  { id: 'leaf', label: '🌿 עלים' },
  { id: 'carrot', label: '🥕 גזר' },
  { id: 'eggplant', label: '🍆 חציל' },
  { id: 'tomato', label: '🍅 עגבניה' },
  { id: 'avocado', label: '🥑 אבוקדו' },
  { id: 'broccoli', label: '🥦 ברוקולי' },
  { id: 'cucumber', label: '🥒 מלפפון' },
  { id: 'pepper', label: '🫑 פלפל' },
  { id: 'egg', label: '🥚 ביצה' },
  { id: 'cheese', label: '🧀 גבינה' },
  { id: 'honey', label: '🍯 דבש' },
  { id: 'beans', label: '🫘 קטניות' },
  { id: 'lemon', label: '🍋 לימון' },
  { id: 'grapes', label: '🍇 ענבים' },
  { id: 'banana', label: '🍌 בננה' },
  { id: 'mushroom', label: '🍄 פטריות' },
  { id: 'onion', label: '🧅 בצל' },
  { id: 'corn', label: '🌽 תירס' },
  { id: 'olive', label: '🫒 זיתים' },
  { id: 'salad', label: '🥗 סלט' },
  { id: 'strawberry', label: '🍓 תות' },
  { id: 'watermelon', label: '🍉 אבטיח' },
  { id: 'peach', label: '🍑 אפרסק' },
  { id: 'cherry', label: '🍒 דובדבן' },
  { id: 'blueberry', label: '🫐 אוכמניות' },
  { id: 'mango', label: '🥭 מנגו' },
  { id: 'pineapple', label: '🍍 אננס' },
  { id: 'coconut', label: '🥥 קוקוס' },
  { id: 'garlic', label: '🧄 שום' },
  { id: 'potato', label: '🥔 תפוח אדמה' },
  { id: 'yam', label: '🍠 בטטה' },
  { id: 'peanut', label: '🥜 בוטנים' },
];

const hebrewLabel = (label: string) =>
  label.includes(' ') ? label.slice(label.indexOf(' ') + 1) : label;

/** Pre-built icons list, sorted alphabetically by Hebrew label for easy browsing */
export const ICON_OPTIONS = [...ICON_OPTIONS_RAW].sort((a, b) =>
  hebrewLabel(a.label).localeCompare(hebrewLabel(b.label), 'he')
);

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
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        >
          <option value="icon">אייקון</option>
          <option value="device">בחר מהמכשיר...</option>
          <option value="link">קישור לתמונה</option>
          <option value="web">חיפוש באינטרנט</option>
        </select>
      </div>
      {displayType === 'icon' && (
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>בחירת אייקון</label>
          <select
            value={iconId}
            onChange={(e) => onIconIdChange(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          >
            <option value="">ללא</option>
            {ICON_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
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
            placeholder="למשל: חלב, לחם, ירקות"
          />
          {imageUrl && <p style={{ marginTop: 8, fontSize: 12, color: '#2e7d32' }}>נבחרה תמונה ✓</p>}
        </div>
      )}
    </div>
  );
}

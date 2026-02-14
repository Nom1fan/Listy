import { useState } from 'react';
import { LEGACY_ICON_MAP } from './emojiData';

interface CategoryIconProps {
  iconId: string | null;
  imageUrl: string | null;
  size?: number;
}

function getImageUrl(url: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) {
    const base = import.meta.env.VITE_API_BASE || '';
    return base + trimmed;
  }
  return 'https://' + trimmed;
}

export function CategoryIcon({ iconId, imageUrl, size = 32 }: CategoryIconProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = imageUrl ? getImageUrl(imageUrl) : '';
  const showImage = imageUrl && resolvedUrl && !imgError;

  if (showImage) {
    return (
      <img
        src={resolvedUrl}
        alt=""
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8 }}
        onError={() => setImgError(true)}
      />
    );
  }
  // Legacy IDs (e.g. 'dairy') are mapped to emojis; new IDs are the emoji character itself.
  // Emoji code points are > U+00FF, so any plain ASCII string is treated as unknown → fallback.
  const resolved = iconId ? LEGACY_ICON_MAP[iconId] : undefined;
  const emoji = resolved
    ? resolved
    : iconId && iconId.codePointAt(0)! > 0xff
      ? iconId
      : '📦';
  return (
    <span style={{ fontSize: size * 0.8, lineHeight: 1 }} role="img" aria-hidden>
      {emoji}
    </span>
  );
}

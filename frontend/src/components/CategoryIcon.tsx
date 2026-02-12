import { useState } from 'react';

const ICON_MAP: Record<string, string> = {
  dairy: '🥛',
  bread: '🍞',
  vegetables: '🥬',
  fruits: '🍎',
  meat: '🥩',
  groceries: '🛒',
  leaf: '🌿',
  carrot: '🥕',
  eggplant: '🍆',
  tomato: '🍅',
  avocado: '🥑',
  broccoli: '🥦',
  cucumber: '🥒',
  pepper: '🫑',
  egg: '🥚',
  cheese: '🧀',
  honey: '🍯',
  beans: '🫘',
  lemon: '🍋',
  grapes: '🍇',
  banana: '🍌',
  mushroom: '🍄',
  onion: '🧅',
  corn: '🌽',
  olive: '🫒',
  salad: '🥗',
  strawberry: '🍓',
  watermelon: '🍉',
  peach: '🍑',
  cherry: '🍒',
  blueberry: '🫐',
  mango: '🥭',
  pineapple: '🍍',
  coconut: '🥥',
  garlic: '🧄',
  potato: '🥔',
  yam: '🍠',
  peanut: '🥜',
};

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
  const emoji = iconId ? ICON_MAP[iconId] ?? '📦' : '📦';
  return (
    <span style={{ fontSize: size * 0.8, lineHeight: 1 }} role="img" aria-hidden>
      {emoji}
    </span>
  );
}

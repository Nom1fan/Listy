import pepperOrangeSrc from '../assets/icons/emoji/pepper_orange.png';
import pepperRedSrc from '../assets/icons/emoji/pepper_red.png';
import pepperYellowSrc from '../assets/icons/emoji/pepper_yellow.png';
import sprayBottleSrc from '../assets/icons/emoji/spray_bottle.svg';

export type AssetIconId = 'spray_bottle' | 'pepper_orange' | 'pepper_red' | 'pepper_yellow';

export interface AssetIconItem {
  id: AssetIconId;
  src: string;
  labelHe: string;
  labelEn: string;
  keywords: string[];
}

export const ASSET_ICON_MAP: Record<AssetIconId, AssetIconItem> = {
  spray_bottle: {
    id: 'spray_bottle',
    src: sprayBottleSrc,
    labelHe: 'ספריי ניקוי',
    labelEn: 'spray bottle',
    keywords: [
      'ניקיון',
      'ספריי',
      'תרסיס',
      'אקונומיקה',
      'כלור',
      'חומר ניקוי',
      'חיטוי',
      'spray',
      'clean',
      'cleaner',
      'bleach',
      'chlorine',
      'disinfect',
      'sanitize',
    ],
  },
  pepper_red: {
    id: 'pepper_red',
    src: pepperRedSrc,
    labelHe: 'פלפל אדום',
    labelEn: 'red bell pepper',
    keywords: [
      'פלפל',
      'פלפל גמבה',
      'גמבה',
      'אדום',
      'פלפל אדום',
      'pepper',
      'bell pepper',
      'red pepper',
      'capsicum',
    ],
  },
  pepper_orange: {
    id: 'pepper_orange',
    src: pepperOrangeSrc,
    labelHe: 'פלפל כתום',
    labelEn: 'orange bell pepper',
    keywords: [
      'פלפל',
      'פלפל גמבה',
      'גמבה',
      'כתום',
      'פלפל כתום',
      'pepper',
      'bell pepper',
      'orange pepper',
      'capsicum',
    ],
  },
  pepper_yellow: {
    id: 'pepper_yellow',
    src: pepperYellowSrc,
    labelHe: 'פלפל צהוב',
    labelEn: 'yellow bell pepper',
    keywords: [
      'פלפל',
      'פלפל גמבה',
      'גמבה',
      'צהוב',
      'פלפל צהוב',
      'pepper',
      'bell pepper',
      'yellow pepper',
      'capsicum',
    ],
  },
};

export function isAssetIconId(id: string): id is AssetIconId {
  return Object.prototype.hasOwnProperty.call(ASSET_ICON_MAP, id);
}

export function getAssetIconSrc(assetId: AssetIconId): string {
  return ASSET_ICON_MAP[assetId].src;
}


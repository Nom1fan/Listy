/** Country calling code and local number format (segment lengths). */
export interface CountryOption {
  code: string
  flag: string
  name: string
  /** Digit counts per segment, e.g. [2, 3, 4] → XX-XXX-XXXX */
  segments: number[]
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: '972', flag: '🇮🇱', name: 'ישראל', segments: [2, 3, 4] },
  { code: '1', flag: '🇺🇸', name: 'ארה"ב', segments: [3, 3, 4] },
  { code: '44', flag: '🇬🇧', name: 'בריטניה', segments: [5, 6] },
  { code: '49', flag: '🇩🇪', name: 'גרמניה', segments: [3, 3, 4] },
  { code: '33', flag: '🇫🇷', name: 'צרפת', segments: [1, 2, 2, 2] },
  { code: '39', flag: '🇮🇹', name: 'איטליה', segments: [3, 3, 4] },
  { code: '34', flag: '🇪🇸', name: 'ספרד', segments: [3, 3, 3] },
  { code: '31', flag: '🇳🇱', name: 'הולנד', segments: [2, 3, 4] },
  { code: '46', flag: '🇸🇪', name: 'שוודיה', segments: [2, 3, 4] },
  { code: '7', flag: '🇷🇺', name: 'רוסיה', segments: [3, 3, 2, 2] },
  { code: '91', flag: '🇮🇳', name: 'הודו', segments: [5, 5] },
  { code: '86', flag: '🇨🇳', name: 'סין', segments: [3, 4, 4] },
  { code: '81', flag: '🇯🇵', name: 'יפן', segments: [4, 4] },
  { code: '82', flag: '🇰🇷', name: 'דרום קוריאה', segments: [4, 4] },
  { code: '61', flag: '🇦🇺', name: 'אוסטרליה', segments: [1, 4, 4] },
  { code: '55', flag: '🇧🇷', name: 'ברזיל', segments: [2, 5, 4] },
  { code: '27', flag: '🇿🇦', name: 'דרום אפריקה', segments: [2, 3, 4] },
  { code: '971', flag: '🇦🇪', name: 'איחוד האמירויות', segments: [2, 3, 4] },
]

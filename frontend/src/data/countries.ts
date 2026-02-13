/** Country calling code and local number format (segment lengths). */
export interface CountryOption {
  code: string
  flag: string
  name: string
  /** Digit counts per segment, e.g. [2, 7] → XX-XXXXXXX */
  segments: number[]
  /** Example digits per segment, shown as greyed-out placeholder */
  example: string[]
  /** Optional local prefix displayed as a static label (e.g. "0" for Israel) */
  localPrefix?: string
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: '972', flag: '🇮🇱', name: 'ישראל', segments: [3, 7], example: ['054', '1234567'], localPrefix: '0' },
  { code: '1', flag: '🇺🇸', name: 'ארה"ב', segments: [3, 3, 4], example: ['212', '555', '1234'] },
  { code: '44', flag: '🇬🇧', name: 'בריטניה', segments: [5, 6], example: ['20789', '123456'] },
  { code: '49', flag: '🇩🇪', name: 'גרמניה', segments: [3, 3, 4], example: ['170', '123', '4567'] },
  { code: '33', flag: '🇫🇷', name: 'צרפת', segments: [1, 2, 2, 2], example: ['6', '12', '34', '56'] },
  { code: '39', flag: '🇮🇹', name: 'איטליה', segments: [3, 3, 4], example: ['312', '345', '6789'] },
  { code: '34', flag: '🇪🇸', name: 'ספרד', segments: [3, 3, 3], example: ['612', '345', '678'] },
  { code: '31', flag: '🇳🇱', name: 'הולנד', segments: [2, 3, 4], example: ['61', '234', '5678'] },
  { code: '46', flag: '🇸🇪', name: 'שוודיה', segments: [2, 3, 4], example: ['70', '123', '4567'] },
  { code: '7', flag: '🇷🇺', name: 'רוסיה', segments: [3, 3, 2, 2], example: ['912', '345', '67', '89'] },
  { code: '91', flag: '🇮🇳', name: 'הודו', segments: [5, 5], example: ['98765', '43210'] },
  { code: '86', flag: '🇨🇳', name: 'סין', segments: [3, 4, 4], example: ['131', '1234', '5678'] },
  { code: '81', flag: '🇯🇵', name: 'יפן', segments: [4, 4], example: ['9012', '3456'] },
  { code: '82', flag: '🇰🇷', name: 'דרום קוריאה', segments: [4, 4], example: ['1012', '3456'] },
  { code: '61', flag: '🇦🇺', name: 'אוסטרליה', segments: [1, 4, 4], example: ['4', '1234', '5678'] },
  { code: '55', flag: '🇧🇷', name: 'ברזיל', segments: [2, 5, 4], example: ['11', '91234', '5678'] },
  { code: '27', flag: '🇿🇦', name: 'דרום אפריקה', segments: [2, 3, 4], example: ['82', '123', '4567'] },
  { code: '971', flag: '🇦🇪', name: 'איחוד האמירויות', segments: [2, 3, 4], example: ['50', '123', '4567'] },
]

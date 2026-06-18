export type ColorName = 'red' | 'blue' | 'yellow' | 'green'

export interface ColorDef {
  /** Hue range 1 (always present) */
  hLo: number
  hHi: number
  /** Hue range 2 – for red which wraps around 0/360 */
  hLo2?: number
  hHi2?: number
  sMin: number
  vMin: number
  label: string
  css: string
  emoji: string
}

export const COLOR_DEFS: Record<ColorName, ColorDef> = {
  red: {
    hLo: 0, hHi: 18, hLo2: 342, hHi2: 360,
    sMin: 45, vMin: 35,
    label: 'KICK', css: '#ff4444', emoji: '🔴',
  },
  blue: {
    hLo: 195, hHi: 268,
    sMin: 45, vMin: 28,
    label: 'SNARE', css: '#4488ff', emoji: '🔵',
  },
  yellow: {
    hLo: 42, hHi: 74,
    sMin: 58, vMin: 52,
    label: 'BELL', css: '#ffdd00', emoji: '🟡',
  },
  green: {
    hLo: 88, hHi: 158,
    sMin: 38, vMin: 28,
    label: 'TOM', css: '#33cc55', emoji: '🟢',
  },
}

export const COLOR_NAMES = Object.keys(COLOR_DEFS) as ColorName[]

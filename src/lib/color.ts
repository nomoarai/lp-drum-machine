import { COLOR_DEFS, COLOR_NAMES, type ColorName } from '../types'

/** Returns [hue 0-360, saturation 0-100, value 0-100] */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min

  let h = 0
  if (d !== 0) {
    switch (max) {
      case rn: h = ((gn - bn) / d % 6 + 6) % 6; break
      case gn: h = (bn - rn) / d + 2; break
      case bn: h = (rn - gn) / d + 4; break
    }
    h /= 6
  }

  return [h * 360, max === 0 ? 0 : (d / max) * 100, max * 100]
}

export function classifyPixel(r: number, g: number, b: number): ColorName | null {
  const [h, s, v] = rgbToHsv(r, g, b)

  for (const name of COLOR_NAMES) {
    const def = COLOR_DEFS[name]
    if (s < def.sMin || v < def.vMin) continue

    const inRange1 = h >= def.hLo && h <= def.hHi
    const inRange2 = def.hLo2 !== undefined && h >= def.hLo2 && h <= def.hHi2!
    if (inRange1 || inRange2) return name
  }

  return null
}

/**
 * Sample a vertical strip of pixels from imageData and count colour matches.
 * imageData should already be cropped to just the strip.
 */
export function countColors(pixels: Uint8ClampedArray): Record<ColorName, number> {
  const counts: Record<ColorName, number> = { red: 0, blue: 0, yellow: 0, green: 0 }

  for (let i = 0; i < pixels.length; i += 4) {
    const hit = classifyPixel(pixels[i], pixels[i + 1], pixels[i + 2])
    if (hit) counts[hit]++
  }

  return counts
}

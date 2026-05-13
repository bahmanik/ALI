import { Gdk } from "ags/gtk4"
import { Color, HexColor, Rgba } from "src/configuration/types"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Converter
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK: Rgba = { r: 0, g: 0, b: 0, a: 1 }

export function colorToRgba(color: Color | HexColor, alphaScale = 1): Rgba {
  if (!color) return { ...FALLBACK, a: FALLBACK.a * alphaScale }

  const gdk = new Gdk.RGBA()
  const ok = gdk.parse(color)
  if (!ok) return { ...FALLBACK, a: FALLBACK.a * alphaScale }

  return {
    r: gdk.red,
    g: gdk.green,
    b: gdk.blue,
    a: gdk.alpha * Math.max(0, Math.min(1, alphaScale)),
  }
}

export const numberToHex = (n: number): string =>
  Math.floor(Math.max(0, Math.min(1, n)) * 255)
    .toString(16)
    .padStart(2, "0")

const gdkToString = (c: Gdk.RGBA, useAlpha?: boolean): string => {
  return useAlpha
    ? `#${numberToHex(c.red)}${numberToHex(c.green)}${numberToHex(c.blue)}${numberToHex(c.alpha)}`
    : `#${numberToHex(c.red)}${numberToHex(c.green)}${numberToHex(c.blue)}`
}

import type { ColorWithAlpha } from "src/configuration/shared/types"

/**
 * Convert a ColorWithAlpha to a CSS rgba() string.
 *
 * This is the single call site every widget SCSS export should use instead
 * of the old manual `bg + bgOpacity/100` construction.
 *
 * Example:
 *   colorWithAlphaToCss({ color: "#1d2024", alpha: 0.8 })
 *   → "rgba(29,32,36,0.8)"
 */
export function colorWithAlphaToCss(c: ColorWithAlpha): string {
  const { r, g, b, a } = colorToRgba(c.color, c.alpha)
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`
}

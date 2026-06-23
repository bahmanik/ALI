import { Gdk } from "ags/gtk4"
import type { Rgba } from "src/lib/hooks/assetPaint"
import type { ColorWithAlpha, HexColor } from "src/configuration/types"

// ─────────────────────────────────────────────────────────────────────────────
// Converter
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK: Rgba = { r: 0, g: 0, b: 0, a: 1 }

export function colorToRgba(color: ColorWithAlpha | HexColor, alphaScale = 1): Rgba {
  const hex = typeof color === "string" ? color : color.color
  const baseAlpha = typeof color === "string" ? 1 : color.alpha
  if (!hex) return { ...FALLBACK, a: FALLBACK.a * alphaScale * baseAlpha }

  const gdk = new Gdk.RGBA()
  const ok = gdk.parse(hex)
  if (!ok) return { ...FALLBACK, a: FALLBACK.a * alphaScale * baseAlpha }

  return {
    r: gdk.red,
    g: gdk.green,
    b: gdk.blue,
    a: gdk.alpha * Math.max(0, Math.min(1, alphaScale)) * Math.max(0, Math.min(1, baseAlpha)),
  }
}

export function colorWithAlphaToCss(c: ColorWithAlpha): string {
  const { r, g, b, a } = colorToRgba(c)
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`
}

export const numberToHex = (n: number): string =>
  Math.floor(Math.max(0, Math.min(1, n)) * 255)
    .toString(16)
    .padStart(2, "0")

export const gdkToHex = (c: Gdk.RGBA, useAlpha?: boolean): HexColor => {
  return useAlpha
    ? `#${numberToHex(c.red)}${numberToHex(c.green)}${numberToHex(c.blue)}${numberToHex(c.alpha)}`
    : `#${numberToHex(c.red)}${numberToHex(c.green)}${numberToHex(c.blue)}`
}

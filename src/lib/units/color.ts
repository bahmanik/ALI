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

import giCairo from "cairo"
import { Gdk } from "ags/gtk4"

export type Rgba = { r: number; g: number; b: number; a: number }

export function normalizeOpacity(rawOpacity: unknown, fallback = 100) {
  const op = Number(rawOpacity ?? fallback)
  return Math.max(0, Math.min(1, op > 1 ? op / 100 : op))
}

export function clearToTransparent(ctx: giCairo.Context) {
  ctx.setOperator(giCairo.Operator.CLEAR)
  ctx.paint()
  ctx.setOperator(giCairo.Operator.OVER)
}

export function roundedRectPath(
  ctx: giCairo.Context,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2))
  const pi2 = Math.PI / 2

  ctx.newPath()
  ctx.arc(x + w - radius, y + radius, radius, -pi2, 0)
  ctx.arc(x + w - radius, y + h - radius, radius, 0, pi2)
  ctx.arc(x + radius, y + h - radius, radius, pi2, Math.PI)
  ctx.arc(x + radius, y + radius, radius, Math.PI, 1.5 * Math.PI)
  ctx.closePath()
}

export function punchRoundedHole(
  ctx: giCairo.Context,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (w <= 0 || h <= 0) return

  ctx.save()
  ctx.setOperator(giCairo.Operator.CLEAR)
  roundedRectPath(ctx, x, y, w, h, r)
  ctx.fill()
  ctx.restore()
}

export function paintSolid(ctx: giCairo.Context, w: number, h: number, rgba: Rgba) {
  ctx.save()
  ctx.setSourceRGBA(rgba.r, rgba.g, rgba.b, rgba.a)
  ctx.rectangle(0, 0, w, h)
  ctx.fill()
  ctx.restore()
}

export function paintCoverSurface(
  ctx: giCairo.Context,
  w: number,
  h: number,
  surface: giCairo.ImageSurface,
  surfaceW: number,
  surfaceH: number,
  alpha = 1,
) {
  if (w <= 0 || h <= 0 || surfaceW <= 0 || surfaceH <= 0) return

  const scale = Math.max(w / surfaceW, h / surfaceH)
  const drawW = surfaceW * scale
  const drawH = surfaceH * scale
  const offX = (w - drawW) / 2
  const offY = (h - drawH) / 2

  ctx.save()
  ctx.translate(offX, offY)
  ctx.scale(scale, scale)
  ctx.setSourceSurface(surface, 0, 0)
  ctx.paintWithAlpha(Math.max(0, Math.min(1, alpha)))
  ctx.restore()
}

export function paintTiledSurface(
  ctx: giCairo.Context,
  w: number,
  h: number,
  surface: giCairo.ImageSurface,
  surfaceW: number,
  surfaceH: number,
  tileSizePx: number,
  alpha = 1,
) {
  if (!surface || surfaceW <= 0 || surfaceH <= 0 || w <= 0 || h <= 0) return

  const sourceMax = Math.max(1, Math.max(surfaceW, surfaceH))
  const scale = Math.max(1, tileSizePx) / sourceMax
  const tileW = surfaceW * scale
  const tileH = surfaceH * scale

  const cols = Math.max(1, Math.ceil(w / tileW) + 1)
  const rows = Math.max(1, Math.ceil(h / tileH) + 1)

  ctx.save()
  ctx.rectangle(0, 0, w, h)
  ctx.clip()

  for (let row = 0; row < rows; row++) {
    const y = row * tileH
    for (let col = 0; col < cols; col++) {
      const x = col * tileW

      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      ctx.setSourceSurface(surface, 0, 0)
      ctx.paintWithAlpha(Math.max(0, Math.min(1, alpha)))
      ctx.restore()
    }
  }

  ctx.restore()
}

export function parseSolidColor(rawColor: unknown, rawOpacity: unknown): Rgba {
  const color = typeof rawColor === "string" && rawColor.length > 0 ? rawColor : "#111318"
  const aMul = normalizeOpacity(rawOpacity)

  const rgba = new Gdk.RGBA()
  const ok = rgba.parse(color)

  if (!ok) return { r: 0, g: 0, b: 0, a: aMul }

  // GI properties exist at runtime (red/green/blue/alpha)
  // @ts-ignore
  return { r: rgba.red, g: rgba.green, b: rgba.blue, a: rgba.alpha * aMul }
}

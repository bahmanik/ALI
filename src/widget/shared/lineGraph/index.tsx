import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"
import { State } from "gnim"
import { useRef, useAnimation, useDrawingArea } from "src/lib/hooks"
import type { LineGraphOptions } from "./type"

// ═════════════════════════════════════════════════════════════════════════════
// Internal types
// ═════════════════════════════════════════════════════════════════════════════

type RGBA = [number, number, number, number]
type Point = [number, number]
type DrawCtx = { ctx: giCairo.Context; w: number; h: number }
type DrawFn = (dc: DrawCtx, points: Point[], pulse: number) => void

type Props = {
  /** Reactive history buffer — values in 0..1 */
  values: State<number[]>
  options: LineGraphOptions
}

// ═════════════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════════════

const clamp = (v: number) => Math.max(0, Math.min(1, v))
const lerp = (a: number, b: number, f: number) => a + (b - a) * f
const TAU = 2 * Math.PI

const toPoints = (data: number[], w: number, h: number): Point[] => {
  const stepX = w / (data.length - 1)
  return data.map((v, i) => [i * stepX, h - clamp(v) * h])
}

const strokePath = (ctx: giCairo.Context, pts: Point[], stepped = false) => {
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) {
    if (stepped) {
      ctx.lineTo(pts[i][0], pts[i - 1][1])
      ctx.lineTo(pts[i][0], pts[i][1])
    } else {
      ctx.lineTo(pts[i][0], pts[i][1])
    }
  }
}

const fillBelow = (
  ctx: giCairo.Context,
  pts: Point[],
  h: number,
  grad: giCairo.LinearGradient,
  stepped = false,
) => {
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) {
    if (stepped) {
      ctx.lineTo(pts[i][0], pts[i - 1][1])
      ctx.lineTo(pts[i][0], pts[i][1])
    } else {
      ctx.lineTo(pts[i][0], pts[i][1])
    }
  }
  ctx.lineTo(pts[pts.length - 1][0], h)
  ctx.lineTo(pts[0][0], h)
  ctx.closePath()
  ctx.setSource(grad)
  ctx.fill()
}

const roundedRect = (
  ctx: giCairo.Context,
  x: number, y: number, w: number, h: number, r: number,
) => {
  const rc = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + rc, y)
  ctx.lineTo(x + w - rc, y)
  ctx.arc(x + w - rc, y + rc, rc, -Math.PI / 2, 0)
  ctx.lineTo(x + w, y + h - rc)
  ctx.arc(x + w - rc, y + h - rc, rc, 0, Math.PI / 2)
  ctx.lineTo(x + rc, y + h)
  ctx.arc(x + rc, y + h - rc, rc, Math.PI / 2, Math.PI)
  ctx.lineTo(x, y + rc)
  ctx.arc(x + rc, y + rc, rc, Math.PI, -Math.PI / 2)
  ctx.closePath()
}

// ═════════════════════════════════════════════════════════════════════════════
// Animated base
// ═════════════════════════════════════════════════════════════════════════════

const ANIMATION_FPS = 60

const makeAnimatedGraph = (
  { values, options }: Props,
  drawFn: DrawFn,
  keepRunning = true,
) => {
  const displayed = useRef<number[]>([])
  const target = useRef<number[]>([])
  const pulse = useRef(0)
  const pulseDir = useRef(1)

  const { widget: area, redraw } = useDrawingArea(
    (ctx, w, h) => {
      const data = displayed.current
      if (data.length < 2) return
      drawFn({ ctx, w, h }, toPoints(data, w, h), pulse.current)
    },
    { interactive: false },
  )

  area.set_content_width(options.width.value)
  area.set_content_height(options.height.value)

  const anim = useAnimation(ANIMATION_FPS)

  const startLoop = () => {
    if (anim.isRunning()) return
    anim.start(() => {
      const tgt = target.current
      const disp = displayed.current
      const lerpFactor = 1 - clamp(options.smoothing.value)

      // Resize displayed buffer if history length changed
      if (disp.length !== tgt.length) {
        const next = tgt.slice()
        for (let i = 0; i < disp.length && i < next.length; i++) next[i] = disp[i]
        displayed.current = next
      }

      let settled = true
      for (let i = 0; i < tgt.length; i++) {
        const next = lerp(displayed.current[i], tgt[i], lerpFactor)
        if (Math.abs(next - tgt[i]) > 0.0005) settled = false
        displayed.current[i] = next
      }

      pulse.current += options.pulseSpeed.value * pulseDir.current
      if (pulse.current >= 1) { pulse.current = 1; pulseDir.current = -1 }
      if (pulse.current <= 0) { pulse.current = 0; pulseDir.current = 1 }

      redraw()
      return keepRunning || !settled
    })
  }

  // Subscribe to data changes
  const unsubValues = values[0].subscribe(() => {
    const incoming = values[0].peek().slice()
    if (displayed.current.length === 0) displayed.current = incoming.slice()
    target.current = incoming
    startLoop()
  })

  // Redraw on any option change
  const watchedOpts = [
    options.type, options.width, options.height,
    options.thickness, options.color,
    options.smoothing, options.pulseRadiusDelta, options.pulseSpeed,
  ] as const
  const unsubOpts = watchedOpts.map(o => o.subscribe(() => redraw()))

  area.connect("destroy", () => {
    anim.stop()
    unsubValues()
    unsubOpts.forEach(u => u())
  })

  startLoop()
  return area
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: simple
// ═════════════════════════════════════════════════════════════════════════════

const SimpleGraph = ({ values, options }: Props) => {
  const area = new Gtk.DrawingArea()
  area.set_content_width(options.width.value)
  area.set_content_height(options.height.value)

  area.set_draw_func((_, ctx: giCairo.Context, w, h) => {
    const data: number[] = values[0].peek()
    if (data.length < 2) return
    const [r, g, b, a] = options.color.value as RGBA
    const thickness = options.thickness.value
    const stepX = w / (data.length - 1)

    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.setLineJoin(giCairo.LineJoin.ROUND)
    ctx.setLineCap(giCairo.LineCap.ROUND)
    data.forEach((v, i) => {
      const x = i * stepX
      const y = h - clamp(v) * h
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  })

  const unsubValues = values[0].subscribe(() => area.queue_draw())
  const unsubOpts = [options.type, options.width, options.height, options.thickness, options.color]
    .map(o => o.subscribe(() => area.queue_draw()))

  area.connect("destroy", () => {
    unsubValues()
    unsubOpts.forEach(u => u())
  })

  return area
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: glow
// ═════════════════════════════════════════════════════════════════════════════

const GlowGraph = (props: Props) => {
  const { options } = props
  return makeAnimatedGraph(props, ({ ctx, h }, pts, pulse) => {
    const [r, g, b, a] = options.color.value as RGBA
    const thickness = options.thickness.value
    const alphaTop = options.glowFillAlphaTop.value
    const alphaMid = options.glowFillAlphaMid.value
    const midStop = options.glowFillMidStop.value
    const prd = options.pulseRadiusDelta.value

    ctx.setLineWidth(thickness)
    ctx.setLineJoin(giCairo.LineJoin.ROUND)
    ctx.setLineCap(giCairo.LineCap.ROUND)

    const grad = new giCairo.LinearGradient(0, 0, 0, h)
    grad.addColorStopRGBA(0, r, g, b, alphaTop * a)
    grad.addColorStopRGBA(midStop, r, g, b, alphaMid * a)
    grad.addColorStopRGBA(1, r, g, b, 0)
    fillBelow(ctx, pts, h, grad)

    strokePath(ctx, pts)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.stroke()

    const [px, py] = pts[pts.length - 1]
    ctx.arc(px, py, prd + pulse * prd, 0, TAU)
    ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.5 * a)
    ctx.fill()
    ctx.arc(px, py, 3.5, 0, TAU)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.fill()
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: neon
// ═════════════════════════════════════════════════════════════════════════════

const NeonGraph = (props: Props) => {
  const { options } = props
  return makeAnimatedGraph(props, ({ ctx }, pts, pulse) => {
    const [r, g, b, a] = options.color.value as RGBA
    const thickness = options.thickness.value
    const outerWM = options.neonOuterWidthMul.value
    const outerA = options.neonOuterAlpha.value
    const midWM = options.neonMidWidthMul.value
    const midA = options.neonMidAlpha.value
    const flareD = options.neonFlareDelta.value
    const flareA = options.neonFlareAlpha.value
    const coreR = options.neonCoreRadius.value
    const colorDotR = options.neonColorDotRadius.value

    ctx.setLineJoin(giCairo.LineJoin.ROUND)
    ctx.setLineCap(giCairo.LineCap.ROUND)

    strokePath(ctx, pts)
    ctx.setLineWidth(thickness * outerWM)
    ctx.setSourceRGBA(r, g, b, outerA * a)
    ctx.stroke()

    strokePath(ctx, pts)
    ctx.setLineWidth(thickness * midWM)
    ctx.setSourceRGBA(r, g, b, midA * a)
    ctx.stroke()

    strokePath(ctx, pts)
    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.stroke()

    const [px, py] = pts[pts.length - 1]
    ctx.arc(px, py, coreR + pulse * flareD, 0, TAU)
    ctx.setSourceRGBA(r, g, b, (1 - pulse) * flareA * a)
    ctx.fill()
    ctx.arc(px, py, coreR, 0, TAU)
    ctx.setSourceRGBA(1, 1, 1, 0.9 * a)
    ctx.fill()
    ctx.arc(px, py, colorDotR, 0, TAU)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.fill()
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: stepped
// ═════════════════════════════════════════════════════════════════════════════

const SteppedGraph = (props: Props) => {
  const { options } = props
  return makeAnimatedGraph(props, ({ ctx, h }, pts, pulse) => {
    const [r, g, b, a] = options.color.value as RGBA
    const thickness = options.thickness.value
    const alphaTop = options.steppedFillAlphaTop.value
    const prd = options.pulseRadiusDelta.value

    ctx.setLineWidth(thickness)
    ctx.setLineJoin(giCairo.LineJoin.MITER)
    ctx.setLineCap(giCairo.LineCap.SQUARE)

    const grad = new giCairo.LinearGradient(0, 0, 0, h)
    grad.addColorStopRGBA(0, r, g, b, alphaTop * a)
    grad.addColorStopRGBA(1, r, g, b, 0)
    fillBelow(ctx, pts, h, grad, true)

    strokePath(ctx, pts, true)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.stroke()

    const [px, py] = pts[pts.length - 1]
    ctx.arc(px, py, 3.5 + pulse * prd, 0, TAU)
    ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.4 * a)
    ctx.fill()
    ctx.arc(px, py, 3.5, 0, TAU)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.fill()
  }, true)
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: bar
// ═════════════════════════════════════════════════════════════════════════════

const BarGraph = (props: Props) => {
  const { options } = props
  return makeAnimatedGraph(props, ({ ctx, w, h }, pts, pulse) => {
    const [r, g, b, a] = options.color.value as RGBA
    const thickness = options.thickness.value
    const gapRatio = options.barGapRatio.value
    const alphaNormal = options.barAlphaNormal.value
    const alphaLatest = options.barAlphaLatest.value
    const baseAlpha = options.barBaseAlpha.value
    const prd = options.pulseRadiusDelta.value

    const count = pts.length
    const slot = w / count
    const barW = Math.max(1, slot * (1 - gapRatio))
    const halfW = barW / 2

    pts.forEach(([px, py], i) => {
      const barH = h - py
      if (barH <= 0) return
      const isLast = i === count - 1

      const grad = new giCairo.LinearGradient(0, py, 0, h)
      grad.addColorStopRGBA(0, r, g, b, (isLast ? alphaLatest : alphaNormal) * a)
      grad.addColorStopRGBA(1, r, g, b, baseAlpha * a)

      ctx.rectangle(px - halfW, py, barW, barH)
      ctx.setSource(grad)
      ctx.fill()

      ctx.rectangle(px - halfW, py, barW, thickness)
      ctx.setSourceRGBA(r, g, b, (isLast ? 1 : 0.85) * a)
      ctx.fill()

      if (isLast) {
        ctx.arc(px, py, prd + pulse * prd, 0, TAU)
        ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.45 * a)
        ctx.fill()
        ctx.arc(px, py, 3, 0, TAU)
        ctx.setSourceRGBA(r, g, b, a)
        ctx.fill()
      }
    })
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: segment-bar
// ═════════════════════════════════════════════════════════════════════════════

const SegmentBarGraph = (props: Props) => {
  const { options } = props
  return makeAnimatedGraph(props, ({ ctx, w, h }, pts, pulse) => {
    const [r, g, b, a] = options.color.value as RGBA
    const segCount = options.segCount.value
    const segGap = options.segGap.value
    const segColGap = options.segColGap.value
    const segRadius = options.segRadius.value
    const fillAlpha = options.segFillAlpha.value
    const emptyAlpha = options.segEmptyAlpha.value
    const prd = options.pulseRadiusDelta.value

    const count = pts.length
    const slot = w / count
    const colW = Math.max(1, slot - segColGap)
    const segH = (h - segGap * (segCount - 1)) / segCount

    pts.forEach(([px, py], colIdx) => {
      const filled = clamp((h - py) / h)
      const filledN = Math.round(filled * segCount)
      const isLast = colIdx === count - 1
      const left = px - colW / 2

      for (let s = 0; s < segCount; s++) {
        const segY = h - (s + 1) * segH - s * segGap
        const isFill = s < filledN

        if (isFill) {
          const brightness = 0.5 + 0.5 * (s / Math.max(filledN - 1, 1))
          ctx.setSourceRGBA(r, g, b, fillAlpha * brightness * a)
        } else {
          ctx.setSourceRGBA(r, g, b, emptyAlpha * a)
        }

        roundedRect(ctx, left, segY, colW, segH, segRadius)
        ctx.fill()
      }

      if (isLast && filledN > 0) {
        const topSegY = h - filledN * segH - (filledN - 1) * segGap
        const topCentY = topSegY + segH / 2

        ctx.arc(px, topCentY, segH + pulse * prd, 0, TAU)
        ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.4 * a)
        ctx.fill()
      }
    })
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: wave
// ═════════════════════════════════════════════════════════════════════════════

const catmullRomTo = (
  ctx: giCairo.Context,
  p0: Point, p1: Point, p2: Point, p3: Point,
  alpha = 0.5,
) => {
  const cp1x = p1[0] + (p2[0] - p0[0]) * alpha / 3
  const cp1y = p1[1] + (p2[1] - p0[1]) * alpha / 3
  const cp2x = p2[0] - (p3[0] - p1[0]) * alpha / 3
  const cp2y = p2[1] - (p3[1] - p1[1]) * alpha / 3
  ctx.curveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1])
}

const drawCatmullRom = (ctx: giCairo.Context, pts: Point[]) => {
  if (pts.length < 2) return
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 0; i < pts.length - 1; i++) {
    catmullRomTo(
      ctx,
      pts[Math.max(0, i - 1)],
      pts[i],
      pts[i + 1],
      pts[Math.min(pts.length - 1, i + 2)],
    )
  }
}

const WaveGraph = (props: Props) => {
  const { options } = props
  return makeAnimatedGraph(props, ({ ctx, h }, pts, pulse) => {
    const [r, g, b, a] = options.color.value as RGBA
    const thickness = options.thickness.value
    const alphaTop = options.waveFillAlphaTop.value
    const alphaMid = options.waveFillAlphaMid.value
    const midStop = options.waveFillMidStop.value
    const shimBaseOff = options.waveShimmerBaseOff.value
    const shimDelta = options.waveShimmerDelta.value
    const shimAlpha = options.waveShimmerAlpha.value
    const shimWidthMul = options.waveShimmerWidthMul.value
    const prd = options.pulseRadiusDelta.value

    ctx.setLineJoin(giCairo.LineJoin.ROUND)
    ctx.setLineCap(giCairo.LineCap.ROUND)

    // filled area
    drawCatmullRom(ctx, pts)
    ctx.lineTo(pts[pts.length - 1][0], h)
    ctx.lineTo(pts[0][0], h)
    ctx.closePath()
    const fillGrad = new giCairo.LinearGradient(0, 0, 0, h)
    fillGrad.addColorStopRGBA(0, r, g, b, alphaTop * a)
    fillGrad.addColorStopRGBA(midStop, r, g, b, alphaMid * a)
    fillGrad.addColorStopRGBA(1, r, g, b, 0)
    ctx.setSource(fillGrad)
    ctx.fill()

    // shimmer line
    const shimOff = shimBaseOff + pulse * shimDelta
    const shimPts = pts.map(([x, y]) => [x, y - shimOff] as Point)
    drawCatmullRom(ctx, shimPts)
    ctx.setLineWidth(thickness * shimWidthMul)
    ctx.setSourceRGBA(1, 1, 1, shimAlpha * a * (0.5 + pulse * 0.5))
    ctx.stroke()

    // main line
    drawCatmullRom(ctx, pts)
    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.stroke()

    // tip dot
    const [px, py] = pts[pts.length - 1]
    ctx.arc(px, py, 6 + pulse * prd, 0, TAU)
    ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.35 * a)
    ctx.fill()
    ctx.arc(px, py, 3.5, 0, TAU)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.fill()
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Public export
// ═════════════════════════════════════════════════════════════════════════════

export const LineGraph = (props: Props) => {
  switch (props.options.type.value) {
    case "glow": return GlowGraph(props)
    case "neon": return NeonGraph(props)
    case "stepped": return SteppedGraph(props)
    case "bar": return BarGraph(props)
    case "segment-bar": return SegmentBarGraph(props)
    case "wave": return WaveGraph(props)
    default: return SimpleGraph(props)
  }
}

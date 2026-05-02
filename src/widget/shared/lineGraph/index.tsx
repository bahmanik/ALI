import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"
import { State } from "gnim"
import { useRef, useAnimation, useDrawingArea } from "src/lib/hooks"

// ═════════════════════════════════════════════════════════════════════════════
// CONFIG — wire these to your settings/options later
// ═════════════════════════════════════════════════════════════════════════════

/** All available visual variants */
export type LineGraphVariant =
  | "simple"      // clean line, no animation, zero overhead
  | "glow"        // smooth lerp + gradient fill + pulsing dot
  | "neon"        // triple-stroke bloom, white-hot tip
  | "stepped"     // horizontal→vertical segments, good for state/event data
  | "bar"         // histogram bars with gradient + pulse on latest
  | "segment-bar" // bar made of stacked small rectangles with gaps between them
  | "wave"        // Catmull-Rom spline + shimmer ripple

/** Default variant used when none is specified */
const DEFAULT_VARIANT: LineGraphVariant = "simple"

/** Default size */
const DEFAULT_WIDTH = 200
const DEFAULT_HEIGHT = 60

/** Default line/stroke thickness (px) */
const DEFAULT_THICKNESS = 2

/** Default color [r, g, b, a] — normalised 0..1 */
const DEFAULT_COLOR: RGBA = [0.2, 0.7, 1, 1]

/**
 * Exponential-smoothing factor for animated variants.
 * 0 = instant snap  |  ~0.3 = slow drift
 */
const DEFAULT_SMOOTHING = 0.15

/** Animation tick rate */
const ANIMATION_FPS = 60

// ── Pulse oscillation ────────────────────────────────────────────────────────
/** How much the pulse radius grows at peak (px) */
const PULSE_RADIUS_DELTA = 5
/** How much the tip flare grows at peak for neon (px) */
const NEON_FLARE_DELTA = 10
/** Speed of pulse oscillation per tick */
const PULSE_SPEED = 0.04

// ── Glow / fill ──────────────────────────────────────────────────────────────
const GLOW_FILL_ALPHA_TOP = 0.35
const GLOW_FILL_ALPHA_MID = 0.08
const GLOW_FILL_MID_STOP = 0.6   // gradient stop position 0..1

// ── Neon bloom ───────────────────────────────────────────────────────────────
const NEON_OUTER_WIDTH_MUL = 6     // outer halo = thickness × this
const NEON_OUTER_ALPHA = 0.08
const NEON_MID_WIDTH_MUL = 3
const NEON_MID_ALPHA = 0.18
const NEON_FLARE_ALPHA = 0.25
const NEON_CORE_RADIUS = 4     // white-hot inner dot radius (px)
const NEON_COLOR_DOT_RADIUS = 2.5

// ── Stepped fill ─────────────────────────────────────────────────────────────
const STEPPED_FILL_ALPHA_TOP = 0.25

// ── Bar ──────────────────────────────────────────────────────────────────────
/** Gap between bars as a fraction of the slot width (0..1) */
const BAR_GAP_RATIO = 0.15
const BAR_ALPHA_NORMAL = 0.7
const BAR_ALPHA_LATEST = 0.9
const BAR_BASE_ALPHA = 0.2

// ── Segment-bar ──────────────────────────────────────────────────────────────
/** Number of stacked segments that make up a full-height bar */
const SEG_COUNT = 12
/** Gap between segments (px) */
const SEG_GAP = 2
/** Gap between columns (px) */
const SEG_COL_GAP = 3
/** Corner radius of each segment rectangle (px) */
const SEG_RADIUS = 2
/** Alpha of filled segments */
const SEG_FILL_ALPHA = 0.85
/** Alpha of empty (background) segments */
const SEG_EMPTY_ALPHA = 0.08

// ── Wave ─────────────────────────────────────────────────────────────────────
const WAVE_FILL_ALPHA_TOP = 0.55
const WAVE_FILL_ALPHA_MID = 0.20
const WAVE_FILL_MID_STOP = 0.45
const WAVE_SHIMMER_BASE_OFF = 3     // px upward offset of shimmer line
const WAVE_SHIMMER_DELTA = 4     // extra px offset at pulse peak
const WAVE_SHIMMER_ALPHA = 0.18
const WAVE_SHIMMER_WIDTH_MUL = 0.8

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RGBA = [number, number, number, number]
type Point = [number, number]
type DrawCtx = { ctx: giCairo.Context; w: number; h: number }
type DrawFn = (dc: DrawCtx, points: Point[], pulse: number) => void

type Props = {
  values: State<number[]>
  variant?: LineGraphVariant
  width?: number
  height?: number
  thickness?: number
  smoothing?: number
  color?: RGBA
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

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

/** Rounded rectangle helper (Cairo has no native one) */
const roundedRect = (
  ctx: giCairo.Context,
  x: number, y: number,
  w: number, h: number,
  r: number,
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

// ─────────────────────────────────────────────────────────────────────────────
// Animated base
// ─────────────────────────────────────────────────────────────────────────────

const makeAnimatedGraph = (
  { values, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, smoothing = DEFAULT_SMOOTHING }: Props,
  drawFn: DrawFn,
  keepRunning = true,
) => {
  const displayed = useRef<number[]>([])
  const target = useRef<number[]>([])
  const pulse = useRef(0)
  const pulseDir = useRef(1)
  const lerpFactor = 1 - clamp(smoothing)

  const { widget: area, redraw } = useDrawingArea(
    (ctx, w, h) => {
      const data = displayed.current
      if (data.length < 2) return
      drawFn({ ctx, w, h }, toPoints(data, w, h), pulse.current)
    },
    { interactive: false },
  )

  area.set_content_width(width)
  area.set_content_height(height)

  const anim = useAnimation(ANIMATION_FPS)

  const startLoop = () => {
    if (anim.isRunning()) return
    anim.start(() => {
      const tgt = target.current
      const disp = displayed.current

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

      pulse.current += PULSE_SPEED * pulseDir.current
      if (pulse.current >= 1) { pulse.current = 1; pulseDir.current = -1 }
      if (pulse.current <= 0) { pulse.current = 0; pulseDir.current = 1 }

      redraw()
      return keepRunning || !settled
    })
  }

  values[0].subscribe(() => {
    const incoming = values[0].peek().slice()
    if (displayed.current.length === 0) displayed.current = incoming.slice()
    target.current = incoming
    startLoop()
  })

  startLoop()
  return area
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: simple
// ─────────────────────────────────────────────────────────────────────────────

const SimpleGraph = ({
  values,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  thickness = DEFAULT_THICKNESS,
  color = DEFAULT_COLOR,
}: Props) => {
  const area = new Gtk.DrawingArea()
  area.set_content_width(width)
  area.set_content_height(height)
  const [r, g, b, a] = color

  area.set_draw_func((_, ctx: giCairo.Context, w, h) => {
    const data: number[] = values[0].peek()
    if (data.length < 2) return
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

  values[0].subscribe(() => area.queue_draw())
  return area
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: glow
// ─────────────────────────────────────────────────────────────────────────────

const GlowGraph = (props: Props) => {
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedGraph(props, ({ ctx, h }, pts, pulse) => {
    ctx.setLineWidth(thickness)
    ctx.setLineJoin(giCairo.LineJoin.ROUND)
    ctx.setLineCap(giCairo.LineCap.ROUND)

    const grad = new giCairo.LinearGradient(0, 0, 0, h)
    grad.addColorStopRGBA(0, r, g, b, GLOW_FILL_ALPHA_TOP * a)
    grad.addColorStopRGBA(GLOW_FILL_MID_STOP, r, g, b, GLOW_FILL_ALPHA_MID * a)
    grad.addColorStopRGBA(1, r, g, b, 0)
    fillBelow(ctx, pts, h, grad)

    strokePath(ctx, pts)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.stroke()

    const [px, py] = pts[pts.length - 1]
    ctx.arc(px, py, PULSE_RADIUS_DELTA + pulse * PULSE_RADIUS_DELTA, 0, TAU)
    ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.5 * a)
    ctx.fill()
    ctx.arc(px, py, 3.5, 0, TAU)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.fill()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: neon
// ─────────────────────────────────────────────────────────────────────────────

const NeonGraph = (props: Props) => {
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedGraph(props, ({ ctx }, pts, pulse) => {
    ctx.setLineJoin(giCairo.LineJoin.ROUND)
    ctx.setLineCap(giCairo.LineCap.ROUND)

    strokePath(ctx, pts)
    ctx.setLineWidth(thickness * NEON_OUTER_WIDTH_MUL)
    ctx.setSourceRGBA(r, g, b, NEON_OUTER_ALPHA * a)
    ctx.stroke()

    strokePath(ctx, pts)
    ctx.setLineWidth(thickness * NEON_MID_WIDTH_MUL)
    ctx.setSourceRGBA(r, g, b, NEON_MID_ALPHA * a)
    ctx.stroke()

    strokePath(ctx, pts)
    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.stroke()

    const [px, py] = pts[pts.length - 1]
    ctx.arc(px, py, NEON_CORE_RADIUS + pulse * NEON_FLARE_DELTA, 0, TAU)
    ctx.setSourceRGBA(r, g, b, (1 - pulse) * NEON_FLARE_ALPHA * a)
    ctx.fill()
    ctx.arc(px, py, NEON_CORE_RADIUS, 0, TAU)
    ctx.setSourceRGBA(1, 1, 1, 0.9 * a)
    ctx.fill()
    ctx.arc(px, py, NEON_COLOR_DOT_RADIUS, 0, TAU)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.fill()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: stepped
// ─────────────────────────────────────────────────────────────────────────────

const SteppedGraph = (props: Props) => {
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedGraph(props, ({ ctx, h }, pts, pulse) => {
    ctx.setLineWidth(thickness)
    ctx.setLineJoin(giCairo.LineJoin.MITER)
    ctx.setLineCap(giCairo.LineCap.SQUARE)

    const grad = new giCairo.LinearGradient(0, 0, 0, h)
    grad.addColorStopRGBA(0, r, g, b, STEPPED_FILL_ALPHA_TOP * a)
    grad.addColorStopRGBA(1, r, g, b, 0)
    fillBelow(ctx, pts, h, grad, true)

    strokePath(ctx, pts, true)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.stroke()

    const [px, py] = pts[pts.length - 1]
    ctx.arc(px, py, 3.5 + pulse * PULSE_RADIUS_DELTA, 0, TAU)
    ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.4 * a)
    ctx.fill()
    ctx.arc(px, py, 3.5, 0, TAU)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.fill()
  }, true)
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: bar
// ─────────────────────────────────────────────────────────────────────────────

const BarGraph = (props: Props) => {
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedGraph(props, ({ ctx, w, h }, pts, pulse) => {
    const count = pts.length
    const slot = w / count
    const barW = Math.max(1, slot * (1 - BAR_GAP_RATIO))
    const halfW = barW / 2

    pts.forEach(([px, py], i) => {
      const barH = h - py
      if (barH <= 0) return
      const isLast = i === count - 1

      const grad = new giCairo.LinearGradient(0, py, 0, h)
      grad.addColorStopRGBA(0, r, g, b, (isLast ? BAR_ALPHA_LATEST : BAR_ALPHA_NORMAL) * a)
      grad.addColorStopRGBA(1, r, g, b, BAR_BASE_ALPHA * a)

      ctx.rectangle(px - halfW, py, barW, barH)
      ctx.setSource(grad)
      ctx.fill()

      ctx.rectangle(px - halfW, py, barW, thickness)
      ctx.setSourceRGBA(r, g, b, (isLast ? 1 : 0.85) * a)
      ctx.fill()

      if (isLast) {
        ctx.arc(px, py, PULSE_RADIUS_DELTA + pulse * PULSE_RADIUS_DELTA, 0, TAU)
        ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.45 * a)
        ctx.fill()
        ctx.arc(px, py, 3, 0, TAU)
        ctx.setSourceRGBA(r, g, b, a)
        ctx.fill()
      }
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: segment-bar
// Each column is a stack of SEG_COUNT small rounded rectangles.
// Filled segments from bottom up to match the value; empties above.
// ─────────────────────────────────────────────────────────────────────────────

const SegmentBarGraph = (props: Props) => {
  const { color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedGraph(props, ({ ctx, w, h }, pts, pulse) => {
    const count = pts.length
    const slot = w / count
    const colW = Math.max(1, slot - SEG_COL_GAP)
    const segH = (h - SEG_GAP * (SEG_COUNT - 1)) / SEG_COUNT

    pts.forEach(([px, py], colIdx) => {
      const filled = clamp((h - py) / h)         // 0..1 fraction filled
      const filledN = Math.round(filled * SEG_COUNT)
      const isLast = colIdx === count - 1
      const left = px - colW / 2

      for (let s = 0; s < SEG_COUNT; s++) {
        // s=0 is the bottom segment, s=SEG_COUNT-1 is the top
        const segY = h - (s + 1) * segH - s * SEG_GAP
        const isFill = s < filledN

        if (isFill) {
          // Colour gets brighter toward the top of the filled stack
          const brightness = 0.5 + 0.5 * (s / Math.max(filledN - 1, 1))
          ctx.setSourceRGBA(r, g, b, SEG_FILL_ALPHA * brightness * a)
        } else {
          ctx.setSourceRGBA(r, g, b, SEG_EMPTY_ALPHA * a)
        }

        roundedRect(ctx, left, segY, colW, segH, SEG_RADIUS)
        ctx.fill()
      }

      // Pulse glow on the topmost filled segment of the latest column
      if (isLast && filledN > 0) {
        const topSegY = h - filledN * segH - (filledN - 1) * SEG_GAP
        const topCentY = topSegY + segH / 2
        const topCentX = px

        ctx.arc(topCentX, topCentY, segH + pulse * PULSE_RADIUS_DELTA, 0, TAU)
        ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.4 * a)
        ctx.fill()
      }
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: wave
// ─────────────────────────────────────────────────────────────────────────────

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
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedGraph(props, ({ ctx, h }, pts, pulse) => {
    ctx.setLineJoin(giCairo.LineJoin.ROUND)
    ctx.setLineCap(giCairo.LineCap.ROUND)

    drawCatmullRom(ctx, pts)
    ctx.lineTo(pts[pts.length - 1][0], h)
    ctx.lineTo(pts[0][0], h)
    ctx.closePath()
    const fillGrad = new giCairo.LinearGradient(0, 0, 0, h)
    fillGrad.addColorStopRGBA(0, r, g, b, WAVE_FILL_ALPHA_TOP * a)
    fillGrad.addColorStopRGBA(WAVE_FILL_MID_STOP, r, g, b, WAVE_FILL_ALPHA_MID * a)
    fillGrad.addColorStopRGBA(1, r, g, b, 0)
    ctx.setSource(fillGrad)
    ctx.fill()

    const shimmerOff = WAVE_SHIMMER_BASE_OFF + pulse * WAVE_SHIMMER_DELTA
    const shimPts = pts.map(([x, y]) => [x, y - shimmerOff] as Point)
    drawCatmullRom(ctx, shimPts)
    ctx.setLineWidth(thickness * WAVE_SHIMMER_WIDTH_MUL)
    ctx.setSourceRGBA(1, 1, 1, WAVE_SHIMMER_ALPHA * a * (0.5 + pulse * 0.5))
    ctx.stroke()

    drawCatmullRom(ctx, pts)
    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.stroke()

    const [px, py] = pts[pts.length - 1]
    ctx.arc(px, py, 6 + pulse * PULSE_RADIUS_DELTA, 0, TAU)
    ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.35 * a)
    ctx.fill()
    ctx.arc(px, py, 3.5, 0, TAU)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.fill()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Public export
// ─────────────────────────────────────────────────────────────────────────────

export const LineGraph = (props: Props) => {
  switch (props.variant ?? DEFAULT_VARIANT) {
    case "glow": return GlowGraph(props)
    case "neon": return NeonGraph(props)
    case "stepped": return SteppedGraph(props)
    case "bar": return BarGraph(props)
    case "segment-bar": return SegmentBarGraph(props)
    case "wave": return WaveGraph(props)
    default: return SimpleGraph(props)
  }
}

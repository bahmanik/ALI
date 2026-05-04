import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"
import { State } from "gnim"
import { useRef, useAnimation, useDrawingArea } from "src/lib/hooks"
import GLib from "gi://GLib?version=2.0"

// ═════════════════════════════════════════════════════════════════════════════
// CONFIG — wire these to your settings/options later
// ═════════════════════════════════════════════════════════════════════════════

/** All available visual variants */
export type CircularProgressVariant =
  | "simple"      // clean arc, no animation, zero overhead
  | "glow"        // smooth lerp + gradient fill + pulsing dot at tip
  | "neon"        // triple-stroke bloom, white-hot tip
  | "segmented"   // arc made of discrete segment dashes with gaps
  | "dual"        // two concentric rings (progress outer, remainder inner)
  | "fill"        // pie-slice fill that grows with value
  | "wave"        // Catmull-Rom shimmer line inside arc + ripple tip

/** Default variant used when none is specified */
const DEFAULT_VARIANT: CircularProgressVariant = "simple"

/** Default size (width = height) */
const DEFAULT_SIZE = 120

/** Default stroke/arc thickness (px) */
const DEFAULT_THICKNESS = 8

/** Default color [r, g, b, a] — normalised 0..1 */
const DEFAULT_COLOR: RGBA = [0.2, 0.7, 1, 1]

/**
 * Exponential-smoothing factor for animated variants.
 * 0 = instant snap  |  ~0.3 = slow drift
 */
const DEFAULT_SMOOTHING = 0.15

/** Animation tick rate */
const ANIMATION_FPS = 60

// ── Spring animation (used by simple variant on value change) ────────────────
const SPRING_STIFFNESS = 0.05
const SPRING_DAMPING = 0.7

// ── Pulse oscillation ────────────────────────────────────────────────────────
/** Radius growth at pulse peak (px) */
const PULSE_RADIUS_DELTA = 5
/** Speed of pulse oscillation per tick */
const PULSE_SPEED = 0.04

// ── Track (background arc) ───────────────────────────────────────────────────
const TRACK_ALPHA = 0.15

// ── Glow / fill ──────────────────────────────────────────────────────────────
const GLOW_FILL_ALPHA = 0.12
const GLOW_TIP_ALPHA = 0.5

// ── Neon bloom ───────────────────────────────────────────────────────────────
const NEON_OUTER_WIDTH_MUL = 6
const NEON_OUTER_ALPHA = 0.08
const NEON_MID_WIDTH_MUL = 3
const NEON_MID_ALPHA = 0.18
const NEON_FLARE_DELTA = 10
const NEON_FLARE_ALPHA = 0.25
const NEON_CORE_RADIUS = 4
const NEON_COLOR_DOT_RADIUS = 2.5

// ── Segmented ────────────────────────────────────────────────────────────────
/** Total number of segments around the full circle */
const SEG_COUNT = 32
/** Gap between segments in radians */
const SEG_GAP_RAD = 0.04
/** Alpha of filled segments */
const SEG_FILL_ALPHA = 0.9
/** Alpha of empty segments */
const SEG_EMPTY_ALPHA = 0.1

// ── Dual rings ───────────────────────────────────────────────────────────────
/** Inner ring radius as a fraction of outer */
const DUAL_INNER_RATIO = 0.65
/** Inner ring alpha multiplier */
const DUAL_INNER_ALPHA = 0.35

// ── Fill (pie slice) ─────────────────────────────────────────────────────────
/** Fill alpha at the edge */
const FILL_ALPHA_EDGE = 0.5
/** Fill alpha at the center */
const FILL_ALPHA_CENTER = 0.08

// ── Wave shimmer ─────────────────────────────────────────────────────────────
const WAVE_SHIMMER_ALPHA = 0.18
const WAVE_SHIMMER_WIDTH_MUL = 0.8
const WAVE_SHIMMER_OFFSET = 4     // px inward from arc

// ── Center text ──────────────────────────────────────────────────────────────
const TEXT_FONT_SIZE = 18
const TEXT_ALPHA = 0.9

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RGBA = [number, number, number, number]
type DrawCtx = { ctx: giCairo.Context; cx: number; cy: number; radius: number }
type DrawFn = (dc: DrawCtx, progress: number, pulse: number) => void

type Props = {
  value: number | State<number>
  variant?: CircularProgressVariant
  size?: number
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

/** Start angle: top of circle */
const START_ANGLE = -Math.PI / 2

const getTarget = (value: number | State<number>) =>
  clamp(typeof value === "number" ? value : value[0].peek())

/** Tip point on the arc at a given progress (0..1) */
const tipPoint = (cx: number, cy: number, radius: number, progress: number) => {
  const angle = START_ANGLE + progress * TAU
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
}

/** Draw the track (background full circle) */
const drawTrack = (ctx: giCairo.Context, cx: number, cy: number, radius: number, thickness: number, r: number, g: number, b: number, a: number) => {
  ctx.setLineWidth(thickness)
  ctx.setSourceRGBA(r, g, b, TRACK_ALPHA * a)
  ctx.arc(cx, cy, radius, 0, TAU)
  ctx.stroke()
}

/** Draw center percentage text */
const drawCenterText = (ctx: giCairo.Context, cx: number, cy: number, progress: number, r: number, g: number, b: number, a: number) => {
  ctx.setFontSize(TEXT_FONT_SIZE)
  ctx.setSourceRGBA(r, g, b, TEXT_ALPHA * a)
  const label = `${Math.round(progress * 100)}%`
  const te = ctx.textExtents(label)
  ctx.moveTo(cx - te.width / 2 - te.xBearing, cy - te.height / 2 - te.yBearing)
  ctx.showText(label)
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated base
// ─────────────────────────────────────────────────────────────────────────────

const makeAnimatedProgress = (
  { value, size = DEFAULT_SIZE, smoothing = DEFAULT_SMOOTHING }: Props,
  drawFn: DrawFn,
  keepRunning = true,
) => {
  const displayed = useRef(getTarget(value))
  const target = useRef(getTarget(value))
  const pulse = useRef(0)
  const pulseDir = useRef(1)
  const lerpFactor = 1 - clamp(smoothing)

  const { widget: area, redraw } = useDrawingArea(
    (ctx, w, h) => {
      const cx = w / 2
      const cy = h / 2
      const radius = Math.min(w, h) / 2 - (DEFAULT_THICKNESS + PULSE_RADIUS_DELTA + 4)
      drawFn({ ctx, cx, cy, radius }, displayed.current, pulse.current)
    },
    { interactive: false },
  )

  area.set_content_width(size)
  area.set_content_height(size)

  const anim = useAnimation(ANIMATION_FPS)

  const startLoop = () => {
    if (anim.isRunning()) return
    anim.start(() => {
      const tgt = target.current
      const next = lerp(displayed.current, tgt, lerpFactor)
      const settled = Math.abs(next - tgt) < 0.0005

      displayed.current = settled ? tgt : next

      pulse.current += PULSE_SPEED * pulseDir.current
      if (pulse.current >= 1) { pulse.current = 1; pulseDir.current = -1 }
      if (pulse.current <= 0) { pulse.current = 0; pulseDir.current = 1 }

      redraw()
      return keepRunning || !settled
    })
  }

  if (typeof value !== "number") {
    value[0].subscribe(() => {
      target.current = clamp(value[0].peek())
      startLoop()
    })
  }

  startLoop()
  return area
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: simple
// ─────────────────────────────────────────────────────────────────────────────

const SimpleProgress = ({
  value,
  size = DEFAULT_SIZE,
  thickness = DEFAULT_THICKNESS,
  stiffness = SPRING_STIFFNESS,
  damping = SPRING_DAMPING,
  color = DEFAULT_COLOR,
}: Props & { stiffness?: number; damping?: number }) => {
  const area = new Gtk.DrawingArea()
  area.set_content_width(size)
  area.set_content_height(size)
  const [r, g, b, a] = color

  let current = getTarget(value)
  let velocity = 0
  let ticking = false

  const step = () => {
    const tgt = getTarget(value)
    const force = (tgt - current) * stiffness
    velocity += force
    velocity *= damping
    current += velocity
    const done = Math.abs(tgt - current) < 0.001 && Math.abs(velocity) < 0.001
    area.queue_draw()
    if (done) { current = tgt; velocity = 0; ticking = false; return false }
    return true
  }

  const start = () => {
    if (ticking) return
    ticking = true
    const tick = () => { if (!step()) return; GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, tick) }
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, tick)
  }

  area.set_draw_func((_: unknown, ctx: giCairo.Context, w: number, h: number) => {
    const p = clamp(current)
    const cx = w / 2
    const cy = h / 2
    const radius = Math.min(w, h) / 2 - thickness
    ctx.setLineWidth(thickness)
    ctx.setLineCap(giCairo.LineCap.ROUND)
    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, a)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.arc(cx, cy, radius, START_ANGLE, START_ANGLE + p * TAU)
    ctx.stroke()
    drawCenterText(ctx, cx, cy, p, r, g, b, a)
  })

  if (typeof value !== "number") value[0].subscribe(() => start())
  start()
  return area
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: glow
// ─────────────────────────────────────────────────────────────────────────────

const GlowProgress = (props: Props) => {
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    ctx.setLineCap(giCairo.LineCap.ROUND)

    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, a)

    // Subtle radial gradient fill inside arc
    if (progress > 0) {
      const grad = new giCairo.RadialGradient(cx, cy, 0, cx, cy, radius + thickness)
      grad.addColorStopRGBA(0, r, g, b, 0)
      grad.addColorStopRGBA(1, r, g, b, GLOW_FILL_ALPHA * a)
      ctx.arc(cx, cy, radius + thickness / 2, START_ANGLE, START_ANGLE + progress * TAU)
      ctx.lineTo(cx, cy)
      ctx.closePath()
      ctx.setSource(grad)
      ctx.fill()
    }

    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.arc(cx, cy, radius, START_ANGLE, START_ANGLE + progress * TAU)
    ctx.stroke()

    if (progress > 0) {
      const [tx, ty] = tipPoint(cx, cy, radius, progress)
      ctx.arc(tx, ty, PULSE_RADIUS_DELTA + pulse * PULSE_RADIUS_DELTA, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * GLOW_TIP_ALPHA * a)
      ctx.fill()
      ctx.arc(tx, ty, 3.5, 0, TAU)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.fill()
    }

    drawCenterText(ctx, cx, cy, progress, r, g, b, a)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: neon
// ─────────────────────────────────────────────────────────────────────────────

const NeonProgress = (props: Props) => {
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    ctx.setLineCap(giCairo.LineCap.ROUND)

    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, a)

    const endAngle = START_ANGLE + progress * TAU

    ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
    ctx.setLineWidth(thickness * NEON_OUTER_WIDTH_MUL)
    ctx.setSourceRGBA(r, g, b, NEON_OUTER_ALPHA * a)
    ctx.stroke()

    ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
    ctx.setLineWidth(thickness * NEON_MID_WIDTH_MUL)
    ctx.setSourceRGBA(r, g, b, NEON_MID_ALPHA * a)
    ctx.stroke()

    ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.stroke()

    if (progress > 0) {
      const [tx, ty] = tipPoint(cx, cy, radius, progress)
      ctx.arc(tx, ty, NEON_CORE_RADIUS + pulse * NEON_FLARE_DELTA, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * NEON_FLARE_ALPHA * a)
      ctx.fill()
      ctx.arc(tx, ty, NEON_CORE_RADIUS, 0, TAU)
      ctx.setSourceRGBA(1, 1, 1, 0.9 * a)
      ctx.fill()
      ctx.arc(tx, ty, NEON_COLOR_DOT_RADIUS, 0, TAU)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.fill()
    }

    drawCenterText(ctx, cx, cy, progress, r, g, b, a)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: segmented
// Arc made of SEG_COUNT discrete dashes; filled ones glow, empties are dim.
// ─────────────────────────────────────────────────────────────────────────────

const SegmentedProgress = (props: Props) => {
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    ctx.setLineCap(giCairo.LineCap.ROUND)
    ctx.setLineWidth(thickness)

    const filledCount = Math.round(progress * SEG_COUNT)
    const segSpan = TAU / SEG_COUNT

    for (let i = 0; i < SEG_COUNT; i++) {
      const startA = START_ANGLE + i * segSpan + SEG_GAP_RAD / 2
      const endA = START_ANGLE + (i + 1) * segSpan - SEG_GAP_RAD / 2
      const isFilled = i < filledCount
      const isLatest = i === filledCount - 1

      if (isFilled) {
        const brightness = 0.6 + 0.4 * (i / Math.max(filledCount - 1, 1))
        ctx.setSourceRGBA(r, g, b, SEG_FILL_ALPHA * brightness * a)
      } else {
        ctx.setSourceRGBA(r, g, b, SEG_EMPTY_ALPHA * a)
      }

      ctx.arc(cx, cy, radius, startA, endA)
      ctx.stroke()

      if (isLatest && filledCount > 0) {
        const midA = (startA + endA) / 2
        const tx = cx + Math.cos(midA) * radius
        const ty = cy + Math.sin(midA) * radius
        ctx.arc(tx, ty, thickness / 2 + pulse * PULSE_RADIUS_DELTA, 0, TAU)
        ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.4 * a)
        ctx.fill()
      }
    }

    drawCenterText(ctx, cx, cy, progress, r, g, b, a)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: dual
// Two concentric rings: outer = progress, inner = inverse (remainder).
// ─────────────────────────────────────────────────────────────────────────────

const DualProgress = (props: Props) => {
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    ctx.setLineCap(giCairo.LineCap.ROUND)

    const innerRadius = radius * DUAL_INNER_RATIO
    const endAngle = START_ANGLE + progress * TAU
    const invAngle = START_ANGLE + (1 - progress) * TAU

    // Outer track + arc
    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, a)
    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
    ctx.stroke()

    // Inner track + inverse arc
    drawTrack(ctx, cx, cy, innerRadius, thickness * 0.6, r, g, b, a)
    ctx.setLineWidth(thickness * 0.6)
    ctx.setSourceRGBA(r, g, b, DUAL_INNER_ALPHA * a)
    ctx.arc(cx, cy, innerRadius, START_ANGLE, invAngle)
    ctx.stroke()

    // Pulse on outer tip
    if (progress > 0) {
      const [tx, ty] = tipPoint(cx, cy, radius, progress)
      ctx.arc(tx, ty, PULSE_RADIUS_DELTA + pulse * PULSE_RADIUS_DELTA, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.45 * a)
      ctx.fill()
      ctx.arc(tx, ty, 3.5, 0, TAU)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.fill()
    }

    drawCenterText(ctx, cx, cy, progress, r, g, b, a)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: fill
// Pie-slice radial fill that grows with value, plus arc border on top.
// ─────────────────────────────────────────────────────────────────────────────

const FillProgress = (props: Props) => {
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    ctx.setLineCap(giCairo.LineCap.ROUND)

    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, a)

    if (progress > 0) {
      const endAngle = START_ANGLE + progress * TAU

      // Pie fill with radial gradient
      const grad = new giCairo.RadialGradient(cx, cy, 0, cx, cy, radius)
      grad.addColorStopRGBA(0, r, g, b, FILL_ALPHA_CENTER * a)
      grad.addColorStopRGBA(1, r, g, b, FILL_ALPHA_EDGE * a)

      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
      ctx.lineTo(cx, cy)
      ctx.closePath()
      ctx.setSource(grad)
      ctx.fill()

      // Arc border on top
      ctx.setLineWidth(thickness)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
      ctx.stroke()

      // Pulse tip
      const [tx, ty] = tipPoint(cx, cy, radius, progress)
      ctx.arc(tx, ty, PULSE_RADIUS_DELTA + pulse * PULSE_RADIUS_DELTA, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.4 * a)
      ctx.fill()
      ctx.arc(tx, ty, 3.5, 0, TAU)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.fill()
    }

    drawCenterText(ctx, cx, cy, progress, r, g, b, a)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant: wave
// Catmull-Rom shimmer arc slightly inside the progress arc + ripple tip.
// ─────────────────────────────────────────────────────────────────────────────

/** Sample N points along the arc for the shimmer polyline */
const arcPoints = (cx: number, cy: number, radius: number, startA: number, endA: number, steps: number) => {
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const a = startA + (endA - startA) * (i / steps)
    pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius])
  }
  return pts
}

const catmullRomArcTo = (
  ctx: giCairo.Context,
  p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number],
  alpha = 0.5,
) => {
  const cp1x = p1[0] + (p2[0] - p0[0]) * alpha / 3
  const cp1y = p1[1] + (p2[1] - p0[1]) * alpha / 3
  const cp2x = p2[0] - (p3[0] - p1[0]) * alpha / 3
  const cp2y = p2[1] - (p3[1] - p1[1]) * alpha / 3
  ctx.curveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1])
}

const WaveProgress = (props: Props) => {
  const { thickness = DEFAULT_THICKNESS, color = DEFAULT_COLOR } = props
  const [r, g, b, a] = color

  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    ctx.setLineCap(giCairo.LineCap.ROUND)

    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, a)

    if (progress > 0) {
      const endAngle = START_ANGLE + progress * TAU
      const STEPS = 32

      // Main arc
      ctx.setLineWidth(thickness)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
      ctx.stroke()

      // Shimmer arc (slightly inward, Catmull-Rom smoothed, pulsing offset)
      const shimmerR = radius - WAVE_SHIMMER_OFFSET - pulse * 2
      const shimPts = arcPoints(cx, cy, shimmerR, START_ANGLE, endAngle, STEPS)

      if (shimPts.length >= 2) {
        ctx.moveTo(shimPts[0][0], shimPts[0][1])
        for (let i = 0; i < shimPts.length - 1; i++) {
          catmullRomArcTo(
            ctx,
            shimPts[Math.max(0, i - 1)],
            shimPts[i],
            shimPts[i + 1],
            shimPts[Math.min(shimPts.length - 1, i + 2)],
          )
        }
        ctx.setLineWidth(thickness * WAVE_SHIMMER_WIDTH_MUL)
        ctx.setSourceRGBA(1, 1, 1, WAVE_SHIMMER_ALPHA * a * (0.5 + pulse * 0.5))
        ctx.stroke()
      }

      // Pulse tip
      const [tx, ty] = tipPoint(cx, cy, radius, progress)
      ctx.arc(tx, ty, 6 + pulse * PULSE_RADIUS_DELTA, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.35 * a)
      ctx.fill()
      ctx.arc(tx, ty, 3.5, 0, TAU)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.fill()
    }

    drawCenterText(ctx, cx, cy, progress, r, g, b, a)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Public export
// ─────────────────────────────────────────────────────────────────────────────

export const CircularProgress = (props: Props) => {
  switch (props.variant ?? DEFAULT_VARIANT) {
    case "glow": return GlowProgress(props)
    case "neon": return NeonProgress(props)
    case "segmented": return SegmentedProgress(props)
    case "dual": return DualProgress(props)
    case "fill": return FillProgress(props)
    case "wave": return WaveProgress(props)
    default: return SimpleProgress(props)
  }
}

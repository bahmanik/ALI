import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"
import { Accessor } from "gnim"
import { useRef, useAnimation, useDrawingArea } from "src/lib/hooks"
import GLib from "gi://GLib?version=2.0"
import type { CircularProgressOptions } from "./type"
import { RGBA } from "src/configuration/types"

// ═════════════════════════════════════════════════════════════════════════════
// Internal types
// ═════════════════════════════════════════════════════════════════════════════

type DrawCtx = { ctx: giCairo.Context; cx: number; cy: number; radius: number }
type DrawFn = (dc: DrawCtx, progress: number, pulse: number) => void

type Props = {
  value: Accessor<number>
  options: CircularProgressOptions
}

// ═════════════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════════════

const clamp = (v: number) => Math.max(0, Math.min(1, v))
const lerp = (a: number, b: number, f: number) => a + (b - a) * f
const TAU = 2 * Math.PI
const START_ANGLE = -Math.PI / 2

const getTarget = (value: Accessor<number>) => clamp(value.peek())

const tipPoint = (cx: number, cy: number, radius: number, progress: number) => {
  const angle = START_ANGLE + progress * TAU
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
}

const drawTrack = (
  ctx: giCairo.Context, cx: number, cy: number,
  radius: number, thickness: number,
  r: number, g: number, b: number,
  trackAlpha: number, colorAlpha: number,
) => {
  ctx.setLineWidth(thickness)
  ctx.setSourceRGBA(r, g, b, trackAlpha * colorAlpha)
  ctx.arc(cx, cy, radius, 0, TAU)
  ctx.stroke()
}

const drawCenterText = (
  ctx: giCairo.Context, cx: number, cy: number,
  progress: number,
  r: number, g: number, b: number,
  colorAlpha: number, textAlpha: number, textFontSize: number,
) => {
  ctx.setFontSize(textFontSize)
  ctx.setSourceRGBA(r, g, b, textAlpha * colorAlpha)
  const label = `${Math.round(progress * 100)}%`
  const te = ctx.textExtents(label)
  ctx.moveTo(cx - te.width / 2 - te.xBearing, cy - te.height / 2 - te.yBearing)
  ctx.showText(label)
}

// ═════════════════════════════════════════════════════════════════════════════
// Animated base — shared infrastructure for all lerp-based variants
// ═════════════════════════════════════════════════════════════════════════════

const ANIMATION_FPS = 60

const makeAnimatedProgress = (
  { value, options }: Props,
  drawFn: DrawFn,
  keepRunning = true,
) => {
  // Read stable opts once (size never changes mid-session in practice)
  const size = options.size.value
  const smoothing = options.smoothing.value

  const displayed = useRef(getTarget(value))
  const target = useRef(getTarget(value))
  const pulse = useRef(0)
  const pulseDir = useRef(1)
  const lerpFactor = 1 - clamp(smoothing)

  const { widget: area, redraw } = useDrawingArea(
    (ctx, w, h) => {
      const cx = w / 2
      const cy = h / 2
      const thickness = options.thickness.value
      const prd = options.pulseRadiusDelta.value
      const radius = Math.min(w, h) / 2 - (thickness + prd + 4)
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

      const speed = options.pulseSpeed.value
      pulse.current += speed * pulseDir.current
      if (pulse.current >= 1) { pulse.current = 1; pulseDir.current = -1 }
      if (pulse.current <= 0) { pulse.current = 0; pulseDir.current = 1 }

      redraw()
      return keepRunning || !settled
    })
  }

  // Subscribe to value changes; clean up when widget is destroyed
  let unsubValue: (() => void) | null = null
  if (typeof value !== "number") {
    unsubValue = value.subscribe(() => {
      target.current = clamp(value.peek())
      startLoop()
    })
  }

  // Redraw whenever any option changes (covers live setting tweaks)
  const watchedOpts = [
    options.size, options.thickness, options.color,
    options.showText, options.textFontSize, options.textAlpha,
    options.trackAlpha, options.pulseRadiusDelta, options.pulseSpeed,
    options.smoothing,
  ] as const
  const unsubOpts = watchedOpts.map(o => o.subscribe(() => redraw()))

  area.connect("destroy", () => {
    anim.stop()
    unsubValue?.()
    unsubOpts.forEach(u => u())
  })

  startLoop()
  return area
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: simple
// ═════════════════════════════════════════════════════════════════════════════

const SimpleProgress = ({ value, options }: Props) => {
  const size = options.size.value

  const area = new Gtk.DrawingArea()
  area.set_content_width(size)
  area.set_content_height(size)

  let current = getTarget(value)
  let velocity = 0
  let ticking = false

  const step = () => {
    const tgt = getTarget(value)
    const stiffness = options.springStiffness.value
    const damping = options.springDamping.value
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
    const tick = (): boolean => {
      const running = step()
      if (!running) { ticking = false; return GLib.SOURCE_REMOVE }
      return GLib.SOURCE_CONTINUE
    }
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, tick)
  }

  area.set_draw_func((_: unknown, ctx: giCairo.Context, w: number, h: number) => {
    const p = clamp(current)
    const cx = w / 2
    const cy = h / 2
    const thickness = options.thickness.value
    const radius = Math.min(w, h) / 2 - thickness
    const [r, g, b, a] = options.color.value as RGBA
    const trackAlpha = options.trackAlpha.value

    ctx.setLineWidth(thickness)
    ctx.setLineCap(giCairo.LineCap.ROUND)
    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, trackAlpha, a)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.arc(cx, cy, radius, START_ANGLE, START_ANGLE + p * TAU)
    ctx.stroke()

    if (options.showText.value) {
      drawCenterText(ctx, cx, cy, p, r, g, b, a, options.textAlpha.value, options.textFontSize.value)
    }
  })

  // Subscriptions
  let unsubValue: (() => void) | null = null
  if (typeof value !== "number") {
    unsubValue = value.subscribe(() => start())
  }

  const watchedOpts = [
    options.size, options.thickness, options.color,
    options.showText, options.textFontSize, options.textAlpha,
    options.trackAlpha, options.springStiffness, options.springDamping,
  ] as const
  const unsubOpts = watchedOpts.map(o => o.subscribe(() => area.queue_draw()))

  area.connect("destroy", () => {
    ticking = false
    unsubValue?.()
    unsubOpts.forEach(u => u())
  })

  start()
  return area
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: glow
// ═════════════════════════════════════════════════════════════════════════════

const GlowProgress = (props: Props) => {
  const { options } = props
  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    const thickness = options.thickness.value
    const [r, g, b, a] = options.color.value as RGBA
    const trackAlpha = options.trackAlpha.value
    const fillAlpha = options.glowFillAlpha.value
    const tipAlpha = options.glowTipAlpha.value
    const prd = options.pulseRadiusDelta.value

    ctx.setLineCap(giCairo.LineCap.ROUND)
    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, trackAlpha, a)

    if (progress > 0) {
      const grad = new giCairo.RadialGradient(cx, cy, 0, cx, cy, radius + thickness)
      grad.addColorStopRGBA(0, r, g, b, 0)
      grad.addColorStopRGBA(1, r, g, b, fillAlpha * a)
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
      ctx.arc(tx, ty, prd + pulse * prd, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * tipAlpha * a)
      ctx.fill()
      ctx.arc(tx, ty, 3.5, 0, TAU)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.fill()
    }

    if (options.showText.value) {
      drawCenterText(ctx, cx, cy, progress, r, g, b, a, options.textAlpha.value, options.textFontSize.value)
    }
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: neon
// ═════════════════════════════════════════════════════════════════════════════

const NeonProgress = (props: Props) => {
  const { options } = props
  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    const thickness = options.thickness.value
    const [r, g, b, a] = options.color.value as RGBA
    const trackAlpha = options.trackAlpha.value
    const outerWM = options.outerWidthMul.value
    const outerA = options.outerAlpha.value
    const midWM = options.midWidthMul.value
    const midA = options.midAlpha.value
    const flareD = options.flareRadiusDelta.value
    const flareA = options.flareAlpha.value
    const coreR = options.coreRadius.value
    const colorDotR = options.colorDotRadius.value
    const prd = options.pulseRadiusDelta.value

    ctx.setLineCap(giCairo.LineCap.ROUND)
    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, trackAlpha, a)

    const endAngle = START_ANGLE + progress * TAU

    ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
    ctx.setLineWidth(thickness * outerWM)
    ctx.setSourceRGBA(r, g, b, outerA * a)
    ctx.stroke()

    ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
    ctx.setLineWidth(thickness * midWM)
    ctx.setSourceRGBA(r, g, b, midA * a)
    ctx.stroke()

    ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.stroke()

    if (progress > 0) {
      const [tx, ty] = tipPoint(cx, cy, radius, progress)
      ctx.arc(tx, ty, coreR + pulse * flareD, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * flareA * a)
      ctx.fill()
      ctx.arc(tx, ty, coreR, 0, TAU)
      ctx.setSourceRGBA(1, 1, 1, 0.9 * a)
      ctx.fill()
      ctx.arc(tx, ty, colorDotR, 0, TAU)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.fill()

      // Extra tip halo (matching glow / dual behaviour)
      ctx.arc(tx, ty, prd + pulse * prd, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.2 * a)
      ctx.fill()
    }

    if (options.showText.value) {
      drawCenterText(ctx, cx, cy, progress, r, g, b, a, options.textAlpha.value, options.textFontSize.value)
    }
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: segmented
// ═════════════════════════════════════════════════════════════════════════════

const SegmentedProgress = (props: Props) => {
  const { options } = props
  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    const thickness = options.thickness.value
    const [r, g, b, a] = options.color.value as RGBA
    const segCount = options.segmentCount.value
    const gapRad = options.segmentGapRad.value
    const fillAlpha = options.segmentFillAlpha.value
    const emptyAlpha = options.segmentEmptyAlpha.value
    const prd = options.pulseRadiusDelta.value

    ctx.setLineCap(giCairo.LineCap.ROUND)
    ctx.setLineWidth(thickness)

    const filledCount = Math.round(progress * segCount)
    const segSpan = TAU / segCount

    for (let i = 0; i < segCount; i++) {
      const startA = START_ANGLE + i * segSpan + gapRad / 2
      const endA = START_ANGLE + (i + 1) * segSpan - gapRad / 2
      const isFilled = i < filledCount
      const isLatest = i === filledCount - 1

      if (isFilled) {
        const brightness = 0.6 + 0.4 * (i / Math.max(filledCount - 1, 1))
        ctx.setSourceRGBA(r, g, b, fillAlpha * brightness * a)
      } else {
        ctx.setSourceRGBA(r, g, b, emptyAlpha * a)
      }

      ctx.arc(cx, cy, radius, startA, endA)
      ctx.stroke()

      if (isLatest && filledCount > 0) {
        const midA = (startA + endA) / 2
        const tx = cx + Math.cos(midA) * radius
        const ty = cy + Math.sin(midA) * radius
        ctx.arc(tx, ty, thickness / 2 + pulse * prd, 0, TAU)
        ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.4 * a)
        ctx.fill()
      }
    }

    if (options.showText.value) {
      drawCenterText(ctx, cx, cy, progress, r, g, b, a, options.textAlpha.value, options.textFontSize.value)
    }
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: dual
// ═════════════════════════════════════════════════════════════════════════════

const DualProgress = (props: Props) => {
  const { options } = props
  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    const thickness = options.thickness.value
    const [r, g, b, a] = options.color.value as RGBA
    const trackAlpha = options.trackAlpha.value
    const innerRatio = options.innerRingRatio.value
    const innerAlpha = options.innerRingAlpha.value
    const prd = options.pulseRadiusDelta.value

    ctx.setLineCap(giCairo.LineCap.ROUND)

    const innerRadius = radius * innerRatio
    const endAngle = START_ANGLE + progress * TAU
    const invAngle = START_ANGLE + (1 - progress) * TAU

    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, trackAlpha, a)
    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(r, g, b, a)
    ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
    ctx.stroke()

    drawTrack(ctx, cx, cy, innerRadius, thickness * 0.6, r, g, b, trackAlpha, a)
    ctx.setLineWidth(thickness * 0.6)
    ctx.setSourceRGBA(r, g, b, innerAlpha * a)
    ctx.arc(cx, cy, innerRadius, START_ANGLE, invAngle)
    ctx.stroke()

    if (progress > 0) {
      const [tx, ty] = tipPoint(cx, cy, radius, progress)
      ctx.arc(tx, ty, prd + pulse * prd, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.45 * a)
      ctx.fill()
      ctx.arc(tx, ty, 3.5, 0, TAU)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.fill()
    }

    if (options.showText.value) {
      drawCenterText(ctx, cx, cy, progress, r, g, b, a, options.textAlpha.value, options.textFontSize.value)
    }
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: fill
// ═════════════════════════════════════════════════════════════════════════════

const FillProgress = (props: Props) => {
  const { options } = props
  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    const thickness = options.thickness.value
    const [r, g, b, a] = options.color.value as RGBA
    const trackAlpha = options.trackAlpha.value
    const alphaEdge = options.fillAlphaEdge.value
    const alphaCenter = options.fillAlphaCenter.value
    const prd = options.pulseRadiusDelta.value

    ctx.setLineCap(giCairo.LineCap.ROUND)
    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, trackAlpha, a)

    if (progress > 0) {
      const endAngle = START_ANGLE + progress * TAU

      const grad = new giCairo.RadialGradient(cx, cy, 0, cx, cy, radius)
      grad.addColorStopRGBA(0, r, g, b, alphaCenter * a)
      grad.addColorStopRGBA(1, r, g, b, alphaEdge * a)

      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
      ctx.lineTo(cx, cy)
      ctx.closePath()
      ctx.setSource(grad)
      ctx.fill()

      ctx.setLineWidth(thickness)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
      ctx.stroke()

      const [tx, ty] = tipPoint(cx, cy, radius, progress)
      ctx.arc(tx, ty, prd + pulse * prd, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.4 * a)
      ctx.fill()
      ctx.arc(tx, ty, 3.5, 0, TAU)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.fill()
    }

    if (options.showText.value) {
      drawCenterText(ctx, cx, cy, progress, r, g, b, a, options.textAlpha.value, options.textFontSize.value)
    }
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Variant: wave
// ═════════════════════════════════════════════════════════════════════════════

const arcPoints = (
  cx: number, cy: number, radius: number,
  startA: number, endA: number, steps: number,
) => {
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const a = startA + (endA - startA) * (i / steps)
    pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius])
  }
  return pts
}

const catmullRomArcTo = (
  ctx: giCairo.Context,
  p0: [number, number], p1: [number, number],
  p2: [number, number], p3: [number, number],
  alpha = 0.5,
) => {
  const cp1x = p1[0] + (p2[0] - p0[0]) * alpha / 3
  const cp1y = p1[1] + (p2[1] - p0[1]) * alpha / 3
  const cp2x = p2[0] - (p3[0] - p1[0]) * alpha / 3
  const cp2y = p2[1] - (p3[1] - p1[1]) * alpha / 3
  ctx.curveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1])
}

const WaveProgress = (props: Props) => {
  const { options } = props
  return makeAnimatedProgress(props, ({ ctx, cx, cy, radius }, progress, pulse) => {
    const thickness = options.thickness.value
    const [r, g, b, a] = options.color.value as RGBA
    const trackAlpha = options.trackAlpha.value
    const shimmerA = options.shimmerAlpha.value
    const shimmerWM = options.shimmerWidthMul.value
    const shimmerOff = options.shimmerOffset.value
    const prd = options.pulseRadiusDelta.value
    const STEPS = 32

    ctx.setLineCap(giCairo.LineCap.ROUND)
    drawTrack(ctx, cx, cy, radius, thickness, r, g, b, trackAlpha, a)

    if (progress > 0) {
      const endAngle = START_ANGLE + progress * TAU

      ctx.setLineWidth(thickness)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.arc(cx, cy, radius, START_ANGLE, endAngle)
      ctx.stroke()

      const shimmerR = radius - shimmerOff - pulse * 2
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
        ctx.setLineWidth(thickness * shimmerWM)
        ctx.setSourceRGBA(1, 1, 1, shimmerA * a * (0.5 + pulse * 0.5))
        ctx.stroke()
      }

      const [tx, ty] = tipPoint(cx, cy, radius, progress)
      ctx.arc(tx, ty, 6 + pulse * prd, 0, TAU)
      ctx.setSourceRGBA(r, g, b, (1 - pulse) * 0.35 * a)
      ctx.fill()
      ctx.arc(tx, ty, 3.5, 0, TAU)
      ctx.setSourceRGBA(r, g, b, a)
      ctx.fill()
    }

    if (options.showText.value) {
      drawCenterText(ctx, cx, cy, progress, r, g, b, a, options.textAlpha.value, options.textFontSize.value)
    }
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Public export
// ═════════════════════════════════════════════════════════════════════════════

export const CircularProgress = (props: Props) => {
  switch (props.options.type.value) {
    case "glow": return GlowProgress(props)
    case "neon": return NeonProgress(props)
    case "segmented": return SegmentedProgress(props)
    case "dual": return DualProgress(props)
    case "fill": return FillProgress(props)
    case "wave": return WaveProgress(props)
    default: return SimpleProgress(props)
  }
}

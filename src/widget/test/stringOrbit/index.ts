import giCairo from "cairo"
import { useRef, useAnimation, useDrawingArea } from "../glassShatter/hooks"

// ─────────────────────────────────────────────────────────────────────────────
//  StringOrbit
//
//  Eagle-view (top-down, flat 2D) of a centre circle with several labelled
//  boxes orbiting it on loose strings.
//
//  "Loose string" physics (purely visual, no simulation)
//  ──────────────────────────────────────────────────────
//  Each string is a cubic Bézier from the circle's edge to the box.
//  The two control points are displaced:
//
//    ① Tangentially backward  — the string trails behind orbital motion,
//                               like a flag in the wind.
//    ② Slightly radially out  — centrifugal bow; the slack hangs outward.
//
//  The trailing amount oscillates gently over time via a sin wave so the
//  string "breathes" rather than freezing into a static curve.
//
//  Organic orbit
//  ─────────────
//  Each item has a tiny sinusoidal speed wobble, causing it to subtly
//  accelerate and decelerate — lazy, not mechanical.
//
//  Drawing order (back → front)
//  ────────────────────────────
//    1. orbit guide ring (faint dashed circle)
//    2. strings
//    3. centre circle + glow
//    4. boxes + glow + labels
// ─────────────────────────────────────────────────────────────────────────────

const TAU = 2 * Math.PI
const R_CORE = 28   // radius of the centre circle (px, before canvas scaling)

// ── Item definitions ──────────────────────────────────────────────────────────

interface ItemDef {
  label: string
  orbitR: number           // orbit radius in px
  speed: number           // base radians per frame (tiny = lazy)
  speedWobble: number           // amplitude of sinusoidal speed variation
  phase: number           // initial angle
  slack: number           // base slack factor (0 = taut, 1 = very droopy)
  r: number; g: number; b: number   // accent colour
}

const ITEMS: ItemDef[] = [
  // spread radii and phases so items never bunch up at startup
  { label: "Alpha", orbitR: 148, speed: 0.0065, speedWobble: 0.0018, phase: 0.00, slack: 0.44, r: 0.30, g: 0.72, b: 1.00 },
  { label: "Beta", orbitR: 172, speed: 0.0048, speedWobble: 0.0012, phase: TAU * 0.20, slack: 0.56, r: 0.72, g: 0.38, b: 1.00 },
  { label: "Gamma", orbitR: 136, speed: 0.0088, speedWobble: 0.0022, phase: TAU * 0.42, slack: 0.37, r: 0.28, g: 1.00, b: 0.60 },
  { label: "Delta", orbitR: 160, speed: 0.0057, speedWobble: 0.0015, phase: TAU * 0.63, slack: 0.62, r: 1.00, g: 0.60, b: 0.24 },
  { label: "Epsilon", orbitR: 152, speed: 0.0076, speedWobble: 0.0019, phase: TAU * 0.81, slack: 0.41, r: 1.00, g: 0.36, b: 0.58 },
  { label: "Zeta", orbitR: 144, speed: 0.0042, speedWobble: 0.0010, phase: TAU * 0.55, slack: 0.50, r: 0.24, g: 0.88, b: 0.72 },
]

// ── Cairo helpers ─────────────────────────────────────────────────────────────

const roundRect = (
  cr: giCairo.Context,
  x: number, y: number, w: number, h: number, r: number,
) => {
  cr.moveTo(x + r, y)
  cr.lineTo(x + w - r, y)
  cr.arc(x + w - r, y + r, r, -Math.PI / 2, 0)
  cr.lineTo(x + w, y + h - r)
  cr.arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
  cr.lineTo(x + r, y + h)
  cr.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
  cr.lineTo(x, y + r)
  cr.arc(x + r, y + r, r, Math.PI, -Math.PI / 2)
  cr.closePath()
}

// Multi-ring glow centred at (cx, cy).
const circleGlow = (
  cr: giCairo.Context,
  cx: number, cy: number,
  rings: Array<[number, number]>,   // [radius, alpha]
  r: number, g: number, b: number,
) => {
  for (const [radius, alpha] of rings) {
    cr.save()
    cr.arc(cx, cy, radius, 0, TAU)
    cr.setSourceRGBA(r, g, b, alpha)
    cr.fill()
    cr.restore()
  }
}

// Soft halo around a rounded rect.
const boxGlow = (
  cr: giCairo.Context,
  x: number, y: number, bw: number, bh: number, corner: number,
  ri: number, gi: number, bi: number, layers = 4,
) => {
  for (let i = layers; i >= 1; i--) {
    const pad = i * 4.5
    cr.save()
    roundRect(cr, x - pad, y - pad, bw + pad * 2, bh + pad * 2, corner + pad)
    cr.setSourceRGBA(ri, gi, bi, 0.035)
    cr.fill()
    cr.restore()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────

export const StringOrbit = () => {
  const tick = useRef(0)
  const anim = useAnimation(60)

  const { widget: canvas, redraw } = useDrawingArea((cr, w, h) => {
    const cx = w / 2, cy = h / 2
    const t = tick.current

    // ── Pre-compute item positions ──────────────────────────────────────────
    const state = ITEMS.map(item => {
      // Organic speed: base + sinusoidal wobble driven by slow independent phase
      const ω = item.speed + item.speedWobble * Math.sin(t * 0.008 + item.phase * 1.7)
      const θ = item.phase + item.speed * t
        + item.speedWobble * (Math.cos(t * 0.008 + item.phase * 1.7) / 0.008)
      // ↑ integrate the sin wobble → cos / frequency

      // Box centre
      const bx = cx + item.orbitR * Math.cos(θ)
      const by = cy + item.orbitR * Math.sin(θ)

      // String start: circle edge in the θ direction
      const sx = cx + R_CORE * Math.cos(θ)
      const sy = cy + R_CORE * Math.sin(θ)

      // ── Loose string control points ────────────────────────────────────────
      //
      //  Tangent to the orbit in the direction of motion (CCW = positive ω).
      //  A positive ω means items travel CCW, so the tangent points "left"
      //  when standing on the radial line.  We trail the string backward,
      //  i.e. opposite to the tangent.
      const tan_x = -Math.sin(θ)   // CCW tangent unit vector
      const tan_y = Math.cos(θ)

      // Radial outward unit vector
      const rad_x = Math.cos(θ)
      const rad_y = Math.sin(θ)

      const stringLen = item.orbitR - R_CORE

      // Slack oscillates so the string breathes gently
      const breathe = Math.sin(t * 0.022 + item.phase * 2.5) * 0.12
      const slackNow = item.slack + breathe
      const trail = slackNow * stringLen * 0.42   // backward pull
      const bow = slackNow * stringLen * 0.08   // outward bow

      // Two independent control points for a proper cubic — gives a richer
      // curve than a quadratic (both CPs equal).
      const cp1x = sx + (bx - sx) * 0.30 - tan_x * trail * 0.5 + rad_x * bow
      const cp1y = sy + (by - sy) * 0.30 - tan_y * trail * 0.5 + rad_y * bow
      const cp2x = sx + (bx - sx) * 0.70 - tan_x * trail + rad_x * bow
      const cp2y = sy + (by - sy) * 0.70 - tan_y * trail + rad_y * bow

      return { item, θ, bx, by, sx, sy, cp1x, cp1y, cp2x, cp2y }
    })

    // ── 1. Faint orbit guide ring ───────────────────────────────────────────
    //  Not a single ring but a faint band per item at its orbit radius.
    //  This helps the eye understand the depth of each item's orbit.
    for (const { item } of state) {
      cr.save()
      cr.arc(cx, cy, item.orbitR, 0, TAU)
      cr.setLineWidth(1)
      cr.setSourceRGBA(item.r, item.g, item.b, 0.06)
      cr.setDash([3, 9], 0)
      cr.stroke()
      cr.restore()
    }

    // ── 2. Strings ─────────────────────────────────────────────────────────
    for (const { item, bx, by, sx, sy, cp1x, cp1y, cp2x, cp2y } of state) {
      // Outer soft bloom
      cr.save()
      cr.moveTo(sx, sy)
      cr.curveTo(cp1x, cp1y, cp2x, cp2y, bx, by)
      cr.setLineWidth(5)
      cr.setSourceRGBA(item.r, item.g, item.b, 0.06)
      cr.stroke()
      cr.restore()

      // Mid bloom
      cr.save()
      cr.moveTo(sx, sy)
      cr.curveTo(cp1x, cp1y, cp2x, cp2y, bx, by)
      cr.setLineWidth(2.5)
      cr.setSourceRGBA(item.r, item.g, item.b, 0.14)
      cr.stroke()
      cr.restore()

      // Core string — slightly transparent so it reads as a "thread"
      cr.save()
      cr.moveTo(sx, sy)
      cr.curveTo(cp1x, cp1y, cp2x, cp2y, bx, by)
      cr.setLineWidth(1.1)
      cr.setSourceRGBA(item.r * 0.7 + 0.3, item.g * 0.7 + 0.3, item.b * 0.7 + 0.3, 0.55)
      cr.stroke()
      cr.restore()
    }

    // ── 3. Centre circle ────────────────────────────────────────────────────
    circleGlow(cr, cx, cy,
      [[58, 0.04], [44, 0.08], [34, 0.14], [24, 0.26]],
      0.55, 0.80, 1.0,
    )
    cr.save()
    cr.arc(cx, cy, R_CORE, 0, TAU)
    cr.setSourceRGBA(0.10, 0.22, 0.48, 0.92)
    cr.fill()
    cr.restore()
    cr.save()
    cr.arc(cx, cy, R_CORE, 0, TAU)
    cr.setLineWidth(1.8)
    cr.setSourceRGBA(0.50, 0.76, 1.0, 0.85)
    cr.stroke()
    cr.restore()

    // ── 4. Boxes ────────────────────────────────────────────────────────────
    const BW = 84, BH = 36, CORNER = 8

    for (const { item, bx, by } of state) {
      const x = bx - BW / 2, y = by - BH / 2

      // Glow halo
      boxGlow(cr, x, y, BW, BH, CORNER, item.r, item.g, item.b)

      // Dark fill — very dark tint of the item colour
      cr.save()
      roundRect(cr, x, y, BW, BH, CORNER)
      cr.setSourceRGBA(item.r * 0.12, item.g * 0.12, item.b * 0.12, 0.88)
      cr.fill()
      cr.restore()

      // Coloured border
      cr.save()
      cr.setLineWidth(1.5)
      roundRect(cr, x, y, BW, BH, CORNER)
      cr.setSourceRGBA(item.r, item.g, item.b, 0.72)
      cr.stroke()
      cr.restore()

      // Top highlight — thin bright line at the top edge for glass feel
      cr.save()
      cr.setLineWidth(1)
      cr.moveTo(x + CORNER, y + 0.5)
      cr.lineTo(x + BW - CORNER, y + 0.5)
      cr.setSourceRGBA(1, 1, 1, 0.18)
      cr.stroke()
      cr.restore()

      // Label
      cr.save()
      cr.setFontSize(11.5)
      cr.setSourceRGBA(
        item.r * 0.55 + 0.45,
        item.g * 0.55 + 0.45,
        item.b * 0.55 + 0.45,
        0.92,
      )
      const te = cr.textExtents(item.label)
      cr.moveTo(bx - te.width / 2 - te.xBearing, by - te.height / 2 - te.yBearing)
      cr.showText(item.label)
      cr.restore()
    }
  })

  // ── Start infinite lazy orbit ─────────────────────────────────────────────
  anim.start(() => {
    tick.current++
    redraw()
    return true   // never stops — this is the "infinite" part
  })

  return canvas
}

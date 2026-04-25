import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"
import { useRef, useAnimation, useDrawingArea } from "./hooks"

// ─────────────────────────────────────────────────────────────────────────────
//  OrbitSelector
//
//  5 labelled boxes orbit a central "sun" on a tilted ellipse (perspective
//  projection of a circular orbit viewed from a diagonal angle).
//
//  Click any box → the whole system springs so that box reaches the front.
//  Click again mid-spin → the target updates and the spring naturally
//  redirects — no restart needed, because the running tick reads rotTarget
//  which we can mutate any time.
//
//  Geometry
//  ─────────
//  • The orbit is an ellipse with rx ≈ 36% of width, ry ≈ 20% of height.
//  • Angle 0 = right, π/2 = bottom (FRONT), π = left, 3π/2 = top (BACK).
//  • "depth" = (1 + sin θ) / 2   →  0 = fully back, 1 = fully front.
//  • Items are drawn in two passes split by the front arc so z-ordering
//    is always correct:
//      1. back arc  (dashed)
//      2. items with depth < 0.5  (behind the front arc)
//      3. front arc (solid)
//      4. items with depth ≥ 0.5  (in front of the arc)
//      5. centre sun  (always on top)
// ─────────────────────────────────────────────────────────────────────────────

const TAU = 2 * Math.PI
const FRONT = Math.PI / 2   // angle of the frontmost position
const N = 5
const LABELS = ["A", "B", "C", "D", "E"]
const PHASES = Array.from({ length: N }, (_, i) => TAU * i / N)

// Normalise an angle to the range (-π, π] so we always spin the short way.
const shortAngle = (a: number) => {
  let r = ((a % TAU) + TAU) % TAU
  if (r > Math.PI) r -= TAU
  return r
}

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

// Parametric ellipse arc — avoids the scaling trick that corrupts line widths.
const ellipseArc = (
  cr: giCairo.Context,
  cx: number, cy: number,
  rx: number, ry: number,
  a0: number, a1: number,
  steps = 64,
) => {
  for (let i = 0; i <= steps; i++) {
    const t = a0 + (a1 - a0) * (i / steps)
    const x = cx + rx * Math.cos(t)
    const y = cy + ry * Math.sin(t)
    i === 0 ? cr.moveTo(x, y) : cr.lineTo(x, y)
  }
}

// Multi-ring radial glow — same technique as SliderAnimation's drawHalo.
const drawSunGlow = (cr: giCairo.Context, cx: number, cy: number) => {
  for (const [radius, alpha] of [[38, 0.06], [26, 0.14], [16, 0.30], [9, 0.60]] as [number, number][]) {
    cr.save()
    cr.arc(cx, cy, radius, 0, TAU)
    cr.setSourceRGBA(1, 0.80, 0.35, alpha)
    cr.fill()
    cr.restore()
  }
  // white-hot core
  cr.save()
  cr.arc(cx, cy, 6, 0, TAU)
  cr.setSourceRGBA(1, 0.96, 0.85, 1)
  cr.fill()
  cr.restore()
}

const drawBoxGlow = (
  cr: giCairo.Context,
  x: number, y: number, bw: number, bh: number, r: number,
) => {
  for (let g = 4; g >= 1; g--) {
    cr.save()
    roundRect(cr, x - bw / 2 - g * 5, y - bh / 2 - g * 5, bw + g * 10, bh + g * 10, r + g * 5)
    cr.setSourceRGBA(0.25, 0.65, 1, 0.045)
    cr.fill()
    cr.restore()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────

export const OrbitSelector = () => {
  // ── Animation state ────────────────────────────────────────────────────────
  const rotation = useRef(0)   // current global angle offset of the whole orbit
  const rotVel = useRef(0)   // spring velocity
  const rotTarget = useRef(0)   // spring target — mutate freely, even mid-flight
  const dims = useRef({ w: 400, h: 300 })
  const anim = useAnimation(60)

  // ── Orbit geometry ─────────────────────────────────────────────────────────
  const orbitParams = (w: number, h: number) => ({
    cx: w / 2,
    cy: h / 2 + 8,   // push slightly below centre for visual balance
    rx: w * 0.36,
    ry: h * 0.20,
  })

  const getItem = (i: number, w: number, h: number) => {
    const { cx, cy, rx, ry } = orbitParams(w, h)
    const angle = PHASES[i] + rotation.current
    return {
      index: i,
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      depth: (1 + Math.sin(angle)) / 2,  // 0 = back, 1 = front
    }
  }

  // ── Spin logic ─────────────────────────────────────────────────────────────
  //
  //  We update rotTarget even when already running.  The in-flight tick reads
  //  rotTarget.current every frame, so the spring automatically bends toward
  //  the new destination without any restart.
  const spinTo = (i: number) => {
    const delta = shortAngle(FRONT - (PHASES[i] + rotation.current))
    rotTarget.current = rotation.current + delta

    if (!anim.isRunning()) {
      anim.start(() => {
        rotVel.current += (rotTarget.current - rotation.current) * 0.10
        rotVel.current *= 0.82
        rotation.current += rotVel.current

        const done = Math.abs(rotTarget.current - rotation.current) < 0.0008
          && Math.abs(rotVel.current) < 0.0008
        if (done) rotation.current = rotTarget.current
        redraw()
        return !done
      })
    }
  }

  // ── Drawing ────────────────────────────────────────────────────────────────
  const { widget: canvas, redraw } = useDrawingArea((cr, w, h) => {
    dims.current = { w, h }
    const { cx, cy, rx, ry } = orbitParams(w, h)

    const items = Array.from({ length: N }, (_, i) => getItem(i, w, h))

    // Split items into back half and front half for correct z-ordering.
    const backItems = items.filter(it => it.depth < 0.5).sort((a, b) => a.depth - b.depth)
    const frontItems = items.filter(it => it.depth >= 0.5).sort((a, b) => a.depth - b.depth)

    // ── 1. Back arc (dashed, behind everything) ──────────────────────────────
    cr.save()
    cr.setLineWidth(1.2)
    cr.setSourceRGBA(0.45, 0.60, 0.95, 0.22)
    cr.setDash([5, 5], 0)
    ellipseArc(cr, cx, cy, rx, ry, Math.PI, TAU)   // top of ellipse = back half
    cr.stroke()
    cr.restore()

    // ── 2. Back items ─────────────────────────────────────────────────────────
    for (const { index: i, x, y, depth } of backItems) {
      const scale = 0.52 + 0.48 * depth
      const bw = 72 * scale, bh = 34 * scale
      const r = bh * 0.28
      const v = 0.10 + 0.20 * depth

      cr.save()
      cr.setSourceRGBA(v, v, v + 0.08, 0.55 + 0.35 * depth)
      roundRect(cr, x - bw / 2, y - bh / 2, bw, bh, r)
      cr.fill()
      cr.restore()

      cr.save()
      cr.setLineWidth(1)
      cr.setSourceRGBA(0.3, 0.55, 0.9, 0.15 + 0.35 * depth)
      roundRect(cr, x - bw / 2, y - bh / 2, bw, bh, r)
      cr.stroke()
      cr.restore()

      cr.save()
      cr.setFontSize(11 * scale)
      cr.setSourceRGBA(1, 1, 1, 0.3 + 0.35 * depth)
      const te = cr.textExtents(LABELS[i])
      cr.moveTo(x - te.width / 2 - te.xBearing, y - te.height / 2 - te.yBearing)
      cr.showText(LABELS[i])
      cr.restore()
    }

    // ── 3. Front arc (solid, overlaps back items correctly) ───────────────────
    cr.save()
    cr.setLineWidth(1.6)
    cr.setSourceRGBA(0.48, 0.62, 0.98, 0.50)
    cr.setDash([], 0)
    ellipseArc(cr, cx, cy, rx, ry, 0, Math.PI)     // bottom of ellipse = front half
    cr.stroke()
    cr.restore()

    // ── 4. Front items ────────────────────────────────────────────────────────
    for (const { index: i, x, y, depth } of frontItems) {
      const scale = 0.52 + 0.48 * depth
      const bw = 72 * scale, bh = 34 * scale
      const r = bh * 0.28
      const isFront = depth > 0.92

      if (isFront) drawBoxGlow(cr, x, y, bw, bh, r)

      cr.save()
      if (isFront) {
        cr.setSourceRGBA(0.16, 0.40, 0.72, 0.92)
      } else {
        const v = 0.10 + 0.20 * depth
        cr.setSourceRGBA(v, v, v + 0.08, 0.55 + 0.35 * depth)
      }
      roundRect(cr, x - bw / 2, y - bh / 2, bw, bh, r)
      cr.fill()
      cr.restore()

      cr.save()
      cr.setLineWidth(isFront ? 1.6 : 1)
      cr.setSourceRGBA(0.35, 0.65, 1, 0.20 + 0.65 * depth)
      roundRect(cr, x - bw / 2, y - bh / 2, bw, bh, r)
      cr.stroke()
      cr.restore()

      cr.save()
      cr.setFontSize(11 * scale)
      cr.setSourceRGBA(1, 1, 1, 0.45 + 0.55 * depth)
      const te = cr.textExtents(LABELS[i])
      cr.moveTo(x - te.width / 2 - te.xBearing, y - te.height / 2 - te.yBearing)
      cr.showText(LABELS[i])
      cr.restore()
    }

    // ── 5. Centre sun (always on top) ─────────────────────────────────────────
    drawSunGlow(cr, cx, cy)

  }, { interactive: true })  // interactive: true — this canvas IS the hit surface

  // ── Click handling ─────────────────────────────────────────────────────────
  //
  //  Since the canvas has can_target=true, we attach a GestureClick to it.
  //  We manually hit-test against each item's bounding box using the same
  //  geometry as the draw function (both read dims.current).
  const gesture = new Gtk.GestureClick()
  gesture.connect(
    "pressed",
    (_: Gtk.GestureClick, _n: number, x: number, y: number) => {
      const { w, h } = dims.current
      const items = Array.from({ length: N }, (_, i) => getItem(i, w, h))

      // Hit-test from front to back so overlapping items favour the front one.
      const sorted = [...items].sort((a, b) => b.depth - a.depth)
      for (const item of sorted) {
        const scale = 0.52 + 0.48 * item.depth
        const bw = 72 * scale, bh = 34 * scale
        if (x >= item.x - bw / 2 && x <= item.x + bw / 2 &&
          y >= item.y - bh / 2 && y <= item.y + bh / 2) {
          spinTo(item.index)
          break
        }
      }
    },
  )
  canvas.add_controller(gesture)

  return canvas
}

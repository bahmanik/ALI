import Gtk from "gi://Gtk?version=4.0"
import GLib from "gi://GLib"
import giCairo from "cairo"

// ─────────────────────────────────────────────────────────────────────────────
// Hook-style primitives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A mutable container — same mental model as React's useRef.
 * Avoids polluting the outer scope with `let` variables.
 */
export function useRef<T>(initial: T) {
  return { current: initial }
}

interface UseAnimationOpts {
  /** The ref that will be written to on each frame */
  t: { current: number }
  /** Value the spring settles at (default: 2, spans 0→1→2 for 3 handles) */
  target?: number
  /** Spring stiffness – higher = snappier (default: 0.10) */
  stiffness?: number
  /** Damping – lower = more bouncy (default: 0.78) */
  damping?: number
  /** Called every frame; use it to queue a redraw */
  onFrame: () => void
}

/**
 * A spring-physics animation loop built on GLib.timeout_add.
 * Returns { start, reset } controls.
 */
function useAnimation(opts: UseAnimationOpts) {
  const { t, target = 2, stiffness = 0.10, damping = 0.78, onFrame } = opts
  const velocity = useRef(0)
  const running = useRef(false)

  const tick = (): boolean => {
    velocity.current += (target - t.current) * stiffness
    velocity.current *= damping
    t.current += velocity.current
    onFrame()

    const done =
      Math.abs(target - t.current) < 0.001 &&
      Math.abs(velocity.current) < 0.001

    if (done) {
      t.current = target
      running.current = false
      onFrame() // ensure the final settled frame is drawn
      return GLib.SOURCE_REMOVE
    }
    return GLib.SOURCE_CONTINUE
  }

  return {
    start() {
      if (running.current) return
      running.current = true
      t.current = 0
      velocity.current = 0
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, tick)
    },
    reset() {
      running.current = false
      t.current = 0
      velocity.current = 0
    },
  }
}

interface UseDrawingAreaOpts {
  width: number
  height: number
  draw: (cr: giCairo.Context) => void
}

/**
 * Creates a Gtk.DrawingArea and wires up the draw func.
 *
 * KEY FIX: set_can_target(false) so the overlay does NOT eat pointer events
 * from widgets underneath it (buttons, sliders, etc.).
 */
export function useDrawingArea({ width, height, draw }: UseDrawingAreaOpts) {
  const area = new Gtk.DrawingArea()
  area.set_content_width(width)
  area.set_content_height(height)
  area.set_hexpand(true)
  area.set_vexpand(true)
  // ← This is why the button click was never firing.
  //   The DrawingArea overlay was silently consuming all pointer events.
  area.set_can_target(false)
  area.set_draw_func((_, cr) => draw(cr as unknown as giCairo.Context))
  return area
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightning / glow helpers
// ─────────────────────────────────────────────────────────────────────────────

type Point = [number, number]

/** Fast deterministic pseudo-random number generator (xorshift32) */
function seededRng(seed: number) {
  let s = (seed | 0) || 1
  return () => {
    s ^= s << 13
    s ^= s >> 17
    s ^= s << 5
    return (s >>> 0) / 0x100000000
  }
}

/**
 * Builds a jagged lightning path from p1 → p2 using recursive midpoint
 * displacement. Changing `seed` each frame makes the bolt flicker.
 */
function buildLightningPoints(
  p1: Point,
  p2: Point,
  seed: number,
  depth = 4,
): Point[] {
  const rng = seededRng(seed)
  let pts: Point[] = [p1, p2]

  for (let d = 0; d < depth; d++) {
    const next: Point[] = []
    for (let i = 0; i < pts.length - 1; i++) {
      next.push(pts[i])
      const [ax, ay] = pts[i]
      const [bx, by] = pts[i + 1]
      const mx = (ax + bx) / 2
      const my = (ay + by) / 2
      const dx = bx - ax
      const dy = by - ay
      const len = Math.sqrt(dx * dx + dy * dy)
      // Perpendicular unit vector
      const px = -dy / len
      const py = dx / len
      const jitter = (rng() - 0.5) * len * 0.45
      next.push([mx + px * jitter, my + py * jitter])
    }
    next.push(pts[pts.length - 1])
    pts = next
  }
  return pts
}

/** Traces a polyline through pts (no stroke call — lets callers set style first) */
function tracePath(cr: giCairo.Context, pts: Point[]) {
  cr.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) cr.lineTo(pts[i][0], pts[i][1])
}

/**
 * Draws a layered glow bolt.
 *
 * Technique: 4 passes of the same path with decreasing line-width and
 * increasing opacity — outer bloom → mid halo → inner channel → white core.
 */
function drawElectricBolt(cr: giCairo.Context, pts: Point[]) {
  const layers = [
    { width: 18, r: 0.10, g: 0.45, b: 1.00, a: 0.05 }, // outer corona
    { width: 10, r: 0.25, g: 0.65, b: 1.00, a: 0.18 }, // mid glow
    { width: 4, r: 0.55, g: 0.88, b: 1.00, a: 0.55 }, // inner channel
    { width: 1.4, r: 1.00, g: 1.00, b: 1.00, a: 0.95 }, // white core
  ] as const

  for (const l of layers) {
    cr.setLineWidth(l.width)
    cr.setSourceRGBA(l.r, l.g, l.b, l.a)
    tracePath(cr, pts)
    cr.stroke()
  }
}

/**
 * Draws a layered radial glow at a handle position.
 * `intensity` 0→1: dark → fully lit.
 */
function drawHandleGlow(
  cr: giCairo.Context,
  x: number,
  y: number,
  intensity: number,
) {
  if (intensity <= 0) return
  const i = intensity

  // Outer corona — large, very transparent
  cr.setSourceRGBA(0.1, 0.45, 1.0, 0.10 * i)
  cr.arc(x, y, 24 * i, 0, 2 * Math.PI)
  cr.fill()

  // Mid ring
  cr.setSourceRGBA(0.25, 0.65, 1.0, 0.28 * i)
  cr.arc(x, y, 13 * i, 0, 2 * Math.PI)
  cr.fill()

  // Bright inner ring
  cr.setSourceRGBA(0.65, 0.92, 1.0, 0.70 * i)
  cr.arc(x, y, 7, 0, 2 * Math.PI)
  cr.fill()

  // White-hot core
  cr.setSourceRGBA(1.0, 1.0, 1.0, i)
  cr.arc(x, y, 3.5, 0, 2 * Math.PI)
  cr.fill()
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget
// ─────────────────────────────────────────────────────────────────────────────

export const SliderAnimationV1 = () => {
  // ── Layout ────────────────────────────────────────────────────────────────
  const overlay = new Gtk.Overlay()
  const box = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 24,
  })
  box.set_margin_top(24)
  box.set_margin_bottom(24)
  box.set_margin_start(24)
  box.set_margin_end(24)

  const makeSlider = (value: number) => {
    const s = new Gtk.Scale({
      orientation: Gtk.Orientation.HORIZONTAL,
      hexpand: true,
    })
    s.set_range(0, 1)
    s.set_value(value)
    return s
  }

  const s1 = makeSlider(0.2)
  const s2 = makeSlider(0.5)
  const s3 = makeSlider(0.8)
  const button = new Gtk.Button({ label: "Save ⚡" })

  box.append(s1)
  box.append(s2)
  box.append(s3)
  box.append(button)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const animT = useRef(0)       // written by useAnimation, read by draw
  const frameCount = useRef(0)       // seed variation → bolt flickers each frame
  const seed = useRef(0)       // randomised on each button click

  // ── Helpers ───────────────────────────────────────────────────────────────
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  /** Returns the pixel position of a slider's handle relative to the overlay */
  const getHandlePos = (slider: Gtk.Scale): [number, number] => {
    const alloc = slider.get_allocation()
    const adj = slider.get_adjustment()
    const pct = (slider.get_value() - adj.get_lower()) /
      (adj.get_upper() - adj.get_lower())
    const pad = 8
    const localX = pad + pct * (alloc.width - pad * 2)
    const localY = alloc.height / 2
    // translate_coordinates returns [success, destX, destY]
    const [ok, ox, oy] = slider.translate_coordinates(overlay, localX, localY)
    return ok ? [ox, oy] : [localX, localY]
  }

  // ── Drawing area ──────────────────────────────────────────────────────────
  // Created before `anim` so we can pass area.queue_draw into useAnimation.
  // Both close over `animT` which is just an object reference — safe.
  const area = useDrawingArea({
    width: 400,
    height: 300,
    draw: (cr) => {
      const raw = animT.current
      if (raw <= 0) return

      const p1 = getHandlePos(s1)
      const p2 = getHandlePos(s2)
      const p3 = getHandlePos(s3)

      // Current tip of the travelling bolt
      const tip: Point =
        raw < 1
          ? [lerp(p1[0], p2[0], raw), lerp(p1[1], p2[1], raw)]
          : [lerp(p2[0], p3[0], raw - 1), lerp(p2[1], p3[1], raw - 1)]

      const fc = frameCount.current // changes each frame → bolt flickers

      if (raw <= 1) {
        // Phase 1: bolt travels s1 → s2
        drawElectricBolt(cr, buildLightningPoints(p1, tip, seed.current + fc))
      } else {
        // Phase 2: full s1→s2 bolt + growing s2→s3 bolt
        drawElectricBolt(cr, buildLightningPoints(p1, p2, seed.current + fc))
        drawElectricBolt(cr, buildLightningPoints(p2, tip, seed.current + fc + 13))
      }

      // Handle glows — each brightens as the bolt arrives
      const i1 = Math.min(raw * 4, 1)                          // s1: starts immediately
      const i2 = Math.max(0, Math.min((raw - 0.8) * 5, 1))    // s2: brightens at raw ≈ 0.8
      const i3 = Math.max(0, Math.min((raw - 1.8) * 5, 1))    // s3: brightens at raw ≈ 1.8

      drawHandleGlow(cr, p1[0], p1[1], i1)
      drawHandleGlow(cr, p2[0], p2[1], i2)
      drawHandleGlow(cr, p3[0], p3[1], i3)
    },
  })

  // ── Animation ─────────────────────────────────────────────────────────────
  const anim = useAnimation({
    t: animT,
    target: 2,
    stiffness: 0.02,
    damping: 0.79,
    onFrame: () => {
      frameCount.current++
      area.queue_draw()
    },
  })

  // ── Assemble ──────────────────────────────────────────────────────────────
  overlay.set_child(box)
  overlay.add_overlay(area)

  button.connect("clicked", () => {
    console.log("the button was clicked ⚡")
    seed.current = Math.floor(Math.random() * 0xfffff)
    frameCount.current = 0
    anim.reset()
    anim.start()
  })

  return overlay
}

export default SliderAnimationV1

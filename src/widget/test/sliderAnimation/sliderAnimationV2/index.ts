import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"
import { useRef, useAnimation, useDrawingArea } from "./hooks"

// ─────────────────────────────────────────────────────────────────────────────
//  Cairo electricity helpers (unchanged from v1, repeated here for locality)
// ─────────────────────────────────────────────────────────────────────────────

const traceLightning = (
  cr: giCairo.Context,
  x1: number, y1: number,
  x2: number, y2: number,
  segments = 16,
  roughness = 20,
  seed: number,
) => {
  let s = (seed * 1664525 + 1013904223) >>> 0
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff - 0.5 }
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len, ny = dx / len
  cr.moveTo(x1, y1)
  for (let i = 1; i < segments; i++) {
    const t = i / segments
    const off = rand() * roughness * Math.sin(t * Math.PI)
    cr.lineTo(x1 + dx * t + nx * off, y1 + dy * t + ny * off)
  }
  cr.lineTo(x2, y2)
}

const strokeGlow = (
  cr: giCairo.Context,
  drawPath: () => void,
  r: number, g: number, b: number,
  alpha: number,  // ← NEW: master opacity for fade-out
  layers = 6,
  maxWidth = 26,
) => {
  for (let i = layers; i >= 1; i--) {
    cr.save()
    cr.setLineWidth(maxWidth * (i / layers))
    cr.setSourceRGBA(r, g, b, 0.055 * alpha)
    drawPath()
    cr.stroke()
    cr.restore()
  }
  cr.save()
  cr.setLineWidth(1.5)
  cr.setSourceRGBA(0.85 + r * 0.15, 0.85 + g * 0.15, 0.85 + b * 0.15, alpha)
  drawPath()
  cr.stroke()
  cr.restore()
}

const drawHalo = (
  cr: giCairo.Context,
  x: number, y: number,
  intensity: number,
  r: number, g: number, b: number,
  alpha: number,  // ← NEW: master opacity for fade-out
) => {
  if (intensity <= 0 || alpha <= 0) return
  for (const [radius, a] of [[34, 0.06], [20, 0.14], [10, 0.32], [5, 0.70]] as [number, number][]) {
    cr.save()
    cr.arc(x, y, radius * intensity, 0, 2 * Math.PI)
    cr.setSourceRGBA(r, g, b, a * intensity * alpha)
    cr.fill()
    cr.restore()
  }
  cr.save()
  cr.arc(x, y, 3, 0, 2 * Math.PI)
  cr.setSourceRGBA(1, 1, 1, intensity * alpha)
  cr.fill()
  cr.restore()
}

// ─────────────────────────────────────────────────────────────────────────────
//  SliderAnimation
//
//  Animation phases
//  ┌─────────┬──────────────────────────────────────────────────────────────┐
//  │ Phase 1 │ spring from progress=0 → 2  (bolt travels s1 → s2 → s3)    │
//  │ Phase 2 │ fade  from alpha=1    → 0   (everything dissolves)          │
//  └─────────┴──────────────────────────────────────────────────────────────┘
//  The two phases are chained via the onDone callback of useAnimation.
// ─────────────────────────────────────────────────────────────────────────────

export const SliderAnimationV2 = () => {
  const overlay = new Gtk.Overlay()
  const box = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 24,
    margin_top: 24, margin_bottom: 24,
    margin_start: 24, margin_end: 24,
  })

  const makeSlider = (value: number) => {
    const s = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL, hexpand: true })
    s.set_range(0, 1)
    s.set_value(value)
    return s
  }
  const s1 = makeSlider(0.2)
  const s2 = makeSlider(0.5)
  const s3 = makeSlider(0.8)
  const button = new Gtk.Button({ label: "⚡ Save" })
  box.append(s1); box.append(s2); box.append(s3); box.append(button)

  // ── State ─────────────────────────────────────────────────────────────────
  const progress = useRef(0)   // 0..2 — how far the bolt has travelled
  const velocity = useRef(0)
  const frame = useRef(0)   // increments each tick → changes lightning seed → flicker
  const alpha = useRef(0)   // master opacity, 1 during travel, fades to 0 in phase 2

  const travelAnim = useAnimation(60)
  const fadeAnim = useAnimation(60)

  // ── Slider thumb pixel position ───────────────────────────────────────────
  const getHandlePos = (slider: Gtk.Scale): [number, number] => {
    const alloc = slider.get_allocation()
    const adj = slider.get_adjustment()
    const pct = (slider.get_value() - adj.get_lower()) / (adj.get_upper() - adj.get_lower())
    const pad = 8
    return [alloc.x + pad + pct * (alloc.width - pad * 2), alloc.y + alloc.height / 2]
  }

  // ── Canvas ─────────────────────────────────────────────────────────────────
  const { widget: canvas, redraw } = useDrawingArea((cr) => {
    const a = alpha.current
    if (a <= 0) return

    const p1 = getHandlePos(s1)
    const p2 = getHandlePos(s2)
    const p3 = getHandlePos(s3)
    const cv = progress.current
    const phase1 = Math.min(cv, 1)
    const phase2 = Math.max(cv - 1, 0)
    const seed = frame.current
    const R = 0.25, G = 0.75, B = 1.0

    const tip: [number, number] = cv <= 1
      ? [p1[0] + (p2[0] - p1[0]) * phase1, p1[1] + (p2[1] - p1[1]) * phase1]
      : [p2[0] + (p3[0] - p2[0]) * phase2, p2[1] + (p3[1] - p2[1]) * phase2]

    if (phase1 > 0) {
      const end: [number, number] = cv <= 1 ? tip : p2
      strokeGlow(cr, () => traceLightning(cr, p1[0], p1[1], end[0], end[1], 16, 20, seed), R, G, B, a)
    }
    if (phase2 > 0) {
      strokeGlow(cr, () => traceLightning(cr, p2[0], p2[1], tip[0], tip[1], 16, 20, seed + 9999), R, G, B, a)
    }
    if (cv > 0 && cv < 2) {
      drawHalo(cr, tip[0], tip[1], 1, R, G, B, a)
    }

    drawHalo(cr, p1[0], p1[1], Math.min(1, phase1 * 4), R, G, B, a)
    drawHalo(cr, p2[0], p2[1], Math.min(1, phase2), R, G, B, a)
    drawHalo(cr, p3[0], p3[1], Math.min(1, Math.max(0, phase2 * 3 - 2)), R, G, B, a)
  })

  // ── Button ─────────────────────────────────────────────────────────────────
  button.connect("clicked", () => {
    if (travelAnim.isRunning() || fadeAnim.isRunning()) return

    progress.current = 0
    velocity.current = 0
    frame.current = 0
    alpha.current = 1

    // Phase 1: bolt travels from s1 → s2 → s3
    travelAnim.start(
      () => {
        frame.current++
        velocity.current += (2 - progress.current) * 0.10
        velocity.current *= 0.82
        progress.current += velocity.current
        const done = Math.abs(2 - progress.current) < 0.005
          && Math.abs(velocity.current) < 0.005
        if (done) progress.current = 2
        redraw()
        return !done
      },

      // Phase 2 (onDone): all electricity fades out
      () => {
        fadeAnim.start(() => {
          alpha.current -= 0.028          // ~36 frames = ~0.6 s at 60fps
          if (alpha.current <= 0) {
            alpha.current = 0
            redraw()
            return false
          }
          redraw()
          return true
        })
      },
    )
  })

  overlay.set_child(box)
  overlay.add_overlay(canvas)
  return overlay
}

export default SliderAnimationV2

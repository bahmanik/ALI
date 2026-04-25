import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import giCairo from "cairo"
import { useRef, useAnimation, useDrawingArea } from "../glassShatter/hooks"

// ─────────────────────────────────────────────────────────────────────────────
//  MagneticSpread
//
//  A wallpaper selector where thumbnails float on a ring around a large central
//  preview, each connected to the center by a loose breathing string.
//
//  Clicking any thumbnail magnetically pulls it to the center while the previous
//  selection ejects out to the ring position the clicked card just vacated.
//
//  Layout
//  ───────
//  • Centre slot  — large preview card, always shows the selected wallpaper.
//  • Ring slots   — N-1 small thumbnails evenly spaced on an ellipse.
//    The ellipse is slightly squished vertically (ry = rx * 0.6) so the layout
//    feels like a perspective ring rather than a flat circle.
//
//  String physics
//  ───────────────
//  Each string is a cubic Bézier.  Control points are displaced:
//    ① Tangentially backward — trails behind the card's orbital motion.
//    ② Radially outward      — centrifugal bow.
//  A slow sin wave on the slack factor makes the strings breathe.
//
//  Spring physics
//  ───────────────
//  Card positions are driven by an under-damped spring:
//    velocity += (target - pos) * stiffness
//    velocity *= damping
//    pos      += velocity
//  This gives an organic overshoot-and-settle rather than a linear lerp.
//
//  All drawing is done on a single interactive DrawingArea so hit-testing is
//  manual (same approach as OrbitSelector).
// ─────────────────────────────────────────────────────────────────────────────


// ── Wallpaper definitions ─────────────────────────────────────────────────────
//
//  Each wallpaper is described by a name, an accent colour, and gradient stops
//  that simulate the wallpaper's colour palette.  Swap these out for real image
//  file paths and use Cairo's image-surface API when you have actual files.

interface WallpaperDef {
  name: string
  accent: [number, number, number]     // R G B  0..1
  stops: Array<[number, string]>      // [position, css-hex-colour]
}

export const WALLPAPERS: WallpaperDef[] = [
  {
    name: "Aurora", accent: [0.18, 0.80, 0.86],
    stops: [[0, "#04101e"], [0.35, "#0a2844"], [0.7, "#1a6878"], [1, "#28b8cc"]]
  },
  {
    name: "Sunset", accent: [0.96, 0.50, 0.38],
    stops: [[0, "#120408"], [0.35, "#5c1428"], [0.7, "#c03848"], [1, "#f07858"]]
  },
  {
    name: "Forest", accent: [0.27, 0.68, 0.29],
    stops: [[0, "#040a04"], [0.35, "#0c280e"], [0.7, "#1e5420"], [1, "#3c8840"]]
  },
  {
    name: "Desert", accent: [0.93, 0.73, 0.34],
    stops: [[0, "#180e04"], [0.35, "#4c2c0e"], [0.7, "#a06020"], [1, "#e8b050"]]
  },
  {
    name: "Ocean", accent: [0.17, 0.58, 0.90],
    stops: [[0, "#04081a"], [0.35, "#082048"], [0.7, "#1048a0"], [1, "#2480d4"]]
  },
  {
    name: "Volcanic", accent: [0.89, 0.33, 0.20],
    stops: [[0, "#180404"], [0.35, "#3c0c0c"], [0.7, "#8c1c1c"], [1, "#e04828"]]
  },
  {
    name: "Arctic", accent: [0.52, 0.73, 0.94],
    stops: [[0, "#080c24"], [0.35, "#14205c"], [0.7, "#2858b8"], [1, "#78b0e8"]]
  },
  {
    name: "Nebula", accent: [0.88, 0.36, 0.96],
    stops: [[0, "#0c0414"], [0.35, "#30085e"], [0.7, "#6824a8"], [1, "#dc58f0"]]
  },
]


// ── Spring helper ─────────────────────────────────────────────────────────────
//  Returns [newPos, newVelocity].  Mutate the refs yourself.
const spring = (
  pos: number, vel: number, target: number,
  stiffness = 0.09, damping = 0.78,
): [number, number] => {
  const v = (vel + (target - pos) * stiffness) * damping
  return [pos + v, v]
}


// ── Cairo helpers ─────────────────────────────────────────────────────────────

// Hex string → [r, g, b] 0..1
const hexRGB = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16)
  return [(n >> 16 & 0xff) / 255, (n >> 8 & 0xff) / 255, (n & 0xff) / 255]
}

const roundRect = (
  cr: giCairo.Context,
  x: number, y: number, w: number, h: number, r: number,
) => {
  r = Math.min(r, w / 2, h / 2)
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

// Fill a rounded rect with a diagonal gradient that mimics a wallpaper palette.
const drawWallpaperCard = (
  cr: giCairo.Context,
  wp: WallpaperDef,
  x: number, y: number, w: number, h: number, r: number,
) => {
  cr.save()
  roundRect(cr, x, y, w, h, r)
  cr.clip()

  // Gradient diagonal
  const pat = new (giCairo.LinearGradient as any)(x, y, x + w, y + h)
  wp.stops.forEach(([pos, col]) => {
    const [R, G, B] = hexRGB(col)
    pat.addColorStopRGBA(pos, R, G, B, 1)
  })
  cr.setSource(pat)
  cr.paint()

  // Subtle top-highlight gloss
  const gloss = new (giCairo.LinearGradient as any)(x, y, x, y + h * 0.45)
  gloss.addColorStopRGBA(0, 1, 1, 1, 0.12)
  gloss.addColorStopRGBA(1, 1, 1, 1, 0)
  cr.setSource(gloss)
  cr.paint()

  cr.restore()
}

// Layered radial bloom around a rounded rect
const drawBoxGlow = (
  cr: giCairo.Context,
  x: number, y: number, w: number, h: number, r: number,
  R: number, G: number, B: number,
  layers = 5,
  alphaPerLayer = 0.025,
) => {
  for (let i = layers; i >= 1; i--) {
    const p = i * 5
    cr.save()
    roundRect(cr, x - p, y - p, w + p * 2, h + p * 2, r + p)
    cr.setSourceRGBA(R, G, B, alphaPerLayer)
    cr.fill()
    cr.restore()
  }
}

// Pulsing outer ring drawn around a rect (selected-state indicator)
const drawSelectionRing = (
  cr: giCairo.Context,
  x: number, y: number, w: number, h: number, r: number,
  R: number, G: number, B: number,
  pulse: number,   // 0..1 — modulates alpha
) => {
  const pad = 3
  cr.save()
  roundRect(cr, x - pad, y - pad, w + pad * 2, h + pad * 2, r + pad)
  cr.setSourceRGBA(R, G, B, 0.45 + pulse * 0.45)
  cr.setLineWidth(1.8)
  cr.stroke()
  cr.restore()
}


// ── Main component ────────────────────────────────────────────────────────────

export const MagneticSpread = ({ wallpapers = WALLPAPERS }: { wallpapers?: WallpaperDef[] }) => {
  const N = wallpapers.length

  // ── Card geometry constants ───────────────────────────────────────────────
  const SEL = { w: 220, h: 140, r: 14 }   // centre selected card
  const SM = { w: 92, h: 58, r: 8 }   // small ring cards

  // ── Per-card state ────────────────────────────────────────────────────────
  interface CardState {
    wp: WallpaperDef
    index: number          // wallpaper index
    slot: number          // ring slot (0..N-2), or -1 for the selected card
    angle: number          // current angle on ring (radians)
    phase: number          // individual time offset for bobbing/breathing
    x: number          // current pixel position (spring-driven)
    y: number
    vx: number
    vy: number
  }

  // Angle for ring slot k (0-indexed among N-1 slots)
  const slotAngle = (k: number) => (Math.PI * 2 * k) / (N - 1)

  // ── Reactive state ────────────────────────────────────────────────────────
  const tick = useRef(0)
  const selected = useRef(0)         // index of the selected wallpaper
  const hovered = useRef(-1)        // ring-slot index under the pointer
  const dims = useRef({ w: 400, h: 320 })

  // Build initial card states: card 0 starts selected (centre), rest on ring
  const cards = useRef<CardState[]>([])
  const anim = useAnimation(60)

  // ── Geometry helpers ──────────────────────────────────────────────────────
  const ringParams = (w: number, h: number) => ({
    cx: w / 2,
    cy: h / 2,
    rx: Math.min(w, h) * 0.305,
    ry: Math.min(w, h) * 0.185,    // squish for perspective feel
  })

  // Pixel target for a card given its current slot / selected state
  const targetPos = (
    card: CardState, w: number, h: number
  ): [number, number] => {
    const { cx, cy, rx, ry } = ringParams(w, h)
    if (card.slot === -1) return [cx, cy]           // selected → centre
    const a = card.angle
    const bob = Math.sin(tick.current * 0.009 + card.phase) * 9
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry + bob]
  }

  // ── Initialise cards ──────────────────────────────────────────────────────
  //  Called once after the first draw, when real pixel dimensions are known.
  const initCards = (w: number, h: number) => {
    const { cx, cy, rx, ry } = ringParams(w, h)
    let ringSlot = 0
    cards.current = wallpapers.map((wp, i) => {
      const isSelected = i === 0
      const slot = isSelected ? -1 : ringSlot++
      const angle = isSelected ? 0 : slotAngle(slot)
      const x = isSelected ? cx : cx + Math.cos(angle) * rx
      const y = isSelected ? cy : cy + Math.sin(angle) * ry
      return { wp, index: i, slot, angle, phase: i * 1.31, x, y, vx: 0, vy: 0 }
    })
  }

  // ── Select a wallpaper by index ───────────────────────────────────────────
  const selectWallpaper = (targetIndex: number) => {
    if (targetIndex === selected.current) return

    const prevSelCard = cards.current.find(c => c.index === selected.current)!
    const newSelCard = cards.current.find(c => c.index === targetIndex)!

    // The previously-selected card takes the ring slot the new one vacated
    prevSelCard.slot = newSelCard.slot
    prevSelCard.angle = newSelCard.angle

    // The newly-selected card moves to the centre slot
    newSelCard.slot = -1

    selected.current = targetIndex
    hovered.current = -1

    // Ensure the animation loop is running
    if (!anim.isRunning()) {
      anim.start(() => {
        tick.current++
        const { w, h } = dims.current
        let settled = true
        for (const c of cards.current) {
          const [tx, ty] = targetPos(c, w, h)
            ;[c.x, c.vx] = spring(c.x, c.vx, tx)
            ;[c.y, c.vy] = spring(c.y, c.vy, ty)
          if (Math.abs(tx - c.x) > 0.5 || Math.abs(ty - c.y) > 0.5) settled = false
        }
        redraw()
        // Keep running as long as cards are still bobbing (they always are, lazily)
        return true
      })
    }
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  const { widget: canvas, redraw } = useDrawingArea((cr, w, h) => {
    dims.current = { w, h }

    // First frame: init cards now that we have real dimensions
    if (cards.current.length === 0) initCards(w, h)

    const { cx, cy } = ringParams(w, h)
    const t = tick.current
    const pulse = (Math.sin(t * 0.045) + 1) / 2    // 0..1 slow pulse

    const selCard = cards.current.find(c => c.slot === -1)!
    const ringCards = cards.current.filter(c => c.slot >= 0)
      .sort((a, b) => a.slot - b.slot)

    // ── 1. Strings ─────────────────────────────────────────────────────────
    //  Drawn first so they appear behind cards and the centre piece.
    for (const c of ringCards) {
      const dx = c.x - cx, dy = c.y - cy
      const dist = Math.hypot(dx, dy) || 1

      // Perpendicular to the radial line = tangent direction
      const tx = -dy / dist, ty = dx / dist

      const breathe = Math.sin(t * 0.020 + c.phase * 2.1) * 0.10
      const slack = 0.42 + breathe
      const trail = slack * dist * 0.40   // backward (tangential)
      const bow = slack * dist * 0.07   // outward (radial)
      const rad_x = dx / dist, rad_y = dy / dist

      const cp1x = cx + dx * 0.28 - tx * trail * 0.45 + rad_x * bow
      const cp1y = cy + dy * 0.28 - ty * trail * 0.45 + rad_y * bow
      const cp2x = cx + dx * 0.68 - tx * trail + rad_x * bow
      const cp2y = cy + dy * 0.68 - ty * trail + rad_y * bow

      const [R, G, B] = c.wp.accent

      // Outer bloom
      cr.save()
      cr.moveTo(cx, cy); cr.curveTo(cp1x, cp1y, cp2x, cp2y, c.x, c.y)
      cr.setLineWidth(6); cr.setSourceRGBA(R, G, B, 0.06); cr.stroke()
      cr.restore()

      // Mid glow
      cr.save()
      cr.moveTo(cx, cy); cr.curveTo(cp1x, cp1y, cp2x, cp2y, c.x, c.y)
      cr.setLineWidth(2.5); cr.setSourceRGBA(R, G, B, 0.16); cr.stroke()
      cr.restore()

      // Thread core — slightly lighter tint so it reads as a thin thread
      cr.save()
      cr.moveTo(cx, cy); cr.curveTo(cp1x, cp1y, cp2x, cp2y, c.x, c.y)
      cr.setLineWidth(1.1)
      cr.setSourceRGBA(R * 0.6 + 0.4, G * 0.6 + 0.4, B * 0.6 + 0.4, 0.55)
      cr.stroke()
      cr.restore()
    }

    // ── 2. Ring cards ───────────────────────────────────────────────────────
    for (const c of ringCards) {
      const x = c.x - SM.w / 2, y = c.y - SM.h / 2
      const isHov = (c.slot === hovered.current)
      const [R, G, B] = c.wp.accent

      if (isHov) drawBoxGlow(cr, x, y, SM.w, SM.h, SM.r, R, G, B, 3, 0.030)

      drawWallpaperCard(cr, c.wp, x, y, SM.w, SM.h, SM.r)

      // Border
      cr.save()
      roundRect(cr, x, y, SM.w, SM.h, SM.r)
      cr.setSourceRGBA(R, G, B, isHov ? 0.82 : 0.38)
      cr.setLineWidth(1.2); cr.stroke()
      cr.restore()

      // Hover brighten
      if (isHov) {
        cr.save()
        roundRect(cr, x, y, SM.w, SM.h, SM.r)
        cr.setSourceRGBA(1, 1, 1, 0.08)
        cr.fill()
        cr.restore()
      }

      // Label below card
      cr.save()
      cr.setFontSize(9)
      cr.setSourceRGBA(1, 1, 1, isHov ? 0.75 : 0.42)
      const te = cr.textExtents(c.wp.name)
      cr.moveTo(c.x - te.width / 2 - te.xBearing, c.y + SM.h / 2 + 12 - te.yBearing / 2)
      cr.showText(c.wp.name)
      cr.restore()
    }

    // ── 3. Centre card — always on top ──────────────────────────────────────
    if (selCard) {
      const x = cx - SEL.w / 2, y = cy - SEL.h / 2
      const [R, G, B] = selCard.wp.accent

      // Multi-layer glow
      drawBoxGlow(cr, x, y, SEL.w, SEL.h, SEL.r, R, G, B, 7, 0.018 * (0.65 + pulse * 0.35))

      drawWallpaperCard(cr, selCard.wp, x, y, SEL.w, SEL.h, SEL.r)

      // Pulsing selection ring
      drawSelectionRing(cr, x, y, SEL.w, SEL.h, SEL.r, R, G, B, pulse)

      // Name label — larger, accent-coloured
      cr.save()
      cr.setFontSize(12)
      cr.setSourceRGBA(R * 0.6 + 0.4, G * 0.6 + 0.4, B * 0.6 + 0.4, 0.90)
      const te = cr.textExtents(selCard.wp.name.toUpperCase())
      cr.moveTo(cx - te.width / 2 - te.xBearing, cy + SEL.h / 2 + 18 - te.yBearing / 2)
      cr.showText(selCard.wp.name.toUpperCase())
      cr.restore()
    }

    // ── 4. Hint text ────────────────────────────────────────────────────────
    cr.save()
    cr.setFontSize(9)
    cr.setSourceRGBA(1, 1, 1, 0.18)
    const hint = "click a wallpaper to select"
    const te = cr.textExtents(hint)
    cr.moveTo(w / 2 - te.width / 2 - te.xBearing, h - 12)
    cr.showText(hint)
    cr.restore()

  }, { interactive: true })

  // ── Infinite idle bobbing ─────────────────────────────────────────────────
  anim.start(() => {
    tick.current++
    const { w, h } = dims.current
    for (const c of cards.current) {
      const [tx, ty] = targetPos(c, w, h)
        ;[c.x, c.vx] = spring(c.x, c.vx, tx)
        ;[c.y, c.vy] = spring(c.y, c.vy, ty)
    }
    redraw()
    return true
  })

  // ── Pointer handling ──────────────────────────────────────────────────────
  const gesture = new Gtk.GestureClick()
  gesture.connect("pressed", (_: Gtk.GestureClick, _n: number, x: number, y: number) => {
    const hit = cards.current.find(c =>
      c.slot >= 0 &&
      Math.abs(x - c.x) < SM.w / 2 &&
      Math.abs(y - c.y) < SM.h / 2
    )
    if (hit) selectWallpaper(hit.index)
  })
  canvas.add_controller(gesture)

  const motion = new Gtk.EventControllerMotion()
  motion.connect("motion", (_: Gtk.EventControllerMotion, x: number, y: number) => {
    let h = -1
    for (const c of cards.current) {
      if (c.slot >= 0 && Math.abs(x - c.x) < SM.w / 2 && Math.abs(y - c.y) < SM.h / 2) {
        h = c.slot; break
      }
    }
    if (h !== hovered.current) {
      hovered.current = h
      canvas.set_cursor(
        h >= 0
          ? Gdk.Cursor.new_from_name("pointer", null)
          : Gdk.Cursor.new_from_name("default", null)
      )
    }
  })
  canvas.add_controller(motion)

  return canvas
}

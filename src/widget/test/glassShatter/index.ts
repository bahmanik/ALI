import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"
import { useRef, useAnimation, useDrawingArea } from "./hooks"

// ─────────────────────────────────────────────────────────────────────────────
//  GlassShatter — wallpaper picker
//
//  State machine
//  ─────────────
//  idle ──[click card]──→ cracking ──[done]──→ scattering ──[done]──→ scattered
//  scattered ──[click shard]──→ reassembling ──[done]──→ idle (new wallpaper)
//
//  Shard geometry
//  ──────────────
//  A fixed set of Voronoi seeds inside the card rectangle produces one
//  irregular polygon per wallpaper.  The polygon is stored as vertices
//  relative to the shard's centroid, so translate+rotate is free.
//
//  Glass visuals
//  ─────────────
//  Each shard gets three drawing passes:
//    1. Dark translucent fill (depth)
//    2. Bright highlight on one edge quadrant (light catching the glass)
//    3. Coloured outline stroke (crack glow)
//  The crack-glow opacity spikes at shatter time then fades out.
//
//  Morph: polygon → thumbnail card
//  ────────────────────────────────
//  Once a shard reaches its scatter position the `morph` value springs 0→1.
//  At morph=0 only the glass polygon is drawn; at morph=1 only the thumbnail
//  card; between the two cross-fade.  The polygon vertices lerp toward the
//  bounding rect corners simultaneously, so the shape itself distorts.
// ─────────────────────────────────────────────────────────────────────────────

const TAU = 2 * Math.PI
type Pt = [number, number]
type Col = [number, number, number]
type Phase = "idle" | "cracking" | "scattering" | "scattered" | "reassembling"

// ── Sutherland-Hodgman single-edge clip ────────────────────────────────────────
// Keeps the LEFT side of the directed line A→B.
const clipHalfPlane = (poly: Pt[], ax: number, ay: number, bx: number, by: number): Pt[] => {
  if (!poly.length) return []
  const side = (px: number, py: number) => (bx - ax) * (py - ay) - (by - ay) * (px - ax)
  const out: Pt[] = []
  for (let i = 0; i < poly.length; i++) {
    const [cx, cy] = poly[i]
    const [dx, dy] = poly[(i + 1) % poly.length]
    const sc = side(cx, cy), sd = side(dx, dy)
    if (sc >= 0) out.push([cx, cy])
    if ((sc >= 0) !== (sd >= 0)) {
      // Line-line intersection: parametric form on segment C→D
      const denom = (cx - dx) * (ay - by) - (cy - dy) * (ax - bx)
      if (Math.abs(denom) > 1e-10) {
        const t = ((cx - ax) * (ay - by) - (cy - ay) * (ax - bx)) / denom
        out.push([cx + t * (dx - cx), cy + t * (dy - cy)])
      }
    }
  }
  return out
}

// Voronoi cell of seeds[i] clipped to [0,W]×[0,H].
const voronoiCell = (seeds: Pt[], i: number, W: number, H: number): Pt[] => {
  let poly: Pt[] = [[0, 0], [W, 0], [W, H], [0, H]]
  const [sx, sy] = seeds[i]
  for (let j = 0; j < seeds.length; j++) {
    if (j === i || !poly.length) continue
    const [ox, oy] = seeds[j]
    const mx = (sx + ox) / 2, my = (sy + oy) / 2
    const nx = ox - sx, ny = oy - sy
    // Half-plane keeping points closer to seeds[i].
    // Left of (mx,my)→(mx-ny, my+nx) is exactly that set.
    poly = clipHalfPlane(poly, mx, my, mx - ny, my + nx)
  }
  return poly
}

// Vertex-average centroid (good enough for visual work).
const centroid = (verts: Pt[]): Pt => {
  let x = 0, y = 0
  for (const [px, py] of verts) { x += px; y += py }
  return [x / verts.length, y / verts.length]
}

// ── Card / shard constants ─────────────────────────────────────────────────────
const CW = 210, CH = 134   // central card size
const SCATTER_R = 175       // radius of the scatter ring

// Fixed Voronoi seeds (card-local coords).  Chosen by hand for a nice crack
// pattern — not symmetric so it reads as random breakage, not a grid.
const SEEDS: Pt[] = [
  [44, 28], [130, 20], [185, 55],
  [22, 90], [90, 72], [168, 100],
  [60, 118], [155, 125],
]
const N = SEEDS.length

// ── Wallpaper palette ──────────────────────────────────────────────────────────
interface Wall { name: string; top: Col; bot: Col; acc: Col }
const WALLS: Wall[] = [
  { name: "Sunset", top: [0.95, 0.38, 0.12], bot: [0.38, 0.18, 0.06], acc: [1.00, 0.76, 0.14] },
  { name: "Midnight", top: [0.05, 0.05, 0.22], bot: [0.04, 0.14, 0.04], acc: [0.80, 0.88, 1.00] },
  { name: "Forest", top: [0.32, 0.62, 0.88], bot: [0.10, 0.38, 0.08], acc: [0.98, 0.92, 0.42] },
  { name: "Ocean", top: [0.02, 0.40, 0.68], bot: [0.01, 0.22, 0.40], acc: [0.68, 0.94, 1.00] },
  { name: "Aurora", top: [0.03, 0.10, 0.18], bot: [0.06, 0.22, 0.10], acc: [0.18, 0.95, 0.60] },
  { name: "Desert", top: [0.94, 0.70, 0.26], bot: [0.70, 0.52, 0.28], acc: [1.00, 0.38, 0.10] },
]

// Each shard is permanently bonded to one wallpaper (round-robin).
const SHARD_WALL = (i: number) => WALLS[i % WALLS.length]

// ── Per-shard physics ──────────────────────────────────────────────────────────
interface ShardState {
  // Geometry (centroid-relative, fixed after generation)
  relVerts: Pt[]
  localCentroid: Pt  // centroid in card-local coords (for initial world pos)

  // World physics
  wx: number; wy: number
  wAngle: number
  vx: number; vy: number
  angV: number

  // Spring targets
  targetX: number; targetY: number
  targetAngle: number

  // morph 0→1: glass polygon → thumbnail card
  morph: number; morphV: number

  // opacity for reassembly collapse
  opacity: number; opacityV: number

  // crack-glow intensity (spikes at shatter, then fades)
  crackGlow: number
}

// ── Cairo helpers ──────────────────────────────────────────────────────────────
const clip = (cr: giCairo.Context, fn: () => void) => { cr.save(); fn(); cr.restore() }

const polyPath = (cr: giCairo.Context, verts: Pt[]) => {
  cr.moveTo(verts[0][0], verts[0][1])
  for (let i = 1; i < verts.length; i++) cr.lineTo(verts[i][0], verts[i][1])
  cr.closePath()
}

// Lerp each polygon vertex toward the bounding-rect corner it is closest to.
// Returns interpolated vertices at blend t (0=polygon, 1=rect).
const lerpPolyToRect = (verts: Pt[], bw: number, bh: number, t: number): Pt[] => {
  // rect corners relative to centroid
  const corners: Pt[] = [[-bw / 2, -bh / 2], [bw / 2, -bh / 2], [bw / 2, bh / 2], [-bw / 2, bh / 2]]
  return verts.map(([px, py]) => {
    // Find closest corner by angle quadrant
    const angle = Math.atan2(py, px)                // -π..π
    const qi = Math.round(((angle + TAU) % TAU) / (TAU / 4)) % 4
    const [cx, cy] = corners[qi]
    return [px + (cx - px) * t, py + (cy - py) * t] as Pt
  })
}

// Draw a miniature landscape wallpaper inside the current clip.
const drawWallpaper = (
  cr: giCairo.Context, x: number, y: number, w: number, h: number, wall: Wall,
) => {
  const [tr, tg, tb] = wall.top
  const [br, bg, bb] = wall.bot
  const [ar, ag, ab] = wall.acc

  // Sky
  cr.setSourceRGBA(tr, tg, tb, 1); cr.rectangle(x, y, w, h); cr.fill()
  // Horizon haze
  cr.setSourceRGBA(tr * 1.1, tg * 1.05, tb * 1.05, 0.38)
  cr.rectangle(x, y + h * 0.42, w, h * 0.22); cr.fill()
  // Ground
  cr.setSourceRGBA(br, bg, bb, 1); cr.rectangle(x, y + h * 0.68, w, h * 0.32); cr.fill()
  // Accent orb
  const ox = x + w * 0.72, oy = y + h * 0.26, or_ = h * 0.12
  cr.arc(ox, oy, or_ * 1.8, 0, TAU); cr.setSourceRGBA(ar, ag, ab, 0.18); cr.fill()
  cr.arc(ox, oy, or_, 0, TAU); cr.setSourceRGBA(ar, ag, ab, 0.92); cr.fill()
  // Glass top highlight
  cr.setSourceRGBA(1, 1, 1, 0.12); cr.rectangle(x, y, w, h * 0.08); cr.fill()
}

const roundRect = (cr: giCairo.Context, x: number, y: number, w: number, h: number, r: number) => {
  cr.moveTo(x + r, y)
  cr.lineTo(x + w - r, y); cr.arc(x + w - r, y + r, r, -Math.PI / 2, 0)
  cr.lineTo(x + w, y + h - r); cr.arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
  cr.lineTo(x + r, y + h); cr.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
  cr.lineTo(x, y + r); cr.arc(x + r, y + r, r, Math.PI, -Math.PI / 2)
  cr.closePath()
}

// ── Draw one shard ─────────────────────────────────────────────────────────────
// Caller sets up translate+rotate so we draw around the origin.
const drawShard = (
  cr: giCairo.Context,
  shard: ShardState,
  wall: Wall,
  crackGlow: number,
  morph: number,
  opacity: number,
) => {
  if (opacity <= 0.01) return

  const tw = 80, th = 52   // thumbnail card size (at morph=1)
  const r = 6

  // Interpolated vertices (morph blends polygon → bounding rect)
  const verts = lerpPolyToRect(shard.relVerts, tw, th, morph)

  cr.save()
  cr.setOperator(giCairo.Operator.OVER)
  cr.pushGroup()

  // ── Glass polygon layer (fades out as morph→1) ──────────────────────────
  if (morph < 0.98) {
    const polyAlpha = 1 - morph
    clip(cr, () => {
      polyPath(cr, verts); cr.clip()

      // Dark fill
      const [tr, tg, tb] = wall.top
      cr.setSourceRGBA(tr * 0.25, tg * 0.25, tb * 0.25, 0.90 * polyAlpha)
      polyPath(cr, verts); cr.fill()

      // Wallpaper colour bleed (faint)
      drawWallpaper(cr, -tw / 2, -th / 2, tw, th, wall)
      cr.setSourceRGBA(0, 0, 0, 0.55 * polyAlpha)
      polyPath(cr, verts); cr.fill()

      // Top-left highlight (light source)
      const [hx, hy] = verts[0]
      const [hx2, hy2] = verts[1]
      clip(cr, () => {
        cr.moveTo(hx, hy); cr.lineTo(hx2, hy2)
        cr.setLineWidth(2); cr.setSourceRGBA(1, 1, 1, 0.28 * polyAlpha); cr.stroke()
      })
    })

    // Crack-glow outline
    clip(cr, () => {
      polyPath(cr, verts)
      const [ar, ag, ab] = wall.acc
      // Outer bloom
      cr.setLineWidth(4); cr.setSourceRGBA(ar, ag, ab, 0.18 * (polyAlpha + crackGlow * 0.8)); cr.stroke()
      polyPath(cr, verts)
      // Core crack line
      cr.setLineWidth(1.2)
      cr.setSourceRGBA(
        ar * 0.5 + 0.5, ag * 0.5 + 0.5, ab * 0.5 + 0.5,
        (0.50 + crackGlow * 0.5) * polyAlpha,
      )
      cr.stroke()
    })
  }

  // ── Thumbnail card layer (fades in as morph→1) ──────────────────────────
  if (morph > 0.02) {
    const cardAlpha = morph
    clip(cr, () => {
      roundRect(cr, -tw / 2, -th / 2, tw, th, r)
      cr.clip()
      drawWallpaper(cr, -tw / 2, -th / 2, tw, th, wall)
      // Tint overlay
      cr.setSourceRGBA(0, 0, 0, (1 - cardAlpha) * 0.7)
      cr.rectangle(-tw / 2, -th / 2, tw, th); cr.fill()
    })

    // Thumbnail border + accent glow
    clip(cr, () => {
      const [ar, ag, ab] = wall.acc
      for (let g = 3; g >= 1; g--) {
        const pad = g * 3.5
        roundRect(cr, -tw / 2 - pad, -th / 2 - pad, tw + pad * 2, th + pad * 2, r + pad)
        cr.setSourceRGBA(ar, ag, ab, 0.04 * cardAlpha); cr.fill()
      }
      roundRect(cr, -tw / 2, -th / 2, tw, th, r)
      cr.setLineWidth(1.5); cr.setSourceRGBA(ar, ag, ab, 0.70 * cardAlpha); cr.stroke()
    })

    // Label
    clip(cr, () => {
      cr.setFontSize(10)
      cr.setSourceRGBA(1, 1, 1, 0.88 * cardAlpha)
      const te = cr.textExtents(wall.name)
      cr.moveTo(-te.width / 2 - te.xBearing, -te.height / 2 - te.yBearing)
      cr.showText(wall.name)
    })
  }

  cr.popGroupToSource()
  cr.paintWithAlpha(opacity)
  cr.restore()
}

// ── Draw the idle central card ────────────────────────────────────────────────
const drawCard = (
  cr: giCairo.Context, cx: number, cy: number,
  wall: Wall, shards: ShardState[], crackAlpha: number,
) => {
  const x = cx - CW / 2, y = cy - CH / 2, r = 10
  const [ar, ag, ab] = wall.acc

  // Outer glow
  for (const [pad, a] of [[18, 0.04], [10, 0.09], [5, 0.18]] as [number, number][]) {
    clip(cr, () => {
      roundRect(cr, x - pad, y - pad, CW + pad * 2, CH + pad * 2, r + pad)
      cr.setSourceRGBA(ar, ag, ab, a); cr.fill()
    })
  }

  // Wallpaper
  clip(cr, () => {
    roundRect(cr, x, y, CW, CH, r); cr.clip()
    drawWallpaper(cr, x, y, CW, CH, wall)
  })

  // Border
  clip(cr, () => {
    roundRect(cr, x, y, CW, CH, r)
    cr.setLineWidth(2); cr.setSourceRGBA(ar, ag, ab, 0.80); cr.stroke()
  })

  // Crack lines (Voronoi edges, shown in idle phase)
  if (crackAlpha > 0) {
    for (const shard of shards) {
      const [sr, sg, sb] = SHARD_WALL(shards.indexOf(shard)).acc
      clip(cr, () => {
        cr.save()
        cr.translate(cx - CW / 2, cy - CH / 2)   // card origin
        polyPath(cr, shard.relVerts.map(([vx, vy]) => [
          vx + shard.localCentroid[0],
          vy + shard.localCentroid[1],
        ] as Pt))
        cr.setLineWidth(1.0)
        cr.setSourceRGBA(sr * 0.6 + 0.4, sg * 0.6 + 0.4, sb * 0.6 + 0.4, crackAlpha * 0.35)
        cr.stroke()
        cr.restore()
      })
    }
  }

  // Label at bottom
  clip(cr, () => {
    cr.setFontSize(13)
    cr.setSourceRGBA(1, 1, 1, 0.85)
    const te = cr.textExtents(wall.name)
    cr.moveTo(cx - te.width / 2 - te.xBearing, cy + CH / 2 - 14 - te.yBearing)
    cr.showText(wall.name)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────

export const GlassShatter = () => {
  const currentWall = useRef(0)
  const selectedIdx = useRef(-1)   // shard index chosen during reassembling
  const phase = useRef<Phase>("idle")
  const tick = useRef(0)
  const crackAlpha = useRef(0)    // crack-glow intensity for idle pre-crack overlay
  const dims = useRef({ w: 460, h: 420 })
  const shards = useRef<ShardState[]>([])
  const anim = useAnimation(60)

  // ── Build shards from Voronoi ──────────────────────────────────────────────
  const buildShards = () => {
    const cells = SEEDS.map((_, i) => voronoiCell(SEEDS, i, CW, CH))
    shards.current = cells.map((verts, i) => {
      const [ccx, ccy] = centroid(verts)
      // relVerts: each vertex relative to its centroid
      const rel = verts.map(([vx, vy]) => [vx - ccx, vy - ccy] as Pt)
      return {
        relVerts: rel,
        localCentroid: [ccx, ccy] as Pt,
        wx: 0, wy: 0, wAngle: 0,
        vx: 0, vy: 0, angV: 0,
        targetX: 0, targetY: 0, targetAngle: 0,
        morph: 0, morphV: 0,
        opacity: 1, opacityV: 0,
        crackGlow: 0,
      } as ShardState
    })
  }

  // Place each shard at its card-local position (for idle state sync).
  const placeOnCard = (cx: number, cy: number) => {
    for (const s of shards.current) {
      s.wx = cx - CW / 2 + s.localCentroid[0]
      s.wy = cy - CH / 2 + s.localCentroid[1]
      s.wAngle = 0
      s.vx = 0; s.vy = 0; s.angV = 0
    }
  }

  // Assign scatter targets evenly around a ring.
  const assignScatterTargets = (cx: number, cy: number) => {
    shards.current.forEach((s, i) => {
      const angle = TAU * i / N - Math.PI / 2
      s.targetX = cx + SCATTER_R * Math.cos(angle)
      s.targetY = cy + SCATTER_R * Math.sin(angle)
      s.targetAngle = 0
    })
  }

  // ── Phase transitions ──────────────────────────────────────────────────────

  const startCracking = (cx: number, cy: number) => {
    if (phase.current !== "idle") return
    phase.current = "cracking"
    placeOnCard(cx, cy)
    assignScatterTargets(cx, cy)
    // Animate crack glow then scatter
    crackAlpha.current = 0
    anim.start(
      () => {
        crackAlpha.current = Math.min(1, crackAlpha.current + 0.07)
        return crackAlpha.current < 1
      },
      // onDone: start scattering
      () => {
        phase.current = "scattering"
        // Give each shard an outward velocity impulse + spin
        shards.current.forEach((s, i) => {
          const dx = s.wx - cx, dy = s.wy - cy
          const d = Math.hypot(dx, dy) || 1
          const speed = 4 + Math.random() * 3
          s.vx = (dx / d) * speed + (Math.random() - 0.5) * 2
          s.vy = (dy / d) * speed + (Math.random() - 0.5) * 2
          s.angV = (Math.random() - 0.5) * 0.18
          s.crackGlow = 1
        })
        anim.start(stepScattering)
      },
    )
  }

  const stepScattering = (): boolean => {
    const allSettled = shards.current.every(s => {
      const dx = s.targetX - s.wx, dy = s.targetY - s.wy
      return Math.hypot(dx, dy) < 1.5 && Math.abs(s.vx) < 0.1 && Math.abs(s.vy) < 0.1
    })

    for (const s of shards.current) {
      // Spring toward scatter target
      s.vx += (s.targetX - s.wx) * 0.06
      s.vy += (s.targetY - s.wy) * 0.06
      s.vx *= 0.84; s.vy *= 0.84
      s.wx += s.vx; s.wy += s.vy

      s.angV += (s.targetAngle - s.wAngle) * 0.08
      s.angV *= 0.80
      s.wAngle += s.angV

      s.crackGlow = Math.max(0, s.crackGlow - 0.025)

      // Start morphing once close to target
      const dist = Math.hypot(s.targetX - s.wx, s.targetY - s.wy)
      if (dist < 40) {
        s.morphV += (1 - s.morph) * 0.10
        s.morphV *= 0.80
        s.morph = Math.min(1, s.morph + s.morphV)
      }
    }

    if (allSettled) {
      phase.current = "scattered"
      return false
    }
    return true
  }

  const startReassembling = (shardIdx: number) => {
    if (phase.current !== "scattered") return
    phase.current = "reassembling"
    selectedIdx.current = shardIdx

    shards.current.forEach((s, i) => {
      if (i !== shardIdx) {
        // Others collapse in place
        s.vx = (Math.random() - 0.5) * 1.5
        s.vy = (Math.random() - 0.5) * 1.5
      }
    })
    anim.start(stepReassembling, () => {
      currentWall.current = shardIdx % WALLS.length
      phase.current = "idle"
      crackAlpha.current = 0
    })
  }

  const stepReassembling = (): boolean => {
    const { w, h } = dims.current
    const cx = w / 2, cy = h / 2
    const sel = selectedIdx.current
    let allDone = true

    shards.current.forEach((s, i) => {
      if (i === sel) {
        // Spring to card centre
        s.vx += (cx - s.wx) * 0.10; s.vy += (cy - s.wy) * 0.10
        s.vx *= 0.80; s.vy *= 0.80
        s.wx += s.vx; s.wy += s.vy

        s.angV += (0 - s.wAngle) * 0.12; s.angV *= 0.75; s.wAngle += s.angV

        // Morph reverses: thumbnail → polygon
        s.morphV += (0 - s.morph) * 0.12; s.morphV *= 0.78; s.morph = Math.max(0, s.morph + s.morphV)

        // Crack glow surges as it arrives
        const dist = Math.hypot(cx - s.wx, cy - s.wy)
        s.crackGlow = Math.min(1, s.crackGlow + (dist < 30 ? 0.06 : 0))

        const done = dist < 3 && Math.abs(s.morph) < 0.02
        if (!done) allDone = false
      } else {
        // Collapse: drift + fade
        s.vx *= 0.88; s.vy *= 0.88
        s.wx += s.vx; s.wy += s.vy
        s.opacityV += (0 - s.opacity) * 0.08
        s.opacityV *= 0.78
        s.opacity = Math.max(0, s.opacity + s.opacityV)
        if (s.opacity > 0.02) allDone = false
      }
    })
    return !allDone
  }

  // ── Canvas ─────────────────────────────────────────────────────────────────
  const { widget: canvas, redraw } = useDrawingArea((cr, w, h) => {
    dims.current = { w, h }
    if (!shards.current.length) buildShards()

    const cx = w / 2, cy = h / 2
    const ph = phase.current

    if (ph === "idle") {
      drawCard(cr, cx, cy, WALLS[currentWall.current], shards.current, crackAlpha.current)
      return
    }

    // Draw shards in flight / scattered / reassembling
    for (let i = 0; i < N; i++) {
      const s = shards.current[i]
      const wall = SHARD_WALL(i)
      cr.save()
      cr.translate(s.wx, s.wy)
      cr.rotate(s.wAngle)
      drawShard(cr, s, wall, s.crackGlow, s.morph, s.opacity)
      cr.restore()
    }

    // In reassembling phase, overlay the card once the selected shard is close
    if (ph === "reassembling") {
      const sel = shards.current[selectedIdx.current]
      const dist = Math.hypot(cx - sel.wx, cy - sel.wy)
      if (dist < 30 && sel.morph < 0.08) {
        const alpha = Math.max(0, 1 - dist / 30)
        cr.save()
        cr.setOperator(giCairo.Operator.OVER)
        cr.pushGroup()
        drawCard(cr, cx, cy, SHARD_WALL(selectedIdx.current), shards.current, 0)
        cr.popGroupToSource()
        cr.paintWithAlpha(alpha)
        cr.restore()
      }
    }
  }, { interactive: true })

  // ── Continuous idle breathe + step during active phases ───────────────────
  anim.start(() => {
    tick.current++
    redraw()
    return true
  })

  // ── Click handling ─────────────────────────────────────────────────────────
  const gesture = new Gtk.GestureClick()
  gesture.connect("pressed", (_: Gtk.GestureClick, _n: number, px: number, py: number) => {
    const { w, h } = dims.current
    const cx = w / 2, cy = h / 2

    if (phase.current === "idle") {
      // Hit-test the central card
      if (px >= cx - CW / 2 && px <= cx + CW / 2 && py >= cy - CH / 2 && py <= cy + CH / 2) {
        buildShards()
        startCracking(cx, cy)
      }
      return
    }

    if (phase.current === "scattered") {
      // Hit-test each shard's bounding box
      for (let i = N - 1; i >= 0; i--) {
        const s = shards.current[i]
        if (s.opacity < 0.2) continue
        const dx = px - s.wx, dy = py - s.wy
        // Rotate click point into shard's local space
        const ldx = dx * Math.cos(-s.wAngle) - dy * Math.sin(-s.wAngle)
        const ldy = dx * Math.sin(-s.wAngle) + dy * Math.cos(-s.wAngle)
        if (Math.abs(ldx) < 44 && Math.abs(ldy) < 30) {
          startReassembling(i)
          return
        }
      }
    }
  })
  canvas.add_controller(gesture)

  return canvas
}

import { RGBA } from "src/configuration/types"
import type { Opt } from "src/lib/options"

// ═════════════════════════════════════════════════════════════════════════════
// Variant enum
// ═════════════════════════════════════════════════════════════════════════════

export type CircularProgressVariant =
  | "simple"      // spring-physics arc, zero animation overhead
  | "glow"        // smooth lerp + gradient fill + pulsing dot at tip
  | "neon"        // triple-stroke bloom, white-hot tip
  | "segmented"   // arc made of discrete segment dashes with gaps
  | "dual"        // two concentric rings (progress outer, remainder inner)
  | "fill"        // pie-slice fill that grows with value
  | "wave"        // Catmull-Rom shimmer line inside arc + ripple tip

// ═════════════════════════════════════════════════════════════════════════════
// Single flat options interface
//
// Why flat instead of a discriminated union?
// Each variant renderer (GlowProgress, NeonProgress, …) is a plain function
// that receives Props — the same unnarrowed CircularProgressOptions — and
// TypeScript resolves an unnarrowed union to the intersection of its members,
// hiding every variant-specific field. A flat interface avoids this entirely
// and matches what the factory (overrideCircularProgress) actually produces:
// one object with every field present.
// ═════════════════════════════════════════════════════════════════════════════

export interface CircularProgressOptions {
  // ── discriminant ──────────────────────────────────────────────────────────
  /** Active visual variant */
  type: Opt<CircularProgressVariant>

  // ── universal ─────────────────────────────────────────────────────────────
  /** Width and height of the drawing area in pixels */
  size: Opt<number>
  /** Stroke / arc thickness in pixels */
  thickness: Opt<number>
  /** Primary RGBA colour – [r, g, b, a], channels 0..1 */
  color: Opt<RGBA>
  /** Render the percentage label in the centre */
  showText: Opt<boolean>
  /** Font size of the centre label in px */
  textFontSize: Opt<number>
  /** Alpha multiplier for the centre label (0..1) */
  textAlpha: Opt<number>
  /** Alpha of the background track ring (0..1) */
  trackAlpha: Opt<number>

  // ── shared animated ───────────────────────────────────────────────────────
  /** Exponential-smoothing factor for lerp-based variants (0 = snap, ~0.3 = drift) */
  smoothing: Opt<number>
  /** Max extra radius the tip halo expands to in px */
  pulseRadiusDelta: Opt<number>
  /** Oscillation speed of the tip halo per frame */
  pulseSpeed: Opt<number>

  // ── simple ────────────────────────────────────────────────────────────────
  /** Spring stiffness – how hard the arc snaps toward the target (0..1) */
  springStiffness: Opt<number>
  /** Spring damping – friction that prevents overshoot (0..1) */
  springDamping: Opt<number>

  // ── glow ──────────────────────────────────────────────────────────────────
  /** Alpha of the radial gradient fill behind the arc (0..1) */
  glowFillAlpha: Opt<number>
  /** Peak alpha of the pulsing tip halo (0..1) */
  glowTipAlpha: Opt<number>

  // ── neon ──────────────────────────────────────────────────────────────────
  /** Width multiplier for the outer bloom stroke */
  outerWidthMul: Opt<number>
  /** Alpha of the outer bloom stroke (0..1) */
  outerAlpha: Opt<number>
  /** Width multiplier for the mid bloom stroke */
  midWidthMul: Opt<number>
  /** Alpha of the mid bloom stroke (0..1) */
  midAlpha: Opt<number>
  /** Max extra radius of the tip flare halo (px) */
  flareRadiusDelta: Opt<number>
  /** Peak alpha of the tip flare halo (0..1) */
  flareAlpha: Opt<number>
  /** Radius of the white-hot core dot at the tip (px) */
  coreRadius: Opt<number>
  /** Radius of the colour dot inside the core (px) */
  colorDotRadius: Opt<number>

  // ── segmented ─────────────────────────────────────────────────────────────
  /** Number of segments around the full circle */
  segmentCount: Opt<number>
  /** Gap between segments in radians */
  segmentGapRad: Opt<number>
  /** Alpha of filled segments (0..1) */
  segmentFillAlpha: Opt<number>
  /** Alpha of empty (unfilled) segments (0..1) */
  segmentEmptyAlpha: Opt<number>

  // ── dual ──────────────────────────────────────────────────────────────────
  /** Inner ring radius as a fraction of the outer radius (0..1) */
  innerRingRatio: Opt<number>
  /** Alpha of the inner remainder ring (0..1) */
  innerRingAlpha: Opt<number>

  // ── fill ──────────────────────────────────────────────────────────────────
  /** Alpha at the outer edge of the pie-slice gradient (0..1) */
  fillAlphaEdge: Opt<number>
  /** Alpha at the centre of the pie-slice gradient (0..1) */
  fillAlphaCenter: Opt<number>

  // ── wave ──────────────────────────────────────────────────────────────────
  /** Alpha of the inner Catmull-Rom shimmer stroke (0..1) */
  shimmerAlpha: Opt<number>
  /** Width multiplier for the shimmer stroke relative to main thickness */
  shimmerWidthMul: Opt<number>
  /** Radial inset of the shimmer line from the main arc (px) */
  shimmerOffset: Opt<number>
}

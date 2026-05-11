import type { Opt } from "src/lib/options"

// ═════════════════════════════════════════════════════════════════════════════
// Variant enum
// ═════════════════════════════════════════════════════════════════════════════

export type LineGraphVariant =
  | "simple"        // clean line, no animation
  | "glow"          // lerp + gradient fill + pulsing tip dot
  | "neon"          // triple-stroke bloom, white-hot tip
  | "stepped"       // horizontal→vertical segments
  | "bar"           // histogram bars with gradient
  | "segment-bar"   // stacked rounded-rect columns
  | "wave"          // Catmull-Rom spline + shimmer

/** RGBA color tuple – channels normalised 0..1 */
export type LineGraphRGBA = [number, number, number, number]

// ═════════════════════════════════════════════════════════════════════════════
// Single flat options interface
//
// Flat (not a discriminated union) for the same reason as CircularProgress:
// variant renderers all receive the unnarrowed type, so every field must be
// reachable unconditionally. Unused variant fields are simply ignored by the
// active draw function.
// ═════════════════════════════════════════════════════════════════════════════

export interface LineGraphOptions {
  // ── discriminant ──────────────────────────────────────────────────────────
  /** Active visual variant */
  type: Opt<LineGraphVariant>

  // ── universal ─────────────────────────────────────────────────────────────
  /** Canvas width in px */
  width: Opt<number>
  /** Canvas height in px */
  height: Opt<number>
  /** Line / stroke thickness in px */
  thickness: Opt<number>
  /** Primary RGBA colour – [r, g, b, a], channels 0..1 */
  color: Opt<LineGraphRGBA>

  // ── shared animated ───────────────────────────────────────────────────────
  /** Exponential-smoothing factor (0 = instant snap, ~0.3 = slow drift) */
  smoothing: Opt<number>
  /** Max extra radius the tip halo expands to (px) */
  pulseRadiusDelta: Opt<number>
  /** Oscillation speed of the tip halo per frame */
  pulseSpeed: Opt<number>

  // ── glow ──────────────────────────────────────────────────────────────────
  /** Alpha of the fill gradient at the top (0..1) */
  glowFillAlphaTop: Opt<number>
  /** Alpha of the fill gradient at the mid-stop (0..1) */
  glowFillAlphaMid: Opt<number>
  /** Gradient stop position for the mid-alpha (0..1) */
  glowFillMidStop: Opt<number>

  // ── neon ──────────────────────────────────────────────────────────────────
  /** Outer bloom stroke width multiplier */
  neonOuterWidthMul: Opt<number>
  /** Outer bloom stroke alpha (0..1) */
  neonOuterAlpha: Opt<number>
  /** Mid bloom stroke width multiplier */
  neonMidWidthMul: Opt<number>
  /** Mid bloom stroke alpha (0..1) */
  neonMidAlpha: Opt<number>
  /** Max extra radius of the tip flare (px) */
  neonFlareDelta: Opt<number>
  /** Peak alpha of the tip flare (0..1) */
  neonFlareAlpha: Opt<number>
  /** Radius of the white-hot core dot (px) */
  neonCoreRadius: Opt<number>
  /** Radius of the colour dot inside the core (px) */
  neonColorDotRadius: Opt<number>

  // ── stepped ───────────────────────────────────────────────────────────────
  /** Alpha of the stepped fill gradient at the top (0..1) */
  steppedFillAlphaTop: Opt<number>

  // ── bar ───────────────────────────────────────────────────────────────────
  /** Gap between bars as a fraction of slot width (0..1) */
  barGapRatio: Opt<number>
  /** Alpha of non-latest bars (0..1) */
  barAlphaNormal: Opt<number>
  /** Alpha of the latest (rightmost) bar (0..1) */
  barAlphaLatest: Opt<number>
  /** Alpha of the bar base / gradient bottom (0..1) */
  barBaseAlpha: Opt<number>

  // ── segment-bar ───────────────────────────────────────────────────────────
  /** Number of stacked segments per column */
  segCount: Opt<number>
  /** Gap between segments within a column (px) */
  segGap: Opt<number>
  /** Gap between columns (px) */
  segColGap: Opt<number>
  /** Corner radius of each segment rectangle (px) */
  segRadius: Opt<number>
  /** Alpha of filled segments (0..1) */
  segFillAlpha: Opt<number>
  /** Alpha of empty (background) segments (0..1) */
  segEmptyAlpha: Opt<number>

  // ── wave ──────────────────────────────────────────────────────────────────
  /** Alpha of the wave fill gradient at the top (0..1) */
  waveFillAlphaTop: Opt<number>
  /** Alpha of the wave fill gradient at the mid-stop (0..1) */
  waveFillAlphaMid: Opt<number>
  /** Gradient mid-stop position (0..1) */
  waveFillMidStop: Opt<number>
  /** Base upward offset of the shimmer line from the data line (px) */
  waveShimmerBaseOff: Opt<number>
  /** Extra shimmer offset added at pulse peak (px) */
  waveShimmerDelta: Opt<number>
  /** Alpha of the shimmer stroke (0..1) */
  waveShimmerAlpha: Opt<number>
  /** Width multiplier for the shimmer stroke */
  waveShimmerWidthMul: Opt<number>
}

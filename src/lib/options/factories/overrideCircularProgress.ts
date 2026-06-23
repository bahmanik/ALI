import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import type { ColorWithAlpha } from "src/configuration/types"
import type {
    CircularProgressOptions,
    CircularProgressVariant,
} from "src/widget/shared/circularProgress/type"

// ─────────────────────────────────────────────────────────────────────────────
// Params
// ─────────────────────────────────────────────────────────────────────────────

export interface OverrideCircularProgressParams {
    // ── variant ──────────────────────────────────────────────────────────────
    defaultVariant?: CircularProgressVariant

    // ── universal ─────────────────────────────────────────────────────────────
    defaultSize?: number
    defaultThickness?: number
    defaultColor?: ColorWithAlpha
    defaultShowText?: boolean
    defaultTextFontSize?: number
    defaultTextAlpha?: number
    defaultTrackAlpha?: number

    // ── shared animated ───────────────────────────────────────────────────────
    defaultSmoothing?: number
    defaultPulseRadiusDelta?: number
    defaultPulseSpeed?: number

    // ── simple ────────────────────────────────────────────────────────────────
    defaultSpringStiffness?: number
    defaultSpringDamping?: number

    // ── glow ──────────────────────────────────────────────────────────────────
    defaultGlowFillAlpha?: number
    defaultGlowTipAlpha?: number

    // ── neon ──────────────────────────────────────────────────────────────────
    defaultOuterWidthMul?: number
    defaultOuterAlpha?: number
    defaultMidWidthMul?: number
    defaultMidAlpha?: number
    defaultFlareRadiusDelta?: number
    defaultFlareAlpha?: number
    defaultCoreRadius?: number
    defaultColorDotRadius?: number

    // ── segmented ─────────────────────────────────────────────────────────────
    defaultSegmentCount?: number
    defaultSegmentGapRad?: number
    defaultSegmentFillAlpha?: number
    defaultSegmentEmptyAlpha?: number

    // ── dual ──────────────────────────────────────────────────────────────────
    defaultInnerRingRatio?: number
    defaultInnerRingAlpha?: number

    // ── fill ──────────────────────────────────────────────────────────────────
    defaultFillAlphaEdge?: number
    defaultFillAlphaCenter?: number

    // ── wave ──────────────────────────────────────────────────────────────────
    defaultShimmerAlpha?: number
    defaultShimmerWidthMul?: number
    defaultShimmerOffset?: number

    // ── system ────────────────────────────────────────────────────────────────
    exports?: OptExports
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produces a fully-wired `CircularProgressOptions` object.
 *
 * Every visual knob is an `Opt<T>` so it is reactive and appears in the
 * options registry. All fields are always present regardless of variant —
 * unused ones are simply ignored by the active variant's draw function.
 *
 * ```ts
 * const cpu: CpuOptions = {
 *   enable: opt(true),
 *   ...overrideCircularProgress({ defaultVariant: "glow", defaultColor: { color: "#1b93fd", alpha: 1 } }),
 * }
 * ```
 */
export function overrideCircularProgress(
    params: OverrideCircularProgressParams = {},
): CircularProgressOptions {
    const {
        defaultVariant = "simple",
        defaultSize = 50,
        defaultThickness = 4,
        defaultColor = { color: "#1b93fd", alpha: 1 } satisfies ColorWithAlpha,
        defaultShowText = true,
        defaultTextFontSize = 18,
        defaultTextAlpha = 0.9,
        defaultTrackAlpha = 0.15,
        defaultSmoothing = 0.15,
        defaultPulseRadiusDelta = 5,
        defaultPulseSpeed = 0.04,
        defaultSpringStiffness = 0.05,
        defaultSpringDamping = 0.7,
        defaultGlowFillAlpha = 0.12,
        defaultGlowTipAlpha = 0.5,
        defaultOuterWidthMul = 6,
        defaultOuterAlpha = 0.08,
        defaultMidWidthMul = 3,
        defaultMidAlpha = 0.18,
        defaultFlareRadiusDelta = 10,
        defaultFlareAlpha = 0.25,
        defaultCoreRadius = 4,
        defaultColorDotRadius = 2.5,
        defaultSegmentCount = 32,
        defaultSegmentGapRad = 0.04,
        defaultSegmentFillAlpha = 0.9,
        defaultSegmentEmptyAlpha = 0.1,
        defaultInnerRingRatio = 0.65,
        defaultInnerRingAlpha = 0.35,
        defaultFillAlphaEdge = 0.5,
        defaultFillAlphaCenter = 0.08,
        defaultShimmerAlpha = 0.18,
        defaultShimmerWidthMul = 0.8,
        defaultShimmerOffset = 4,
        exports = {},
    } = params

    const e = { ...exports }

    return {
        type: opt<CircularProgressVariant>(defaultVariant, e),
        size: opt<number>(defaultSize, e),
        thickness: opt<number>(defaultThickness, e),
        color: opt<ColorWithAlpha>(defaultColor, e),
        showText: opt<boolean>(defaultShowText, e),
        textFontSize: opt<number>(defaultTextFontSize, e),
        textAlpha: opt<number>(defaultTextAlpha, e),
        trackAlpha: opt<number>(defaultTrackAlpha, e),
        smoothing: opt<number>(defaultSmoothing, e),
        pulseRadiusDelta: opt<number>(defaultPulseRadiusDelta, e),
        pulseSpeed: opt<number>(defaultPulseSpeed, e),
        springStiffness: opt<number>(defaultSpringStiffness, e),
        springDamping: opt<number>(defaultSpringDamping, e),
        glowFillAlpha: opt<number>(defaultGlowFillAlpha, e),
        glowTipAlpha: opt<number>(defaultGlowTipAlpha, e),
        outerWidthMul: opt<number>(defaultOuterWidthMul, e),
        outerAlpha: opt<number>(defaultOuterAlpha, e),
        midWidthMul: opt<number>(defaultMidWidthMul, e),
        midAlpha: opt<number>(defaultMidAlpha, e),
        flareRadiusDelta: opt<number>(defaultFlareRadiusDelta, e),
        flareAlpha: opt<number>(defaultFlareAlpha, e),
        coreRadius: opt<number>(defaultCoreRadius, e),
        colorDotRadius: opt<number>(defaultColorDotRadius, e),
        segmentCount: opt<number>(defaultSegmentCount, e),
        segmentGapRad: opt<number>(defaultSegmentGapRad, e),
        segmentFillAlpha: opt<number>(defaultSegmentFillAlpha, e),
        segmentEmptyAlpha: opt<number>(defaultSegmentEmptyAlpha, e),
        innerRingRatio: opt<number>(defaultInnerRingRatio, e),
        innerRingAlpha: opt<number>(defaultInnerRingAlpha, e),
        fillAlphaEdge: opt<number>(defaultFillAlphaEdge, e),
        fillAlphaCenter: opt<number>(defaultFillAlphaCenter, e),
        shimmerAlpha: opt<number>(defaultShimmerAlpha, e),
        shimmerWidthMul: opt<number>(defaultShimmerWidthMul, e),
        shimmerOffset: opt<number>(defaultShimmerOffset, e),
    }
}

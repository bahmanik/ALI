import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import type { LineGraphOptions, LineGraphVariant, LineGraphRGBA } from "src/widget/shared/lineGraph/type"

// ─────────────────────────────────────────────────────────────────────────────
// Params
// ─────────────────────────────────────────────────────────────────────────────

export interface OverrideLineGraphParams {
    // ── universal ─────────────────────────────────────────────────────────────
    defaultVariant?: LineGraphVariant
    defaultWidth?: number
    defaultHeight?: number
    defaultThickness?: number
    defaultColor?: LineGraphRGBA

    // ── shared animated ───────────────────────────────────────────────────────
    defaultSmoothing?: number
    defaultPulseRadiusDelta?: number
    defaultPulseSpeed?: number

    // ── glow ──────────────────────────────────────────────────────────────────
    defaultGlowFillAlphaTop?: number
    defaultGlowFillAlphaMid?: number
    defaultGlowFillMidStop?: number

    // ── neon ──────────────────────────────────────────────────────────────────
    defaultNeonOuterWidthMul?: number
    defaultNeonOuterAlpha?: number
    defaultNeonMidWidthMul?: number
    defaultNeonMidAlpha?: number
    defaultNeonFlareDelta?: number
    defaultNeonFlareAlpha?: number
    defaultNeonCoreRadius?: number
    defaultNeonColorDotRadius?: number

    // ── stepped ───────────────────────────────────────────────────────────────
    defaultSteppedFillAlphaTop?: number

    // ── bar ───────────────────────────────────────────────────────────────────
    defaultBarGapRatio?: number
    defaultBarAlphaNormal?: number
    defaultBarAlphaLatest?: number
    defaultBarBaseAlpha?: number

    // ── segment-bar ───────────────────────────────────────────────────────────
    defaultSegCount?: number
    defaultSegGap?: number
    defaultSegColGap?: number
    defaultSegRadius?: number
    defaultSegFillAlpha?: number
    defaultSegEmptyAlpha?: number

    // ── wave ──────────────────────────────────────────────────────────────────
    defaultWaveFillAlphaTop?: number
    defaultWaveFillAlphaMid?: number
    defaultWaveFillMidStop?: number
    defaultWaveShimmerBaseOff?: number
    defaultWaveShimmerDelta?: number
    defaultWaveShimmerAlpha?: number
    defaultWaveShimmerWidthMul?: number

    // ── system ────────────────────────────────────────────────────────────────
    exports?: OptExports
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produces a fully-wired `LineGraphOptions` object.
 *
 * Spread into any module config object that needs a line graph:
 * ```ts
 * const cpu: CpuOptions = {
 *   enable: opt(true),
 *   ...overrideCircularProgress({ ... }),
 *   ...overrideLineGraph({ defaultVariant: "wave", defaultColor: [0.2, 0.85, 0.5, 1] }),
 * }
 * ```
 */
export function overrideLineGraph(
    params: OverrideLineGraphParams = {},
): LineGraphOptions {
    const {
        defaultVariant = "simple",
        defaultWidth = 200,
        defaultHeight = 60,
        defaultThickness = 2,
        defaultColor = [0.2, 0.7, 1, 1] as LineGraphRGBA,
        defaultSmoothing = 0.15,
        defaultPulseRadiusDelta = 5,
        defaultPulseSpeed = 0.04,
        defaultGlowFillAlphaTop = 0.35,
        defaultGlowFillAlphaMid = 0.08,
        defaultGlowFillMidStop = 0.6,
        defaultNeonOuterWidthMul = 6,
        defaultNeonOuterAlpha = 0.08,
        defaultNeonMidWidthMul = 3,
        defaultNeonMidAlpha = 0.18,
        defaultNeonFlareDelta = 10,
        defaultNeonFlareAlpha = 0.25,
        defaultNeonCoreRadius = 4,
        defaultNeonColorDotRadius = 2.5,
        defaultSteppedFillAlphaTop = 0.25,
        defaultBarGapRatio = 0.15,
        defaultBarAlphaNormal = 0.7,
        defaultBarAlphaLatest = 0.9,
        defaultBarBaseAlpha = 0.2,
        defaultSegCount = 12,
        defaultSegGap = 2,
        defaultSegColGap = 3,
        defaultSegRadius = 2,
        defaultSegFillAlpha = 0.85,
        defaultSegEmptyAlpha = 0.08,
        defaultWaveFillAlphaTop = 0.55,
        defaultWaveFillAlphaMid = 0.20,
        defaultWaveFillMidStop = 0.45,
        defaultWaveShimmerBaseOff = 3,
        defaultWaveShimmerDelta = 4,
        defaultWaveShimmerAlpha = 0.18,
        defaultWaveShimmerWidthMul = 0.8,
        exports = {},
    } = params

    const e = { ...exports }

    return {
        type: opt<LineGraphVariant>(defaultVariant, e),
        width: opt<number>(defaultWidth, e),
        height: opt<number>(defaultHeight, e),
        thickness: opt<number>(defaultThickness, e),
        color: opt<LineGraphRGBA>(defaultColor, e),

        smoothing: opt<number>(defaultSmoothing, e),
        pulseRadiusDelta: opt<number>(defaultPulseRadiusDelta, e),
        pulseSpeed: opt<number>(defaultPulseSpeed, e),

        glowFillAlphaTop: opt<number>(defaultGlowFillAlphaTop, e),
        glowFillAlphaMid: opt<number>(defaultGlowFillAlphaMid, e),
        glowFillMidStop: opt<number>(defaultGlowFillMidStop, e),

        neonOuterWidthMul: opt<number>(defaultNeonOuterWidthMul, e),
        neonOuterAlpha: opt<number>(defaultNeonOuterAlpha, e),
        neonMidWidthMul: opt<number>(defaultNeonMidWidthMul, e),
        neonMidAlpha: opt<number>(defaultNeonMidAlpha, e),
        neonFlareDelta: opt<number>(defaultNeonFlareDelta, e),
        neonFlareAlpha: opt<number>(defaultNeonFlareAlpha, e),
        neonCoreRadius: opt<number>(defaultNeonCoreRadius, e),
        neonColorDotRadius: opt<number>(defaultNeonColorDotRadius, e),

        steppedFillAlphaTop: opt<number>(defaultSteppedFillAlphaTop, e),

        barGapRatio: opt<number>(defaultBarGapRatio, e),
        barAlphaNormal: opt<number>(defaultBarAlphaNormal, e),
        barAlphaLatest: opt<number>(defaultBarAlphaLatest, e),
        barBaseAlpha: opt<number>(defaultBarBaseAlpha, e),

        segCount: opt<number>(defaultSegCount, e),
        segGap: opt<number>(defaultSegGap, e),
        segColGap: opt<number>(defaultSegColGap, e),
        segRadius: opt<number>(defaultSegRadius, e),
        segFillAlpha: opt<number>(defaultSegFillAlpha, e),
        segEmptyAlpha: opt<number>(defaultSegEmptyAlpha, e),

        waveFillAlphaTop: opt<number>(defaultWaveFillAlphaTop, e),
        waveFillAlphaMid: opt<number>(defaultWaveFillAlphaMid, e),
        waveFillMidStop: opt<number>(defaultWaveFillMidStop, e),
        waveShimmerBaseOff: opt<number>(defaultWaveShimmerBaseOff, e),
        waveShimmerDelta: opt<number>(defaultWaveShimmerDelta, e),
        waveShimmerAlpha: opt<number>(defaultWaveShimmerAlpha, e),
        waveShimmerWidthMul: opt<number>(defaultWaveShimmerWidthMul, e),
    }
}

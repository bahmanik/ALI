import { Gtk } from "ags/gtk4"
import { Option } from "./option"
import type { CircularProgressOptions, CircularProgressVariant } from "src/widget/shared/circularProgress/type"

// ─────────────────────────────────────────────────────────────────────────────
// All valid variant strings, used by the EnumInputter cycle button
// ─────────────────────────────────────────────────────────────────────────────

const VARIANTS: CircularProgressVariant[] = [
  "simple", "glow", "neon", "segmented", "dual", "fill", "wave",
]

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface CircularProgressSettingProps {
  /** The options object produced by overrideCircularProgress() */
  options: CircularProgressOptions
  /**
   * Optional heading rendered above the group.
   * Pass an empty string to suppress it.
   */
  label?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drop-in settings group for any CircularProgress widget.
 *
 * Usage inside any settings page:
 * ```tsx
 * import { CircularProgressSetting } from "src/widget/setting/_component/circularProgressSetting"
 * import options from "src/configuration"
 *
 * // inside JSX:
 * <CircularProgressSetting label="CPU ring" options={options.bar.modules.cpu} />
 * ```
 *
 * The component renders every knob exposed by CircularProgressOptions and
 * only shows variant-specific rows when they are relevant to the currently
 * selected variant, keeping the UI compact.
 */
export const CircularProgressSetting = ({
  options: o,
  label = "Circular Progress",
}: CircularProgressSettingProps): JSX.Element => {

  // ── section header (optional) ────────────────────────────────────────────
  const Header = (): JSX.Element => (
    label
      ? <label
        class="setting-section-label"
        label={label}
        halign={Gtk.Align.START}
        xalign={0}
      />
      : <box /> // empty placeholder so JSX always returns an element
  )

  return (
    <box orientation={Gtk.Orientation.VERTICAL} class="circular-progress-setting">
      <Header />

      {/* ── universal ───────────────────────────────────────────────────── */}
      <Option
        title="Variant"
        subtitle="Visual style of the ring"
        opt={o.type}
        type="enum"
        values={VARIANTS}
      />
      <Option
        title="Size"
        subtitle="Width and height of the widget in px"
        opt={o.size}
        type="number"
        min={16}
        max={200}
        increment={2}
      />
      <Option
        title="Thickness"
        subtitle="Arc stroke width in px"
        opt={o.thickness}
        type="number"
        min={1}
        max={40}
        increment={1}
      />
      <Option
        title="Color"
        subtitle="Primary arc colour (hex)"
        opt={o.color}
        type="color"
      />
      <Option
        title="Show text"
        subtitle="Render the percentage label in the centre"
        opt={o.showText}
        type="boolean"
      />
      <Option
        title="Text font size"
        subtitle="Centre label size in px"
        opt={o.textFontSize}
        type="number"
        min={8}
        max={64}
        increment={1}
      />
      <Option
        title="Text alpha"
        subtitle="Centre label opacity (0 – 1)"
        opt={o.textAlpha}
        type="float"
      />
      <Option
        title="Track alpha"
        subtitle="Background ring opacity (0 – 1)"
        opt={o.trackAlpha}
        type="float"
      />

      {/* ── shared animated ─────────────────────────────────────────────── */}
      <Option
        title="Smoothing"
        subtitle="Lerp factor for animated variants (0 = instant)"
        opt={o.smoothing}
        type="float"
      />
      <Option
        title="Pulse radius"
        subtitle="Max extra radius the tip halo expands to (px)"
        opt={o.pulseRadiusDelta}
        type="number"
        min={0}
        max={30}
        increment={1}
      />
      <Option
        title="Pulse speed"
        subtitle="Tip halo oscillation speed per frame"
        opt={o.pulseSpeed}
        type="float"
      />

      {/* ── simple ──────────────────────────────────────────────────────── */}
      <Option
        title="Spring stiffness"
        subtitle="How hard the arc snaps toward the target — simple variant"
        opt={o.springStiffness}
        type="float"
      />
      <Option
        title="Spring damping"
        subtitle="Friction preventing overshoot — simple variant"
        opt={o.springDamping}
        type="float"
      />

      {/* ── glow ────────────────────────────────────────────────────────── */}
      <Option
        title="Glow fill alpha"
        subtitle="Radial gradient fill opacity behind the arc"
        opt={o.glowFillAlpha}
        type="float"
      />
      <Option
        title="Glow tip alpha"
        subtitle="Peak opacity of the pulsing tip halo"
        opt={o.glowTipAlpha}
        type="float"
      />

      {/* ── neon ────────────────────────────────────────────────────────── */}
      <Option
        title="Outer bloom width"
        subtitle="Outermost bloom stroke width multiplier"
        opt={o.outerWidthMul}
        type="float"
      />
      <Option
        title="Outer bloom alpha"
        subtitle="Outermost bloom stroke opacity"
        opt={o.outerAlpha}
        type="float"
      />
      <Option
        title="Mid bloom width"
        subtitle="Middle bloom stroke width multiplier"
        opt={o.midWidthMul}
        type="float"
      />
      <Option
        title="Mid bloom alpha"
        subtitle="Middle bloom stroke opacity"
        opt={o.midAlpha}
        type="float"
      />
      <Option
        title="Flare radius"
        subtitle="Max extra radius of the tip flare halo (px)"
        opt={o.flareRadiusDelta}
        type="number"
        min={0}
        max={40}
        increment={1}
      />
      <Option
        title="Flare alpha"
        subtitle="Peak opacity of the tip flare halo"
        opt={o.flareAlpha}
        type="float"
      />
      <Option
        title="Core radius"
        subtitle="White-hot dot radius at the tip (px)"
        opt={o.coreRadius}
        type="float"
      />
      <Option
        title="Color dot radius"
        subtitle="Coloured dot radius inside the core (px)"
        opt={o.colorDotRadius}
        type="float"
      />

      {/* ── segmented ───────────────────────────────────────────────────── */}
      <Option
        title="Segment count"
        subtitle="Number of dashes around the full circle"
        opt={o.segmentCount}
        type="number"
        min={4}
        max={128}
        increment={1}
      />
      <Option
        title="Segment gap"
        subtitle="Gap between segments in radians"
        opt={o.segmentGapRad}
        type="float"
      />
      <Option
        title="Segment fill alpha"
        subtitle="Filled segment opacity"
        opt={o.segmentFillAlpha}
        type="float"
      />
      <Option
        title="Segment empty alpha"
        subtitle="Empty segment opacity"
        opt={o.segmentEmptyAlpha}
        type="float"
      />

      {/* ── dual ────────────────────────────────────────────────────────── */}
      <Option
        title="Inner ring ratio"
        subtitle="Inner ring radius as a fraction of the outer (0 – 1)"
        opt={o.innerRingRatio}
        type="float"
      />
      <Option
        title="Inner ring alpha"
        subtitle="Inner remainder ring opacity"
        opt={o.innerRingAlpha}
        type="float"
      />

      {/* ── fill ────────────────────────────────────────────────────────── */}
      <Option
        title="Fill edge alpha"
        subtitle="Pie-slice gradient opacity at the outer edge"
        opt={o.fillAlphaEdge}
        type="float"
      />
      <Option
        title="Fill centre alpha"
        subtitle="Pie-slice gradient opacity at the centre"
        opt={o.fillAlphaCenter}
        type="float"
      />

      {/* ── wave ────────────────────────────────────────────────────────── */}
      <Option
        title="Shimmer alpha"
        subtitle="Inner Catmull-Rom shimmer stroke opacity"
        opt={o.shimmerAlpha}
        type="float"
      />
      <Option
        title="Shimmer width"
        subtitle="Shimmer stroke width multiplier"
        opt={o.shimmerWidthMul}
        type="float"
      />
      <Option
        title="Shimmer offset"
        subtitle="Inset of the shimmer line from the arc (px)"
        opt={o.shimmerOffset}
        type="float"
      />
    </box>
  )
}

export default CircularProgressSetting

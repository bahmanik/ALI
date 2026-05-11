import { Gtk } from "ags/gtk4"
import { Option } from "./option"
import type { LineGraphOptions, LineGraphVariant } from "src/widget/shared/lineGraph/type"

const VARIANTS: LineGraphVariant[] = [
  "simple", "glow", "neon", "stepped", "bar", "segment-bar", "wave",
]

interface LineGraphSettingProps {
  options: LineGraphOptions
  label?: string
}

/**
 * Drop-in settings group for any LineGraph widget.
 *
 * ```tsx
 * <LineGraphSetting label="CPU graph" options={options.bar.modules.cpu} />
 * ```
 */
export const LineGraphSetting = ({
  options: o,
  label = "Line Graph",
}: LineGraphSettingProps): JSX.Element => {

  const Header = (): JSX.Element => (
    label
      ? <label class="setting-section-label" label={label} halign={Gtk.Align.START} xalign={0} />
      : <box />
  )

  return (
    <box orientation={Gtk.Orientation.VERTICAL} class="line-graph-setting">
      <Header />

      {/* ── universal ───────────────────────────────────────────────────── */}
      <Option title="Variant" subtitle="Visual style of the graph" opt={o.type} type="enum" values={VARIANTS} />
      <Option title="Width" subtitle="Canvas width in px" opt={o.width} type="number" min={40} max={800} increment={4} />
      <Option title="Height" subtitle="Canvas height in px" opt={o.height} type="number" min={16} max={400} increment={2} />
      <Option title="Thickness" subtitle="Line stroke thickness in px" opt={o.thickness} type="number" min={1} max={16} increment={1} />
      <Option title="Color" subtitle="Primary line colour (hex)" opt={o.color as any} type="color" />

      {/* ── shared animated ─────────────────────────────────────────────── */}
      <Option title="Smoothing" subtitle="Lerp factor (0 = instant snap)" opt={o.smoothing} type="float" />
      <Option title="Pulse radius" subtitle="Max tip halo expansion (px)" opt={o.pulseRadiusDelta} type="number" min={0} max={30} increment={1} />
      <Option title="Pulse speed" subtitle="Tip halo oscillation speed per frame" opt={o.pulseSpeed} type="float" />

      {/* ── glow ────────────────────────────────────────────────────────── */}
      <Option title="Glow fill top" subtitle="Fill gradient alpha at the top" opt={o.glowFillAlphaTop} type="float" />
      <Option title="Glow fill mid" subtitle="Fill gradient alpha at the mid-stop" opt={o.glowFillAlphaMid} type="float" />
      <Option title="Glow fill stop" subtitle="Mid-stop position (0 – 1)" opt={o.glowFillMidStop} type="float" />

      {/* ── neon ────────────────────────────────────────────────────────── */}
      <Option title="Neon outer width" subtitle="Outer bloom stroke width multiplier" opt={o.neonOuterWidthMul} type="float" />
      <Option title="Neon outer alpha" subtitle="Outer bloom stroke opacity" opt={o.neonOuterAlpha} type="float" />
      <Option title="Neon mid width" subtitle="Mid bloom stroke width multiplier" opt={o.neonMidWidthMul} type="float" />
      <Option title="Neon mid alpha" subtitle="Mid bloom stroke opacity" opt={o.neonMidAlpha} type="float" />
      <Option title="Neon flare delta" subtitle="Max tip flare radius (px)" opt={o.neonFlareDelta} type="number" min={0} max={40} increment={1} />
      <Option title="Neon flare alpha" subtitle="Peak tip flare opacity" opt={o.neonFlareAlpha} type="float" />
      <Option title="Neon core radius" subtitle="White-hot core dot radius (px)" opt={o.neonCoreRadius} type="float" />
      <Option title="Neon dot radius" subtitle="Colour dot radius inside core (px)" opt={o.neonColorDotRadius} type="float" />

      {/* ── stepped ─────────────────────────────────────────────────────── */}
      <Option title="Stepped fill alpha" subtitle="Fill gradient alpha at the top" opt={o.steppedFillAlphaTop} type="float" />

      {/* ── bar ─────────────────────────────────────────────────────────── */}
      <Option title="Bar gap ratio" subtitle="Gap between bars (fraction of slot)" opt={o.barGapRatio} type="float" />
      <Option title="Bar alpha normal" subtitle="Non-latest bar opacity" opt={o.barAlphaNormal} type="float" />
      <Option title="Bar alpha latest" subtitle="Latest bar opacity" opt={o.barAlphaLatest} type="float" />
      <Option title="Bar base alpha" subtitle="Gradient bottom opacity" opt={o.barBaseAlpha} type="float" />

      {/* ── segment-bar ─────────────────────────────────────────────────── */}
      <Option title="Seg count" subtitle="Stacked segments per column" opt={o.segCount} type="number" min={2} max={32} increment={1} />
      <Option title="Seg gap" subtitle="Gap between segments (px)" opt={o.segGap} type="number" min={0} max={10} increment={1} />
      <Option title="Seg column gap" subtitle="Gap between columns (px)" opt={o.segColGap} type="number" min={0} max={10} increment={1} />
      <Option title="Seg radius" subtitle="Segment corner radius (px)" opt={o.segRadius} type="number" min={0} max={10} increment={1} />
      <Option title="Seg fill alpha" subtitle="Filled segment opacity" opt={o.segFillAlpha} type="float" />
      <Option title="Seg empty alpha" subtitle="Empty segment opacity" opt={o.segEmptyAlpha} type="float" />

      {/* ── wave ────────────────────────────────────────────────────────── */}
      <Option title="Wave fill top" subtitle="Fill gradient alpha at the top" opt={o.waveFillAlphaTop} type="float" />
      <Option title="Wave fill mid" subtitle="Fill gradient alpha at the mid-stop" opt={o.waveFillAlphaMid} type="float" />
      <Option title="Wave fill stop" subtitle="Mid-stop position (0 – 1)" opt={o.waveFillMidStop} type="float" />
      <Option title="Shimmer base offset" subtitle="Shimmer line inset above data line (px)" opt={o.waveShimmerBaseOff} type="number" min={0} max={20} increment={1} />
      <Option title="Shimmer delta" subtitle="Extra shimmer offset at pulse peak (px)" opt={o.waveShimmerDelta} type="number" min={0} max={20} increment={1} />
      <Option title="Shimmer alpha" subtitle="Shimmer stroke opacity" opt={o.waveShimmerAlpha} type="float" />
      <Option title="Shimmer width" subtitle="Shimmer stroke width multiplier" opt={o.waveShimmerWidthMul} type="float" />
    </box>
  )
}

export default LineGraphSetting

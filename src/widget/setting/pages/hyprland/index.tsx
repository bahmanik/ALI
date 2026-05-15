import { Gtk } from "ags/gtk4"
import options from "src/configuration"
import { Header } from "../../_component/header"
import { Option } from "../../_component/option"

type HyprlandProps = JSX.IntrinsicElements["box"]

// ─── Gated row ────────────────────────────────────────────────────────────────
//
// Every Hyprland setting has two opts: the value and a sibling `_enable` toggle.
// This helper renders them on the same row so the UI stays compact:
//   [toggle]  [title / subtitle]  [inputter]

interface GatedRowProps {
  title: string
  subtitle?: string
  enableOpt: ReturnType<typeof options.hyprland.general.gaps_in_enable.as> extends never
  ? never : any
  children: JSX.Element   // the Option inputter for the value
}

function GatedOption({
  title,
  subtitle,
  enableOpt,
  valueOpt,
  type,
  min,
  max,
  increment,
  values,
}: {
  title: string
  subtitle?: string
  enableOpt: any
  valueOpt: any
  type: string
  min?: number
  max?: number
  increment?: number
  values?: readonly string[]
}): JSX.Element {
  return (
    <box class="hypr-gated-row" spacing={4} hexpand>
      {/* enable toggle — controls whether this line appears in the overlay */}
      <Gtk.CheckButton
        active={enableOpt.as((v: boolean) => v)}
        $={(self: any) => {
          self.connect("notify::active", () => enableOpt.set(self.active))
        }}
        tooltipText="Write this setting to the Hyprland overlay config"
        valign={Gtk.Align.CENTER}
      />
      <Option
        title={title}
        subtitle={subtitle}
        opt={valueOpt}
        type={type as any}
        min={min}
        max={max}
        increment={increment}
        values={values as any}
      />
    </box>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Hyprland = (props: HyprlandProps) => {
  const { enable, general, decoration, blur, animations, input, misc } = options.hyprland

  return (
    <box orientation={Gtk.Orientation.VERTICAL} class="hyprland-settings-page" {...props}>

      {/* ── Integration ────────────────────────────────────────────────── */}
      <Header title="Integration" />
      <Option
        title="Enable Hyprland integration"
        subtitle="Write an overlay config and source it from hyprland.conf"
        opt={enable}
        type="boolean"
      />

      {/* ── General ────────────────────────────────────────────────────── */}
      <Header title="General" />
      <GatedOption title="Gaps in" subtitle="Inner gap between windows (px)" enableOpt={general.gaps_in_enable} valueOpt={general.gaps_in} type="number" min={0} max={64} increment={1} />
      <GatedOption title="Gaps out" subtitle="Outer gap between windows and monitor (px)" enableOpt={general.gaps_out_enable} valueOpt={general.gaps_out} type="number" min={0} max={64} increment={1} />
      <GatedOption title="Border size" subtitle="Border thickness in px" enableOpt={general.border_size_enable} valueOpt={general.border_size} type="number" min={0} max={16} increment={1} />
      <GatedOption title="No focus fallback" subtitle="Prevent cursor from changing focus" enableOpt={general.no_focus_fallback_enable} valueOpt={general.no_focus_fallback} type="boolean" />

      {/* ── Decoration ─────────────────────────────────────────────────── */}
      <Header title="Decoration" />
      <GatedOption title="Rounding" subtitle="Corner radius in px" enableOpt={decoration.rounding_enable} valueOpt={decoration.rounding} type="number" min={0} max={32} increment={1} />
      <GatedOption title="Active opacity" subtitle="Opacity of focused windows (0–1)" enableOpt={decoration.active_opacity_enable} valueOpt={decoration.active_opacity} type="float" />
      <GatedOption title="Inactive opacity" subtitle="Opacity of unfocused windows (0–1)" enableOpt={decoration.inactive_opacity_enable} valueOpt={decoration.inactive_opacity} type="float" />
      <GatedOption title="Fullscreen opacity" subtitle="Opacity of fullscreen windows (0–1)" enableOpt={decoration.fullscreen_opacity_enable} valueOpt={decoration.fullscreen_opacity} type="float" />
      <GatedOption title="Drop shadow" subtitle="Enable window drop shadows" enableOpt={decoration.drop_shadow_enable} valueOpt={decoration.drop_shadow} type="boolean" />
      <GatedOption title="Shadow range" subtitle="Shadow reach in px" enableOpt={decoration.shadow_range_enable} valueOpt={decoration.shadow_range} type="number" min={0} max={80} increment={1} />
      <GatedOption title="Shadow render power" subtitle="Shadow falloff sharpness (1–4)" enableOpt={decoration.shadow_render_power_enable} valueOpt={decoration.shadow_render_power} type="number" min={1} max={4} increment={1} />
      <GatedOption title="Dim inactive" subtitle="Dim unfocused windows" enableOpt={decoration.dim_inactive_enable} valueOpt={decoration.dim_inactive} type="boolean" />
      <GatedOption title="Dim strength" subtitle="Dimming amount (0–1)" enableOpt={decoration.dim_strength_enable} valueOpt={decoration.dim_strength} type="float" />

      {/* ── Blur ───────────────────────────────────────────────────────── */}
      <Header title="Blur" />
      <GatedOption title="Enable blur" subtitle="Enable background blur" enableOpt={blur.enabled_enable} valueOpt={blur.enabled} type="boolean" />
      <GatedOption title="Blur size" subtitle="Blur kernel size" enableOpt={blur.size_enable} valueOpt={blur.size} type="number" min={1} max={20} increment={1} />
      <GatedOption title="Passes" subtitle="Number of blur passes" enableOpt={blur.passes_enable} valueOpt={blur.passes} type="number" min={1} max={10} increment={1} />
      <GatedOption title="Vibrancy" subtitle="Vibrancy strength (0–1)" enableOpt={blur.vibrancy_enable} valueOpt={blur.vibrancy} type="float" />
      <GatedOption title="Vibrancy darkness" subtitle="Vibrancy darkness boost (0–1)" enableOpt={blur.vibrancy_darkness_enable} valueOpt={blur.vibrancy_darkness} type="float" />
      <GatedOption title="Noise" subtitle="Grain noise overlay (0–1)" enableOpt={blur.noise_enable} valueOpt={blur.noise} type="float" />
      <GatedOption title="New optimizations" subtitle="Use optimized blur algorithm" enableOpt={blur.new_optimizations_enable} valueOpt={blur.new_optimizations} type="boolean" />
      <GatedOption title="X-ray" subtitle="Blur through layers (xray mode)" enableOpt={blur.xray_enable} valueOpt={blur.xray} type="boolean" />

      {/* ── Animations ─────────────────────────────────────────────────── */}
      <Header title="Animations" />
      <GatedOption title="Enable animations" subtitle="Enable window animations" enableOpt={animations.enabled_enable} valueOpt={animations.enabled} type="boolean" />
      <GatedOption title="First launch animation" subtitle="Play animation on first launch" enableOpt={animations.first_launch_animation_enable} valueOpt={animations.first_launch_animation} type="boolean" />

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <Header title="Input" />
      <GatedOption title="Keyboard layout" subtitle="XKB layout string (e.g. 'us', 'gb')" enableOpt={input.kb_layout_enable} valueOpt={input.kb_layout} type="string" />
      <GatedOption title="Follow mouse" subtitle="0 = disabled, 1 = full, 2 = loose, 3 = explicit" enableOpt={input.follow_mouse_enable} valueOpt={input.follow_mouse} type="number" min={0} max={3} increment={1} />
      <GatedOption title="Sensitivity" subtitle="Mouse sensitivity (-1 to 1)" enableOpt={input.sensitivity_enable} valueOpt={input.sensitivity} type="float" />
      <GatedOption title="Repeat rate" subtitle="Key repeat rate (repeats/sec)" enableOpt={input.repeat_rate_enable} valueOpt={input.repeat_rate} type="number" min={1} max={100} increment={1} />
      <GatedOption title="Repeat delay" subtitle="Delay before key repeat starts (ms)" enableOpt={input.repeat_delay_enable} valueOpt={input.repeat_delay} type="number" min={100} max={2000} increment={50} />
      <GatedOption title="Numlock on boot" subtitle="Enable numlock by default" enableOpt={input.numlock_by_default_enable} valueOpt={input.numlock_by_default} type="boolean" />
      <GatedOption title="Natural scroll" subtitle="Reverse touchpad scroll direction" enableOpt={input.natural_scroll_enable} valueOpt={input.natural_scroll} type="boolean" />

      {/* ── Misc ───────────────────────────────────────────────────────── */}
      <Header title="Misc" />
      <GatedOption title="Font family" subtitle="UI font (e.g. 'sans-serif')" enableOpt={misc.font_family_enable} valueOpt={misc.font_family} type="string" />
      <GatedOption title="VRR" subtitle="Variable refresh rate (0=off, 1=on, 2=fullscreen)" enableOpt={misc.vrr_enable} valueOpt={misc.vrr} type="number" min={0} max={2} increment={1} />
      <GatedOption title="Disable Hyprland logo" subtitle="Hide startup logo" enableOpt={misc.disable_hyprland_logo_enable} valueOpt={misc.disable_hyprland_logo} type="boolean" />

    </box>
  )
}

export default Hyprland

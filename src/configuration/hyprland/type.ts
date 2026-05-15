import type { Opt } from "src/lib/options"

// ─── Hyprland configuration type ─────────────────────────────────────────────
//
// Every Opt here that has `exports: { hyprland: true }` is written to the
// overlay conf as:   <section> { <key> = <value> }
//
// The id path drives the section/key:
//   hyprland.general.gaps_in   →   general { gaps_in = … }
//   hyprland.decoration.rounding →  decoration { rounding = … }
//
// Sibling `_enable` opts gate each value — when false the line is omitted
// from the overlay without touching the user's actual hyprland.conf.

export interface HyprlandGeneralOptions {
    gaps_in: Opt<number>
    gaps_in_enable: Opt<boolean>
    gaps_out: Opt<number>
    gaps_out_enable: Opt<boolean>
    border_size: Opt<number>
    border_size_enable: Opt<boolean>
    no_focus_fallback: Opt<boolean>
    no_focus_fallback_enable: Opt<boolean>
}

export interface HyprlandDecorationOptions {
    rounding: Opt<number>
    rounding_enable: Opt<boolean>
    active_opacity: Opt<number>
    active_opacity_enable: Opt<boolean>
    inactive_opacity: Opt<number>
    inactive_opacity_enable: Opt<boolean>
    fullscreen_opacity: Opt<number>
    fullscreen_opacity_enable: Opt<boolean>
    drop_shadow: Opt<boolean>
    drop_shadow_enable: Opt<boolean>
    shadow_range: Opt<number>
    shadow_range_enable: Opt<boolean>
    shadow_render_power: Opt<number>
    shadow_render_power_enable: Opt<boolean>
    dim_inactive: Opt<boolean>
    dim_inactive_enable: Opt<boolean>
    dim_strength: Opt<number>
    dim_strength_enable: Opt<boolean>
}

export interface HyprlandDecorationBlurOptions {
    enabled: Opt<boolean>
    enabled_enable: Opt<boolean>
    size: Opt<number>
    size_enable: Opt<boolean>
    passes: Opt<number>
    passes_enable: Opt<boolean>
    vibrancy: Opt<number>
    vibrancy_enable: Opt<boolean>
    vibrancy_darkness: Opt<number>
    vibrancy_darkness_enable: Opt<boolean>
    noise: Opt<number>
    noise_enable: Opt<boolean>
    new_optimizations: Opt<boolean>
    new_optimizations_enable: Opt<boolean>
    xray: Opt<boolean>
    xray_enable: Opt<boolean>
}

export interface HyprlandAnimationsOptions {
    enabled: Opt<boolean>
    enabled_enable: Opt<boolean>
    first_launch_animation: Opt<boolean>
    first_launch_animation_enable: Opt<boolean>
}

export interface HyprlandInputOptions {
    kb_layout: Opt<string>
    kb_layout_enable: Opt<boolean>
    follow_mouse: Opt<number>
    follow_mouse_enable: Opt<boolean>
    sensitivity: Opt<number>
    sensitivity_enable: Opt<boolean>
    repeat_rate: Opt<number>
    repeat_rate_enable: Opt<boolean>
    repeat_delay: Opt<number>
    repeat_delay_enable: Opt<boolean>
    numlock_by_default: Opt<boolean>
    numlock_by_default_enable: Opt<boolean>
    natural_scroll: Opt<boolean>
    natural_scroll_enable: Opt<boolean>
}

export interface HyprlandMiscOptions {
    font_family: Opt<string>
    font_family_enable: Opt<boolean>
    vrr: Opt<number>
    vrr_enable: Opt<boolean>
    disable_hyprland_logo: Opt<boolean>
    disable_hyprland_logo_enable: Opt<boolean>
}

export interface HyprlandOptions {
    enable: Opt<boolean>
    general: HyprlandGeneralOptions
    decoration: HyprlandDecorationOptions
    blur: HyprlandDecorationBlurOptions
    animations: HyprlandAnimationsOptions
    input: HyprlandInputOptions
    misc: HyprlandMiscOptions
}

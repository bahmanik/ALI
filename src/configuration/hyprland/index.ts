import { opt } from "src/lib/options"
import type { HyprlandOptions } from "./type"

// Shorthand: marks a value opt for hyprland overlay export
const h = { hyprland: true } as const

const hyprland: HyprlandOptions = {
    // Master switch — when false the overlay file is written as a no-op comment
    enable: opt(true),

    // ── general ──────────────────────────────────────────────────────────────
    general: {
        gaps_in: opt(4, h),
        gaps_in_enable: opt(false),
        gaps_out: opt(8, h),
        gaps_out_enable: opt(false),
        border_size: opt(1, h),
        border_size_enable: opt(false),
        no_focus_fallback: opt(true, h),
        no_focus_fallback_enable: opt(false),
    },

    // ── decoration ───────────────────────────────────────────────────────────
    decoration: {
        rounding: opt(12, h),
        rounding_enable: opt(false),
        active_opacity: opt(1.0, h),
        active_opacity_enable: opt(false),
        inactive_opacity: opt(1.0, h),
        inactive_opacity_enable: opt(false),
        fullscreen_opacity: opt(1.0, h),
        fullscreen_opacity_enable: opt(false),
        drop_shadow: opt(true, h),
        drop_shadow_enable: opt(false),
        shadow_range: opt(16, h),
        shadow_range_enable: opt(false),
        shadow_render_power: opt(3, h),
        shadow_render_power_enable: opt(false),
        dim_inactive: opt(false, h),
        dim_inactive_enable: opt(false),
        dim_strength: opt(0.1, h),
        dim_strength_enable: opt(false),
    },

    // ── decoration:blur ──────────────────────────────────────────────────────
    // The HyprlandManager maps "hyprland.blur.*" → "blur { * }"
    // Hyprland internally treats blur as decoration:blur but accepts a
    // top-level "blur {}" block in modern versions via the overlay.
    blur: {
        enabled: opt(true, h),
        enabled_enable: opt(false),
        size: opt(6, h),
        size_enable: opt(false),
        passes: opt(2, h),
        passes_enable: opt(false),
        vibrancy: opt(0.17, h),
        vibrancy_enable: opt(false),
        vibrancy_darkness: opt(0.0, h),
        vibrancy_darkness_enable: opt(false),
        noise: opt(0.02, h),
        noise_enable: opt(false),
        new_optimizations: opt(true, h),
        new_optimizations_enable: opt(false),
        xray: opt(false, h),
        xray_enable: opt(false),
    },

    // ── animations ───────────────────────────────────────────────────────────
    animations: {
        enabled: opt(true, h),
        enabled_enable: opt(false),
        first_launch_animation: opt(false, h),
        first_launch_animation_enable: opt(false),
    },

    // ── input ─────────────────────────────────────────────────────────────────
    input: {
        kb_layout: opt("us", h),
        kb_layout_enable: opt(false),
        follow_mouse: opt(1, h),
        follow_mouse_enable: opt(false),
        sensitivity: opt(0.0, h),
        sensitivity_enable: opt(false),
        repeat_rate: opt(25, h),
        repeat_rate_enable: opt(false),
        repeat_delay: opt(600, h),
        repeat_delay_enable: opt(false),
        numlock_by_default: opt(false, h),
        numlock_by_default_enable: opt(false),
        natural_scroll: opt(false, h),
        natural_scroll_enable: opt(false),
    },

    // ── misc ──────────────────────────────────────────────────────────────────
    misc: {
        font_family: opt("sans-serif", h),
        font_family_enable: opt(false),
        vrr: opt(0, h),
        vrr_enable: opt(false),
        disable_hyprland_logo: opt(true, h),
        disable_hyprland_logo_enable: opt(false),
    },
}

export default hyprland

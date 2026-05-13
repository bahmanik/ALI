import type { Opt } from "src/lib/options"
import type {
    AnchorLayoutType,
    HexColor,
    ModuleMapArray,
    RevealTransitionWithAuto,
} from "src/configuration/types"

// ─────────────────────────────────────────────────────────────────────────────
// Color
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Universal color+opacity type.
 *
 * Replaces every `bg: HexColor` + `bgOpacity: number` pair and every freeform
 * `RgbaColor` string across the codebase.  `alpha` is always a 0–1 float.
 *
 * Convert to a CSS value with `colorWithAlphaToCss(c)` from
 * `src/lib/units/color`.
 */
export interface ColorWithAlpha {
    color: HexColor
    alpha: number    // 0–1
}

// ─────────────────────────────────────────────────────────────────────────────
// Border
// ─────────────────────────────────────────────────────────────────────────────

/**
 * border-location type.
 */
export const BorderLocationValues = [
    "none",
    "full",
    "top",
    "bottom",
    "left",
    "right",
    "horizontal",
    "vertical"
] as const

export type BorderLocationType = (typeof BorderLocationValues)[number]

export interface BorderOptions {
    borderEnable: Opt<boolean>
    borderLocation: Opt<BorderLocationType>
    borderWidth: Opt<number>
    borderColor: Opt<ColorWithAlpha>
}

// ─────────────────────────────────────────────────────────────────────────────
// Shadow
// ─────────────────────────────────────────────────────────────────────────────

export interface ShadowOptions {
    shadowEnable: Opt<boolean>
    shadowX: Opt<number>
    shadowY: Opt<number>
    shadowBlur: Opt<number>
    shadowSpread: Opt<number>
    shadowColor: Opt<ColorWithAlpha>
}

/**
 * Extended shadow that also reserves window space for the blur spread.
 * Used by bar and secondaryBar where a CSS `margin` must equal `shadowMargin`
 * so the shadow is not clipped by the monitor edge.
 */
export interface ShadowOptionsWithMargin extends ShadowOptions {
    shadowMargin: Opt<number>
}

// ─────────────────────────────────────────────────────────────────────────────
// Container style
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The base style block shared by every popup widget
 * (osd, calendar, launcher, countdown).
 *
 * Composes BorderOptions + ShadowOptions plus the three geometry fields
 * every container has in common.
 */
export interface ContainerStyleOptions extends BorderOptions, ShadowOptions {
    bg: Opt<ColorWithAlpha>
    radius: Opt<number>
    padding: Opt<number>
}

/**
 * Style block for bar and secondaryBar.
 *
 * Same composition as ContainerStyleOptions but padding is split into X/Y,
 * extra margin fields are added, and shadow uses the margin-aware variant.
 */
export interface BarStyleOptions extends BorderOptions, ShadowOptionsWithMargin {
    floating: Opt<boolean>
    transparent: Opt<boolean>
    bg: Opt<ColorWithAlpha>
    height: Opt<number>
    radius: Opt<number>
    paddingX: Opt<number>
    paddingY: Opt<number>
    marginTop: Opt<number>
    marginBottom: Opt<number>
    marginSides: Opt<number>
}

// ─────────────────────────────────────────────────────────────────────────────
// Popup window placement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Window placement sub-object shared by osd, calendar, launcher, countdown.
 *
 * `transitionDuration` is ALWAYS seconds (e.g. 0.18).
 * osd previously used `transitionDurationMs` storing an integer — that field
 * is renamed and normalised here.
 *
 * `width` and `height` are optional because osd keeps those on its style
 * block instead of on the window sub-object.
 */
export interface PopupWindowOptions {
    layout: Opt<AnchorLayoutType>
    revealTransition: Opt<RevealTransitionWithAuto>
    transitionDuration: Opt<number>
    margin: Opt<number>
    width?: Opt<number>
    height?: Opt<number>
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive surface  (button / item / entry)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared shape for styled interactive elements:
 *   bar.buttons, secondaryBar.buttons,
 *   launcher.entry, launcher.list items, launcher.favoritesUI
 *
 * `hoverOpacity` is 0–1.
 */
export interface InteractiveSurfaceOptions {
    bg: Opt<ColorWithAlpha>
    hoverOpacity: Opt<number>
    radius: Opt<number>
    paddingX: Opt<number>
    paddingY: Opt<number>
    spacing: Opt<number>
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid layout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exact duplicate between dashboard.grid and launcher.grid — extracted once.
 */
export interface GridLayoutOptions {
    rows: Opt<number>
    cols: Opt<number>
    modulesList: Opt<ModuleMapArray>
}

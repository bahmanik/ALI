import { BarModules } from "src/widget/bar/bar/modules";
import { DashboardModules } from "src/widget/dashboard/_component";


export type TransitionType =
    | "none"
    | "simple"
    | "fade"
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "wipe"
    | "wave"
    | "grow"
    | "center"
    | "any"
    | "outer"
    | "random";

export type TransitionPos =
    | "cursor"
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

export type BarLocation = "top" | "bottom" | "left" | "right";

export type {
    AssetTransformation,
    ImageTechnique,
    VisualAsset,
    ResolvedAsset,
} from "src/services/assets/types"

export type HexColor = `#${string}`;
export type RgbaColor = `rgba(${string})`
export type RGBA = [number, number, number, number]

export type CalendarBorderLocation = "none" | "full";

export type LauncherBorderLocation = "none" | "full";

export type BarBorderLocation =
    | "none"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "horizontal"
    | "vertical"
    | "full";

export type ThemeMode = "dark" | "light";

export type MatugenType =
    | "scheme-tonal-spot"
    | "scheme-neutral"
    | "scheme-vibrant"
    | "scheme-expressive"
    | "scheme-content"
    | "scheme-fidelity";

export type MatugenResizeFilter =
    | "nearest"
    | "triangle"
    | "catmull-rom"
    | "gaussian"
    | "lanczos3"
    | "none";

// -----------------------------------------------------------------------------
// Shared layout + transitions (GTK4 widgets)
// -----------------------------------------------------------------------------

/**
 * Shared layout names used by popup-like widgets (Launcher/OSD).
 *
 * We accept both HyprPanel-style "top-left" and internal underscore variants
 * ("top_left") to avoid duplicating enums across subsystems.
 */
export const AnchorLayoutValues = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
    "top",
    "bottom",
    "left",
    "right",
    "center",
    "full",
    "top_left",
    "top_center",
    "top_right",
    "bottom_left",
    "bottom_center",
    "bottom_right"
] as const

export type AnchorLayoutType = (typeof AnchorLayoutValues)[number]

/** Names mapped to Gtk.RevealerTransitionType (GTK4). */
export type GtkRevealerTransitionName =
    | "NONE"
    | "CROSSFADE"
    | "SLIDE_RIGHT"
    | "SLIDE_LEFT"
    | "SLIDE_UP"
    | "SLIDE_DOWN"
    | "SWING_RIGHT"
    | "SWING_LEFT"
    | "SWING_UP"
    | "SWING_DOWN";

export type StackTransition =
    | "NONE"
    | "CROSSFADE"
    | "SLIDE_RIGHT"
    | "SLIDE_LEFT"
    | "SLIDE_UP"
    | "SLIDE_DOWN"
    | "SLIDE_LEFT_RIGHT"
    | "SLIDE_UP_DOWN"
    | "OVER_UP"
    | "OVER_DOWN"
    | "OVER_LEFT"
    | "OVER_RIGHT"
    | "UNDER_UP"
    | "UNDER_DOWN"
    | "UNDER_LEFT"
    | "UNDER_RIGHT"
    | "OVER_UP_DOWN"
    | "OVER_DOWN_UP"
    | "OVER_LEFT_RIGHT"
    | "OVER_RIGHT_LEFT"
    | "ROTATE_LEFT"
    | "ROTATE_RIGHT"
    | "ROTATE_LEFT_RIGH"

export type RevealTransitionWithAuto = "AUTO" | GtkRevealerTransitionName;

export type OsdOrientation = "vertical" | "horizontal";

export type BarLayout = {
    left: BarModules[];
    middle: BarModules[];
    right: BarModules[];
    extends?: string;
};
export type BarLayouts = {
    [key: string]: BarLayout;
};

export type GridChild = {
    module: DashboardModules;
    column: number;
    row: number;
    width: number;
    height: number
}

export type ModuleMapArray = Array<GridChild>

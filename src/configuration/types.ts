import { Opt } from "src/lib/options";
import { BarTriggerKey } from "src/widget/bar/triggers";
import { MenuNode } from "./widgets/bar/type";

export type {
    AssetTransformation,
    ImageTechnique,
    VisualAsset,
    ResolvedAsset,
} from "src/services/assets/types"

export type HexColor = `#${string}`;

export interface ColorWithAlpha {
    color: Opt<HexColor>;
    alpha: Opt<number>;
}

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

export type OsdOrientation = "vertical" | "horizontal";

export type BarLayout = {
    left: BarTriggerKey[];
    middle: BarTriggerKey[];
    right: BarTriggerKey[];
    extends?: string;
};
export type BarLayouts = {
    [key: string]: BarLayout;
};

export type GridChild = {
    module: MenuNode;
    column: number;
    row: number;
    width: number;
    height: number
}

export type ModuleMapArray = Array<GridChild>

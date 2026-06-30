import { Opt } from "src/lib/options";
import { BarTriggerKey } from "src/widget/bar/triggers";
import type { MenuKey, NodeId } from "src/widget/shared/menus";

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
    /**
     * Stable per-cell node identifier used for per-instance menu config
     * lookup via getMenuOpt(). Generated once at creation time by
     * generateMenuNodeId() in the settings UI.
     *
     * Cells written before this field was added will have id === undefined
     * at runtime; consumers should fall back to `child.module` in that case.
     */
    id: NodeId;
    /**
     * Dashboard menu key — a key of `menuMap` in `src/widget/shared/menus`.
     * Typed as `MenuKey` for full compile-time safety; runtime safety is also
     * enforced by `isMenuKey()` in the renderer.
     */
    module: MenuKey;
    column: number;
    row: number;
    width: number;
    height: number;
}

export type ModuleMapArray = Array<GridChild>

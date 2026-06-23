import type { Opt } from "src/lib/options"
import type { OverrideScaleResult } from "src/lib/options/factories/overrideScale"
import type { SecondaryBarOptions } from "./secondaryBar/type"
import type { BarCornerOptions } from "./corner/type"
import type { CpuOptions } from "./modules/cpu/type"
import type { BarTriggerKey, BarMenuKey } from "src/widget/bar/triggers"
import { BarLocationType } from "src/configuration/enums"
import { ContainerStyleOptions } from "src/lib/options/factories/overrideContainer"
import { InteractiveSurfaceOptions } from "src/lib/options/factories/overrideInteractiveSurface"

// ─── Shared ────────────────────────────────────────────────────────────────

export type NodeId = string   // e.g. "n_abc123" — generated once at creation time

// ─── Menu node tree (composable popover content) ───────────────────────────
// Mirrors OkShell's MenuWidget / ContainerConfig pattern.

/**
 * A named menu-content leaf.
 * `widget` is a key into `barMenuMap` in src/widget/bar/triggers/index.ts.
 * At render time MenuNodeRenderer looks up the corresponding () => JSX.Element.
 */
export interface MenuWidgetNode {
  kind: "menu-widget"
  id: NodeId
  widget: BarMenuKey
}

/**
 * A layout container that embeds child MenuNodes side-by-side or stacked.
 * Allows placing multiple menus
 * in a horizontal row inside a single popover.
 */
export interface MenuContainerNode {
  kind: "menu-container"
  id: NodeId
  direction: "horizontal" | "vertical"
  spacing: number       // px between children, default 0
  minimumWidth: number  // 0 = natural size
  children: MenuNode[]
}

/** A visual GTK separator line between menu sections. */
export interface MenuDividerNode {
  kind: "menu-divider"
  id: NodeId
}

/** A blank spacer of fixed pixel size. */
export interface MenuSpacerNode {
  kind: "menu-spacer"
  id: NodeId
  size: number   // px, default 16
}

export type MenuNode =
  | MenuWidgetNode
  | MenuContainerNode
  | MenuDividerNode
  | MenuSpacerNode

// ─── Bar-level tree ────────────────────────────────────────────────────────

/**
 * A bar trigger.
 *
 * `triggerWidget` selects which reactive component renders the bar-face
 * (volume icon, battery %, clock, workspaces, etc.).
 *
 * `children` is the composable menu tree rendered inside the popover when
 * the trigger is clicked. Empty array = no popover, widget renders inline
 * without any button wrapper.
 *
 * This node replaces both the old `kind: "module"` and `kind: "popover"` nodes.
 */
export interface BarTriggerNode {
  kind: "trigger"
  id: NodeId
  triggerWidget: BarTriggerKey
  children: MenuNode[]
  menuMinimumWidth: number   // popover minimum width px, default 410
}

export interface BarGroupNode {
  kind: "group"
  id: NodeId
  direction: "horizontal" | "vertical"
  spacing: number
  cssClass: string
  children: BarNode[]
}

export type BarNode = BarTriggerNode | BarGroupNode

// ─── Slot layout ──────────────────────────────────────────────────────────

export interface BarSlotLayout {
  start: BarNode[]
  center: BarNode[]
  end: BarNode[]
}

// ─── Options ──────────────────────────────────────────────────────────────

export interface BarStyleOptions extends ContainerStyleOptions {
  floating: Opt<boolean>;
  transparent: Opt<boolean>;
  height: Opt<number>;
  marginTop: Opt<number>;
  marginBottom: Opt<number>;
  marginSides: Opt<number>;
}

export interface BarButtonsOptions extends InteractiveSurfaceOptions {
  bgHoverOpacity: Opt<number>;
}

export interface BarModulesOptions {
  cpu: CpuOptions
  defaultLayout: Opt<BarSlotLayout>
  monitorLayouts: Opt<Record<string, BarSlotLayout>>
  mirrorFirstMonitor: Opt<boolean>
}

export interface BarOptions extends OverrideScaleResult {
  position: Opt<BarLocationType>;
  margin: Opt<number[]>;
  style: BarStyleOptions;
  buttons: BarButtonsOptions;
  secondaryBar: SecondaryBarOptions;
  corner: BarCornerOptions;
  modules: BarModulesOptions;
}

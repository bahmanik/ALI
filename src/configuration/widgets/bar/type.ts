import type { Opt } from "src/lib/options"
import type { BarBorderLocation, BarLocation, HexColor, RgbaColor } from "src/configuration/types"
import type { SecondaryBarOptions } from "./secondaryBar/type"
import type { BarCornerOptions } from "./corner/type"
import type { CpuOptions } from "./modules/cpu/type"
import type { BarModule } from "src/widget/bar/modules"

// ─── Shared ────────────────────────────────────────────────────────────────

export type NodeId = string   // e.g. "n_abc123" — generated once at creation time

// ─── Popover content tree ──────────────────────────────────────────────────

export interface ContentModuleNode {
  kind: "module"
  id: NodeId
  module: BarModule
}

export interface ContentBoxNode {
  kind: "box"
  id: NodeId
  direction: "horizontal" | "vertical"
  spacing: number     // px, default 8
  width: number       // 0 = natural size
  height: number      // 0 = natural size
  children: ContentNode[]
}

export type ContentNode = ContentModuleNode | ContentBoxNode

// ─── Bar-level tree ────────────────────────────────────────────────────────

export interface BarModuleNode {
  kind: "module"
  id: NodeId
  module: BarModule
}

export interface BarGroupNode {
  kind: "group"
  id: NodeId
  direction: "horizontal" | "vertical"
  spacing: number     // px, default 4
  cssClass: string    // e.g. "pill" — maps to a SCSS class
  children: BarNode[] // BarModule, nested BarGroup, or BarPopover
}

export interface BarPopoverNode {
  kind: "popover"
  id: NodeId
  triggerIcon: string   // icon-name string; "" = auto from first content module
  triggerLabel: string  // "" = icon only
  content: ContentNode  // root of the popover body tree
}

export type BarNode = BarModuleNode | BarGroupNode | BarPopoverNode

// ─── Slot layout ──────────────────────────────────────────────────────────

export interface BarSlotLayout {
  start: BarNode[]
  center: BarNode[]
  end: BarNode[]
}

export interface BarModulesOptions {
  cpu: CpuOptions
  /** Default layout used for any monitor that doesn't have a custom layout. */
  defaultLayout: Opt<BarSlotLayout>
  /** Per-monitor layouts keyed by connector name (e.g. "eDP-1", "HDMI-A-1"). */
  monitorLayouts: Opt<Record<string, BarSlotLayout>>
  /** When true every bar renders the layout of the first connected monitor. */
  mirrorFirstMonitor: Opt<boolean>
}

export interface BarOptions {
  position: Opt<BarLocation>
  margin: Opt<number[]>
  secondaryBar: SecondaryBarOptions
  corner: BarCornerOptions
  modules: BarModulesOptions

  style: {
    floating: Opt<boolean>
    transparent: Opt<boolean>

    bg: Opt<HexColor>
    bgOpacity: Opt<number>

    height: Opt<number>
    radius: Opt<number>
    paddingX: Opt<number>
    paddingY: Opt<number>
    marginTop: Opt<number>
    marginBottom: Opt<number>
    marginSides: Opt<number>

    borderEnable: Opt<boolean>
    borderLocation: Opt<BarBorderLocation>
    borderWidth: Opt<number>
    borderColor: Opt<HexColor>

    shadowEnable: Opt<boolean>
    shadowMargin: Opt<number>
    shadowX: Opt<number>
    shadowY: Opt<number>
    shadowBlur: Opt<number>
    shadowSpread: Opt<number>
    shadowColor: Opt<RgbaColor>
  }

  buttons: {
    bg: Opt<HexColor>
    bgOpacity: Opt<number>
    bgHoverOpacity: Opt<number>

    radius: Opt<number>
    spacing: Opt<number>
    paddingX: Opt<number>
    paddingY: Opt<number>
  }

  useLocalScale: Opt<boolean>
  localScale: Opt<number>
  scale: Opt<number>
}

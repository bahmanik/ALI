import type { Opt } from "src/lib/options"
import type { OverrideScaleResult } from "src/lib/options/factories/overrideScale"
import type { SecondaryBarOptions } from "./secondaryBar/type"
import type { BarCornerOptions } from "./corner/type"
import type { CpuOptions } from "./modules/cpu/type"
import type { BarTriggerKey } from "src/widget/bar/triggers"
import { ContainerStyleOptions } from "src/lib/options/factories/overrideContainer"
import { InteractiveSurfaceOptions } from "src/lib/options/factories/overrideInteractiveSurface"
import { BarLocationType } from "src/configuration/enums"

// ─── Bar-level tree ────────────────────────────────────────────────────────
/**
 * A bar trigger.
 *
 * `triggerWidget` selects which reactive component renders on the bar face.
 * `children` is the MenuNode tree rendered inside the popover when clicked.
 * Empty `children` = no popover, trigger renders inline with no button wrapper.
 */
export interface BarTriggerNode {
  kind: "trigger"
  id: string
  triggerWidget: BarTriggerKey
  children: import("src/widget/shared/menus").MenuNode[]
  menuMinimumWidth: number   // popover minimum width px, default 410
}

export interface BarGroupNode {
  kind: "group"
  id: string
  direction: "horizontal" | "vertical"
  spacing: number
  cssClass: string
  children: BarNode[]
}

export type BarNode = BarTriggerNode | BarGroupNode

// ─── Slot layout ──────────────────────────────────────────────────────────────

export interface BarSlotLayout {
  start: BarNode[]
  center: BarNode[]
  end: BarNode[]
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface BarStyleOptions extends ContainerStyleOptions {
  floating: Opt<boolean>;
  transparent: Opt<boolean>;
  height: Opt<number>;
}

export interface BarModulesOptions {
  cpu: CpuOptions
  defaultLayout: Opt<BarSlotLayout>
  monitorLayouts: Opt<Record<string, BarSlotLayout>>
  mirrorFirstMonitor: Opt<boolean>
}

export interface BarOptions extends OverrideScaleResult {
  position: Opt<BarLocationType>;
  style: BarStyleOptions;
  buttons: InteractiveSurfaceOptions;
  secondaryBar: SecondaryBarOptions;
  corner: BarCornerOptions;
  modules: BarModulesOptions;
}

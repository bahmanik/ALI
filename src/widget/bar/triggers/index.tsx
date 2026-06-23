import ClockTrigger from "./clock"
import MediaTrigger from "./media"
import TrayTrigger from "./tray"
import WirelessTrigger from "./wireless"
import VolumeTrigger from "./volume"
import BatteryTrigger from "./battery"
import WorkspacesTrigger from "./workspaces"
import WindowtitleTrigger from "./windowtitle"
import ClipboardTrigger from "./clipboard"
import CpuTrigger from "./cpu"
import CpuTempTrigger from "./cputemp"
import RamTrigger from "./ram"
import KbLayoutTrigger from "./kblayout"
import StorageTrigger from "./storage"
import HyprsunsetTrigger from "./hyprsunset"

import {
  HyprsunsetMenu,
  VolumeMenu,
  BatteryMenu,
  MediaMenu,
  ClipboardMenu,
  WirelessMenu,
} from "src/widget/shared/menus"

import type { BarTriggerProps, BarMenuProps } from "./types"

/**
 * Single source of truth for all bar triggers.
 *
 * Key   = name used in layout config (e.g. options.bar.modules.defaultLayout)
 * Value = component accepting {@link BarTriggerProps}
 *
 * Adding a trigger here is the only change required — the derived type and
 * both renderers automatically pick it up.
 *
 * Note: Workspaces and Tray are self-contained — they manage their own
 * interactivity and should never appear with `children` in a BarTriggerNode.
 */
export const barTriggerMap = {
  Clock: ClockTrigger,
  Media: MediaTrigger,
  Tray: TrayTrigger,        // self-contained: manages its own per-item menubuttons
  Wireless: WirelessTrigger,
  Volume: VolumeTrigger,
  Battery: BatteryTrigger,
  Workspaces: WorkspacesTrigger,  // self-contained: manages its own interactive buttons
  Windowtitle: WindowtitleTrigger,
  Clipboard: ClipboardTrigger,
  Cpu: CpuTrigger,
  CpuTemp: CpuTempTrigger,
  Ram: RamTrigger,
  KbLayout: KbLayoutTrigger,
  Storage: StorageTrigger,
  Hyprsunset: HyprsunsetTrigger,
} as const satisfies Record<string, (props: BarTriggerProps) => JSX.Element>

/** Union of valid trigger keys — derived, never manually updated. */
export type BarTriggerKey = keyof typeof barTriggerMap

/**
 * Maps menu-widget keys to their standalone menu content component.
 * Used by MenuNodeRenderer when rendering kind:"menu-widget" nodes.
 * Every entry must be a zero-argument () => JSX.Element.
 */
export const barMenuMap = {
  Volume: VolumeMenu,
  Battery: BatteryMenu,
  Media: MediaMenu,
  Clipboard: ClipboardMenu,
  Wireless: WirelessMenu,
  Hyprsunset: HyprsunsetMenu,
} as const satisfies Record<string, () => JSX.Element>

/** Union of valid menu widget keys — derived, never manually updated. */
export type BarMenuKey = keyof typeof barMenuMap

export type { BarTriggerProps, BarMenuProps }

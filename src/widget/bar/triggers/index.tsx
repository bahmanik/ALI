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

import type { BarTriggerProps } from "./types"

/**
 * Single source of truth for all bar triggers.
 *
 * Key   = name used in layout config (e.g. options.bar.modules.defaultLayout)
 * Value = component accepting {@link BarTriggerProps}
 *
 * Note: Workspaces and Tray are self-contained — they manage their own
 * interactivity and should never appear with `children` in a BarTriggerNode.
 */
export const barTriggerMap = {
  Clock: ClockTrigger,
  Media: MediaTrigger,
  Tray: TrayTrigger,
  Wireless: WirelessTrigger,
  Volume: VolumeTrigger,
  Battery: BatteryTrigger,
  Workspaces: WorkspacesTrigger,
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

// ─── Shared menu map (re-exported for bar consumers) ─────────────────────────
//
// The menu map and its derived types live in src/widget/shared/menus — both
// bar and dashboard import from there. These aliases let existing bar code
// (BarLayoutEditor, etc.) keep importing from "src/widget/bar/triggers"
// without change.

export type { BarTriggerProps }

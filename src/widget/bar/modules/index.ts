import Clock from "./clock"
import Media from "./media"
import Tray from "./tray"
import Wireless from "./wireless"
import Volume from "./volume"
import Battery from "./battery"
import Workspaces from "./workspaces"
import Windowtitle from "./windowtitle"
import Clipboard from "./clipboard"
import Cpu from "./cpu"
import CpuTemp from "./cputemp"
import Ram from "./ram"
import KbLayout from "./kblayout"
import Storage from "./storage"
import Hyprsunset from "./hyprsunset"

import type { BarModuleProps, BarContentProps } from "./types"

/**
 * Single source of truth for all bar modules.
 *
 * Key   = the name used in layout config (e.g. options.bar.modules.defaultLayout)
 * Value = the component that accepts {@link BarModuleProps}
 *
 * Adding a module here is the only change needed — the type and the renderer
 * both derive from this dict automatically.
 */
export const barModuleMap = {
  Clock,
  Media,
  Tray,
  Wireless,
  Volume,
  Battery,
  Workspaces,
  Windowtitle,
  Clipboard,
  Cpu,
  CpuTemp,
  Ram,
  KbLayout,
  Storage,
  Hyprsunset,
} as const satisfies Record<string, (props: BarModuleProps) => JSX.Element>

/** Union of valid module names, derived — never needs manual updates. */
export type BarModule = keyof typeof barModuleMap

// Populated in Phase 4 as each module is split.
// Absent keys mean "no extractable content" — the renderer returns <box />.
export const barContentMap: Partial<Record<BarModule, (props: BarContentProps) => JSX.Element>> = {}

export type { BarModuleProps }

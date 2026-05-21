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

export {
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
}

export const barModules = [
  "Clock",
  "Media",
  "Tray",
  "Wireless",
  "Volume",
  "Battery",
  "Workspaces",
  "Windowtitle",
  "Clipboard",
  "Cpu",
  "CpuTemp",
  "Ram",
  "KbLayout",
  "Storage",
  "Hyprsunset",
] as const

export type BarModule = (typeof barModules)[number]

/** Maps module name → component. Only named modules in the layout are rendered. */
export const barModuleMap: Record<BarModule, () => JSX.Element> = {
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
}

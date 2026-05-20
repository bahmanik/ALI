// Static imports — GJS bundles everything at startup; "lazy" means we only
// *render* a module when its name appears in the bar layout config.
import Clock from "./clock";
import Media from "./media";
import Tray from "./tray";
import Wireless from "./wireless";
import Volume from "./volume";
import Battery from "./battery";
import Workspaces from "./workspaces";
import Windowtitle from "./windowtitle";
import Clipboard from "./clipboard";
import Cpu from "./Cpu";
import CpuTemp from "./CpuTemp";
import Ram from "./ram";
import KbLayout from "./kbLayout";
import Storage from "./storage";
import Hyprsunset from "./hyprsunset";

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
};

export const barModules = [
  'Clock',
  'Media',
  'Tray',
  'Wireless',
  'Volume',
  'Battery',
  'Workspaces',
  'Windowtitle',
  'Clipboard',
  'Cpu',
  'Cputemp',
  'Ram',
  'Kbinput',
  'Storage',
  'Hyprsunset',
  //  | 'Hypridle'
  //  | 'Quicktheme'
  //  | 'Power'
  //  | 'Notifications'
  //  | 'Updates'
  //  | 'QuickAction'
  //  | 'Netstat'
  //  | 'Bluetooth'
] as const;

export type BarModules = (typeof barModules)[number];

/**
 * Map from module name → component function.
 * Bar.tsx uses this to render only the modules listed in the layout config,
 * so unused modules produce no widgets even though they're imported.
 */
export const barModuleMap: Record<BarModules, () => JSX.Element> = {
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
  Cputemp: CpuTemp,
  Ram,
  Kbinput: KbLayout,
  Storage,
  Hyprsunset,
};

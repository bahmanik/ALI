import Apps from "gi://AstalApps?version=0.1";

export interface DesktopEntry {
  name: string;
  exec: string;
  icon: string;
  description?: string;
  categories?: string[];
  keywords?: string[];
  path: string;
  isAppImage?: boolean;
}

export interface AppButtonResult {
  app?: Apps.Application;
  customEntry?: DesktopEntry;
  index: number;
}

export interface ScreenButtonResult {
  screenCapture: ScreenCaptureOption;
  index: number;
}

export interface ScreenCaptureOption {
  name: string;
  description: string;
  icon: string;
  command: string;
  args: string[];
}

export interface CommandButtonResult {
  command: CommandOption;
  index: number;
}

export interface CommandOption {
  command: string;
  description: string;
  icon?: string;
  terminal?: boolean; // Whether to run in terminal
}

export interface SystemButtonResult {
  action: SystemAction;
  index: number;
}

export interface SystemAction {
  name: string;
  description: string;
  icon: string;
  command: string;
  confirm?: boolean; // Whether to show confirmation dialog
}

export interface ClipboardButtonResult {
  entry: ClipboardEntry;
  index: number;
}

export interface ClipboardEntry {
  content: string;
  timestamp: number;
  type: "text" | "image" | "file";
  preview?: string;
  id?: string;
  imagePath?: string; // Path to saved image for image entries
  thumbnailPath?: string; // Path to cached square thumbnail
}

export interface ExternalSearchResult {
  providerKey: string;
  providerName: string;
  query: string;
  url: string;
  icon: string;
  index: number;
}

export interface DirectoryButtonResult {
  result: DirectoryResult;
  index: number;
}

export interface DirectoryResult {
  path: string;
  name: string;
  isDirectory: boolean;
  score: number; // Fuzzy match score
}

export interface HyprlandWindowResult {
  client: HyprlandClient;
  index: number;
  window: HyprlandClient;
  screenshotPath?: string | null;
}

export interface HyprlandClient {
  address: string;
  mapped: boolean;
  hidden: boolean;
  at: [number, number];
  size: [number, number];
  workspace: {
    id: number;
    name: string;
  };
  floating: boolean;
  monitor: number;
  class: string;
  title: string;
  initialClass: string;
  initialTitle: string;
  pid: number;
  xwayland: boolean;
  pinned: boolean;
  fullscreen: boolean;
  fullscreenMode: number;
  fakeFullscreen: boolean;
  grouped: any[];
  swallowing: string;
  focusHistoryID: number;
}

export interface ListPrefixesResult extends PrefixInfo {
  id: string;
}

export interface PrefixInfo {
  prefix: string;
  description: string;
  type: string;
}

export interface KillButtonResult {
  action: KillAction;
  index: number;
}

export interface KillAction {
  type: 'process' | 'port' | 'window-click';
  name: string;
  description: string;
  icon: string;
  pid?: number;
  port?: number;
  command?: string;
  processName?: string;
}

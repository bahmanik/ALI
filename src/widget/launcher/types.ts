/**
 * Shared types for the launcher widget.
 * All search providers and components import from here.
 */

// ─── App search ──────────────────────────────────────────────────────────────

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

// ─── Command search ──────────────────────────────────────────────────────────

export interface CommandOption {
  command: string;
  description: string;
  icon?: string;
  terminal?: boolean;
}

// ─── System actions ───────────────────────────────────────────────────────────

export interface SystemAction {
  name: string;
  description: string;
  icon: string;
  command: string;
  confirm?: boolean;
}

// ─── Kill / process ───────────────────────────────────────────────────────────

export interface KillAction {
  type: "process" | "port" | "window-click";
  name: string;
  description: string;
  icon: string;
  pid?: number;
  port?: number;
  command?: string;
  processName?: string;
}

// ─── Directory / file search ─────────────────────────────────────────────────

export interface DirectoryResult {
  path: string;
  name: string;
  isDirectory: boolean;
  score: number;
}

// ─── Hyprland windows ────────────────────────────────────────────────────────

export interface HyprlandClient {
  address: string;
  mapped: boolean;
  hidden: boolean;
  at: [number, number];
  size: [number, number];
  workspace: { id: number; name: string };
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
  grouped: unknown[];
  swallowing: string;
  focusHistoryID: number;
}

// ─── Tmux ────────────────────────────────────────────────────────────────────

export interface TmuxTarget {
  type: "session" | "window" | "pane";
  sessionName: string;
  sessionId: string;
  windowName?: string;
  windowIndex?: number;
  paneIndex?: number;
  paneTitle?: string;
  isActive: boolean;
  isAttached: boolean;
  description: string;
  icon: string;
}

// ─── Emoji ────────────────────────────────────────────────────────────────────

export interface EmojiEntry {
  emoji: string;
  name: string;
  keywords: string[];
  category: string;
}

// ─── Clipboard ───────────────────────────────────────────────────────────────

export interface ClipboardEntry {
  content: string;
  timestamp: number;
  type: "text" | "image" | "file";
  preview?: string;
  id?: string;
  imagePath?: string;
  thumbnailPath?: string;
}

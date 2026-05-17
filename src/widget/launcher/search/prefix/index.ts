import icons from "src/lib/icons/icons";
/**
 * Prefix registry for the launcher.
 *
 * Each prefix maps a short keyword (typed before a space in the entry,
 * or selected from the prefix picker) to a specific search provider.
 * The empty string "" means "app" — the default.
 */

export interface PrefixEntry {
  /** The prefix string users type, e.g. ">" for commands. Empty = default (app). */
  prefix: string;
  /** Human-readable label shown in the picker */
  label: string;
  /** Short description shown as a subtitle in the picker */
  description: string;
  /** Icon name for the picker button */
  icon: string;
  /** Internal provider key matching SearchMode */
  mode: SearchMode;
}

export type SearchMode =
  | "app"
  | "clipboard"
  | "command"
  | "directory"
  | "emoji"
  | "hyprland"
  | "kill"
  | "system"
  | "tmux";

export const PREFIXES: PrefixEntry[] = [
  {
    prefix: "",
    label: "Apps",
    description: "Search installed applications",
    icon: icons.fallback.executable,
    mode: "app",
  },
  {
    prefix: "c",
    label: "Clipboard",
    description: "Browse clipboard history",
    icon: icons.launcher.clipboard,
    mode: "clipboard",
  },
  {
    prefix: ">",
    label: "Command",
    description: "Run a shell command",
    icon: icons.app.terminal,
    mode: "command",
  },
  {
    prefix: "~",
    label: "Files",
    description: "Search files and directories",
    icon: icons.launcher.folder,
    mode: "directory",
  },
  {
    prefix: "e",
    label: "Emoji",
    description: "Insert an emoji",
    icon: icons.launcher.emoji,
    mode: "emoji",
  },
  {
    prefix: "w",
    label: "Windows",
    description: "Switch Hyprland windows",
    icon: icons.launcher.window,
    mode: "hyprland",
  },
  {
    prefix: "k",
    label: "Kill",
    description: "Kill a process or port",
    icon: icons.launcher.process,
    mode: "kill",
  },
  {
    prefix: "s",
    label: "System",
    description: "System actions (shutdown, lock…)",
    icon: icons.launcher.shutdown,
    mode: "system",
  },
  {
    prefix: "t",
    label: "Tmux",
    description: "Switch tmux sessions/windows",
    icon: icons.launcher.tmux,
    mode: "tmux",
  },
];

/** Look up a PrefixEntry by its mode key */
export function getPrefixByMode(mode: SearchMode): PrefixEntry {
  return PREFIXES.find((p) => p.mode === mode) ?? PREFIXES[0];
}

/** Look up a PrefixEntry by the typed prefix character(s) */
export function getPrefixByChar(char: string): PrefixEntry | undefined {
  return PREFIXES.find((p) => p.prefix !== "" && p.prefix === char);
}

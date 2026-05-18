/**
 * Unified search dispatcher.
 * Calls the correct provider for the active mode and returns normalised results.
 */

import type { SearchMode } from "./prefixes"

import getAppResults        from "./app"
import getCommandResults    from "./command"
import getDirectoryResults  from "./directory"
import getEmojiResults      from "./emoji"
import getHyprlandResults   from "./hyprland"
import getKillResults       from "./kill"
import getSystemResults     from "./system"
import getTmuxResults       from "./tmux"

// ─── Per-provider result shapes ──────────────────────────────────────────────

export type { AppResult }      from "./app"
export type { CommandResult }  from "./command"
export type { DirectoryResult } from "./directory"
export type { EmojiResult }    from "./emoji"
export type { HyprlandResult } from "./hyprland"
export type { KillResult }     from "./kill"
export type { SystemResult }   from "./system"
export type { TmuxResult }     from "./tmux"

// ─── Tagged union ─────────────────────────────────────────────────────────────

import type { AppResult }       from "./app"
import type { CommandResult }   from "./command"
import type { DirectoryResult } from "./directory"
import type { EmojiResult }     from "./emoji"
import type { HyprlandResult }  from "./hyprland"
import type { KillResult }      from "./kill"
import type { SystemResult }    from "./system"
import type { TmuxResult }      from "./tmux"
import type { ClipboardEntry }  from "../types"

export type SearchResult =
  | { kind: "app";       data: AppResult }
  | { kind: "clipboard"; data: { entry: ClipboardEntry } }
  | { kind: "command";   data: CommandResult }
  | { kind: "directory"; data: DirectoryResult }
  | { kind: "emoji";     data: EmojiResult }
  | { kind: "hyprland";  data: HyprlandResult }
  | { kind: "kill";      data: KillResult }
  | { kind: "system";    data: SystemResult }
  | { kind: "tmux";      data: TmuxResult }

// ─── Dispatcher ──────────────────────────────────────────────────────────────

function getClipboardResults(_query: string): { entry: ClipboardEntry }[] {
  // Clipboard provider is handled externally via cliphist service.
  // Return empty here; the ResultList handles it separately if needed.
  return []
}

export async function search(
  mode: SearchMode,
  query: string,
  isPrefixSearch = false,
): Promise<SearchResult[]> {
  switch (mode) {
    case "app": {
      const results = getAppResults(query)
      return results.map((data) => ({ kind: "app", data }))
    }

    case "clipboard": {
      const results = getClipboardResults(query)
      return results.map((data) => ({ kind: "clipboard", data }))
    }

    case "command": {
      const results = getCommandResults(query, isPrefixSearch)
      return results.map((data) => ({ kind: "command", data }))
    }

    case "directory": {
      const results = await getDirectoryResults(query)
      return results.map((data) => ({ kind: "directory", data }))
    }

    case "emoji": {
      const results = getEmojiResults(query, isPrefixSearch)
      return results.map((data) => ({ kind: "emoji", data }))
    }

    case "hyprland": {
      const results = await getHyprlandResults(query)
      return results.map((data) => ({ kind: "hyprland", data }))
    }

    case "kill": {
      const results = await getKillResults(query, isPrefixSearch)
      return results.map((data) => ({ kind: "kill", data }))
    }

    case "system": {
      const results = getSystemResults(query, isPrefixSearch)
      return results.map((data) => ({ kind: "system", data }))
    }

    case "tmux": {
      const results = await getTmuxResults(query)
      return results.map((data) => ({ kind: "tmux", data }))
    }

    default:
      return []
  }
}

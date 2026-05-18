import { execAsync } from "ags/process"
import type { TmuxTarget } from "../types"

export type { TmuxTarget }
export interface TmuxResult { target: TmuxTarget }

// ─── Cache ────────────────────────────────────────────────────────────────────

interface Cache {
  sessions: TmuxTarget[]
  windows: TmuxTarget[]
  timestamp: number
}

let cache: Cache | null = null
const CACHE_TTL = 5_000

function isCacheValid() {
  return !!cache && Date.now() - cache.timestamp < CACHE_TTL
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchSessions(): Promise<TmuxTarget[]> {
  try {
    const output = await execAsync(["bash", "-c",
      "tmux list-sessions -F '#{session_id}|#{session_name}|#{session_attached}|#{session_windows}' 2>/dev/null",
    ])
    return output.trim().split("\n").filter(Boolean).map((line) => {
      const [id, name, attached, windows] = line.split("|")
      return {
        type: "session" as const,
        sessionId: id,
        sessionName: name,
        isAttached: attached === "1",
        isActive: attached === "1",
        description: `${windows} window${parseInt(windows) !== 1 ? "s" : ""}${attached === "1" ? " · attached" : ""}`,
        icon: attached === "1" ? "utilities-terminal-symbolic" : "terminal-symbolic",
      }
    })
  } catch {
    return []
  }
}

async function fetchWindows(): Promise<TmuxTarget[]> {
  try {
    const output = await execAsync(["bash", "-c",
      "tmux list-windows -a -F '#{session_id}|#{session_name}|#{window_index}|#{window_name}|#{window_active}|#{pane_current_command}' 2>/dev/null",
    ])
    return output.trim().split("\n").filter(Boolean).map((line) => {
      const [sessionId, sessionName, winIdx, winName, winActive, paneCmd] = line.split("|")
      return {
        type: "window" as const,
        sessionId,
        sessionName,
        windowIndex: parseInt(winIdx),
        windowName: winName,
        isActive: winActive === "1",
        isAttached: false,
        description: `${sessionName}:${winIdx} · ${paneCmd}`,
        icon: winActive === "1" ? "window-symbolic" : "window-new-symbolic",
      }
    })
  } catch {
    return []
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default async function getTmuxResults(query: string): Promise<TmuxResult[]> {
  const q = query.toLowerCase().trim()

  const onlySessions = q.startsWith("session") || q.startsWith("sess")
  const onlyWindows  = q.startsWith("window")  || q.startsWith("win")

  const actualQuery = q
    .replace(/^sess(ion)?\s*/i, "")
    .replace(/^win(dow)?\s*/i, "")
    .trim()

  if (!isCacheValid()) {
    const [sessions, windows] = await Promise.all([fetchSessions(), fetchWindows()])
    cache = { sessions, windows, timestamp: Date.now() }
  }

  const matches = (t: TmuxTarget) =>
    !actualQuery ||
    t.sessionName.toLowerCase().includes(actualQuery) ||
    t.windowName?.toLowerCase().includes(actualQuery) ||
    t.description.toLowerCase().includes(actualQuery)

  const results: TmuxTarget[] = []
  if (!onlyWindows)  results.push(...cache!.sessions.filter(matches))
  if (!onlySessions) results.push(...cache!.windows.filter(matches))

  results.sort((a, b) => Number(b.isActive) - Number(a.isActive))

  return results.slice(0, 10).map((target) => ({ target }))
}

export function clearTmuxCache() {
  cache = null
}

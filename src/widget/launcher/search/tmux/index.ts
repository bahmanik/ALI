import { execAsync } from "ags/process";

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

export interface TmuxButtonResult {
  target: TmuxTarget;
  index: number;
}

// Cache
interface TmuxCache {
  sessions: TmuxTarget[];
  windows: TmuxTarget[];
  timestamp: number;
}

let cache: TmuxCache | null = null;
const CACHE_DURATION = 5000; // 5s — tmux state changes often

function isCacheValid(): boolean {
  return !!cache && Date.now() - cache.timestamp < CACHE_DURATION;
}

async function getSessions(): Promise<TmuxTarget[]> {
  try {
    // Format: id|name|attached|windows
    const output = await execAsync([
      "bash", "-c",
      "tmux list-sessions -F '#{session_id}|#{session_name}|#{session_attached}|#{session_windows}' 2>/dev/null"
    ]);

    return output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(line => {
        const [id, name, attached, windows] = line.split("|");
        return {
          type: "session" as const,
          sessionId: id,
          sessionName: name,
          isAttached: attached === "1",
          isActive: attached === "1",
          description: `${windows} window${parseInt(windows) !== 1 ? "s" : ""}${attached === "1" ? " · attached" : ""}`,
          icon: attached === "1" ? "utilities-terminal-symbolic" : "terminal-symbolic",
        };
      });
  } catch {
    return []; // tmux not running or no sessions
  }
}

async function getWindows(): Promise<TmuxTarget[]> {
  try {
    // Format: session_id|session_name|window_index|window_name|window_active|pane_current_command
    const output = await execAsync([
      "bash", "-c",
      "tmux list-windows -a -F '#{session_id}|#{session_name}|#{window_index}|#{window_name}|#{window_active}|#{pane_current_command}' 2>/dev/null"
    ]);

    return output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(line => {
        const [sessionId, sessionName, winIdx, winName, winActive, paneCmd] = line.split("|");
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
        };
      });
  } catch {
    return [];
  }
}

export default async function getTmuxResults(
  searchText: string,
): Promise<TmuxButtonResult[]> {
  const query = searchText.toLowerCase().trim();

  // Type filters
  const showOnlySessions = query.startsWith("session") || query.startsWith("sess");
  const showOnlyWindows = query.startsWith("window") || query.startsWith("win");

  let actualQuery = query;
  if (showOnlySessions) actualQuery = query.replace(/^sess(ion)?\s*/i, "").trim();
  else if (showOnlyWindows) actualQuery = query.replace(/^win(dow)?\s*/i, "").trim();

  // Refresh cache if needed
  if (!isCacheValid()) {
    const [sessions, windows] = await Promise.all([getSessions(), getWindows()]);
    cache = { sessions, windows, timestamp: Date.now() };
  }

  const filterFn = (t: TmuxTarget) => {
    if (!actualQuery) return true;
    return (
      t.sessionName.toLowerCase().includes(actualQuery) ||
      t.windowName?.toLowerCase().includes(actualQuery) ||
      t.description.toLowerCase().includes(actualQuery)
    );
  };

  const results: TmuxTarget[] = [];

  if (!showOnlyWindows) {
    results.push(...cache!.sessions.filter(filterFn));
  }

  if (!showOnlySessions) {
    results.push(...cache!.windows.filter(filterFn));
  }

  // Active items first
  results.sort((a, b) => Number(b.isActive) - Number(a.isActive));

  return results.slice(0, 10).map((target, index) => ({ target, index }));
}

export function clearTmuxCache() {
  cache = null;
}

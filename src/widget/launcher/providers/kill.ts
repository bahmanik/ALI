import { execAsync } from "ags/process"
import type { KillAction } from "../types"

export interface KillResult { action: KillAction }

// ─── Cache ────────────────────────────────────────────────────────────────────

interface Cache {
  portProcesses: KillAction[]
  allProcesses: KillAction[]
  timestamp: number
}

let cache: Cache | null = null
const CACHE_TTL = 10_000 // 10 seconds

function isCacheValid(): boolean {
  return !!cache && Date.now() - cache.timestamp < CACHE_TTL
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchPortProcesses(): Promise<KillAction[]> {
  let output = ""
  try {
    output = await execAsync(["bash", "-c",
      "ss -tln 2>/dev/null | grep LISTEN | awk '{print $4}' | grep -o '[0-9]\\+$' | sort -u",
    ])
  } catch {
    try {
      output = await execAsync(["bash", "-c",
        "lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | awk '{print $9}' | grep -o '[0-9]\\+$' | sort -u",
      ])
    } catch {
      return []
    }
  }

  const ports = output.trim().split("\n").filter(Boolean)
  const results: KillAction[] = []
  const seen = new Set<number>()

  for (const portStr of ports) {
    const port = parseInt(portStr)
    if (isNaN(port) || seen.has(port)) continue
    seen.add(port)

    let processName = ""
    try {
      const pid = (await execAsync(["bash", "-c", `lsof -ti:${port} 2>/dev/null | head -1`])).trim()
      if (pid) {
        processName = (await execAsync(["bash", "-c", `ps -p ${pid} -o comm= 2>/dev/null`])).trim()
      }
    } catch {}

    results.push({
      type: "port",
      name: `Port ${port}${processName ? ` (${processName})` : ""}`,
      description: `Kill process on port ${port}`,
      icon: "network-server-symbolic",
      port,
    })
  }

  return results
}

async function fetchRunningProcesses(): Promise<KillAction[]> {
  try {
    const output = await execAsync(["bash", "-c",
      "ps aux | grep -v '^USER' | awk '{print $2, $11, $1, $3, $4}'",
    ])
    const seen = new Set<number>()

    return output
      .trim()
      .split("\n")
      .filter(Boolean)
      .reduce<KillAction[]>((acc, line) => {
        const [pid, command, user, cpu, mem] = line.split(" ")
        const pidNum = parseInt(pid)
        if (isNaN(pidNum) || seen.has(pidNum)) return acc
        seen.add(pidNum)

        acc.push({
          type: "process",
          name: command.split("/").pop() ?? command,
          description: `${user} · CPU ${cpu}% · MEM ${mem}% · PID ${pid}`,
          icon: "application-x-executable-symbolic",
          pid: pidNum,
          processName: command.split("/").pop() ?? command,
          command,
        })
        return acc
      }, [])
      .sort((a, b) => {
        const cpuA = parseFloat(a.description.match(/CPU ([\d.]+)%/)?.[1] ?? "0")
        const cpuB = parseFloat(b.description.match(/CPU ([\d.]+)%/)?.[1] ?? "0")
        return cpuB - cpuA
      })
  } catch {
    return []
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default async function getKillResults(
  query: string,
  _isPrefixSearch = false,
): Promise<KillResult[]> {
  const q = query.toLowerCase().trim()

  const onlyPorts     = q.startsWith("port")
  const onlyProcesses = q.startsWith("proc") || q.startsWith("ps")
  const onlyClick     = q.startsWith("click") || q.startsWith("window")

  const actualQuery = q
    .replace(/^(port|proc|ps|click|window)\s*/i, "")
    .trim()

  if (!isCacheValid()) {
    const [portProcesses, allProcesses] = await Promise.all([
      fetchPortProcesses(),
      fetchRunningProcesses(),
    ])
    cache = { portProcesses, allProcesses, timestamp: Date.now() }
  }

  const results: KillAction[] = []

  if (!onlyPorts && !onlyProcesses) {
    results.push({
      type: "window-click",
      name: "Kill by Click",
      description: "Click on any window to kill it",
      icon: "edit-select-symbolic",
    })
  }

  const matches = (action: KillAction) =>
    !actualQuery ||
    action.name.toLowerCase().includes(actualQuery) ||
    action.description.toLowerCase().includes(actualQuery) ||
    (action.command?.toLowerCase().includes(actualQuery) ?? false)

  if (!onlyProcesses && !onlyClick) {
    results.push(...cache!.portProcesses.filter(matches))
  }

  if (!onlyPorts && !onlyClick) {
    results.push(...cache!.allProcesses.filter(matches).slice(0, 20))
  }

  return results.map((action) => ({ action }))
}

export function clearKillCache() {
  cache = null
}

import { execAsync } from "ags/process"
import type { HyprlandClient } from "../types"

export type { HyprlandClient }
export interface HyprlandResult { client: HyprlandClient }

async function fetchClients(): Promise<HyprlandClient[]> {
  try {
    const json = await execAsync(["hyprctl", "clients", "-j"])
    return JSON.parse(json) as HyprlandClient[]
  } catch {
    return []
  }
}

export default async function getHyprlandResults(query: string): Promise<HyprlandResult[]> {
  const clients = await fetchClients()
  const q = query.toLowerCase()

  const filtered = q
    ? clients.filter(
        (c) =>
          c.class.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.initialClass.toLowerCase().includes(q) ||
          c.initialTitle.toLowerCase().includes(q),
      )
    : clients

  return filtered
    .sort((a, b) => a.focusHistoryID - b.focusHistoryID)
    .map((client) => ({ client }))
}

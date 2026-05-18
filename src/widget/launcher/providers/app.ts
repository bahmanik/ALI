import AstalApps from "gi://AstalApps?version=0.1"
import type { DesktopEntry } from "../types"
import { fuzzySearch } from "./app-scanner"

export interface AppResult {
  app?: AstalApps.Application
  customEntry?: DesktopEntry
}

const apps = new AstalApps.Apps({})

function isInAstalApps(entry: DesktopEntry, astalApps: AstalApps.Application[]): boolean {
  const entryName = entry.name.toLowerCase()
  const entryBin = entry.exec.split("/").pop()?.toLowerCase() ?? ""

  return astalApps.some((app) => {
    const appName = app.name?.toLowerCase() ?? ""
    const appExec = app.executable?.toLowerCase() ?? ""
    return (
      appName === entryName ||
      (appExec && entryBin && appExec.includes(entryBin)) ||
      (appExec && entryBin && entryBin.includes(appExec))
    )
  })
}

export default function getAppResults(query: string): AppResult[] {
  const astalResults = apps.fuzzy_query(query).slice(0, 5)
  const astalItems: AppResult[] = astalResults.map((app) => ({ app }))

  const customResults = fuzzySearch(query)
    .filter((entry) => !isInAstalApps(entry, astalResults))
    .slice(0, 5)
    .map((customEntry): AppResult => ({ customEntry }))

  return [...astalItems, ...customResults].slice(0, 10)
}

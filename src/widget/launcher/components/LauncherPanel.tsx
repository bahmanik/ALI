import { Gtk } from "ags/gtk4"
import type { Accessor } from "gnim"
import type AstalApps from "gi://AstalApps?version=0.1"
import type { SearchMode } from "../providers/prefixes"
import { SearchEntry } from "./SearchEntry"
import { FavoritesRow } from "./FavoritesRow"
import { ResultList } from "./ResultList"

export function LauncherPanel({
  apps,
  list,
  query,
  setQuery,
  hideWindow,
  activeMode,
  setMode,
}: {
  apps: AstalApps.Apps
  list: Accessor<AstalApps.Application[]>
  query: Accessor<string>
  setQuery: (s: string) => void
  hideWindow: () => void
  activeMode: Accessor<SearchMode>
  setMode: (m: SearchMode) => void
}) {
  return (
    <box class="launcher-panel" orientation={Gtk.Orientation.VERTICAL}>
      <SearchEntry
        apps={apps}
        list={list}
        setQuery={setQuery}
        hideWindow={hideWindow}
        activeMode={activeMode}
        setMode={setMode}
      />
      <FavoritesRow apps={apps} hideWindow={hideWindow} />
      <ResultList
        list={list}
        query={query}
        activeMode={activeMode}
        hideWindow={hideWindow}
      />
    </box>
  )
}

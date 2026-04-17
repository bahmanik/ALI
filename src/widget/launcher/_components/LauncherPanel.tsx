import { Gtk } from "ags/gtk4"
import type { Accessor } from "gnim"

import type AstalApps from "gi://AstalApps?version=0.1"

import { LauncherEntry } from "./LauncherEntry"
import { FavoritesRow } from "./FavoritesRow"
import { LauncherAppList } from "./LauncherAppList"

export type LauncherPanelProps = {
  apps: AstalApps.Apps
  list: Accessor<AstalApps.Application[]>
  query: Accessor<string>
  setQuery: (s: string) => void
  hideWindow: () => void
}

export function LauncherPanel({
  apps,
  list,
  query,
  setQuery,
  hideWindow,
}: LauncherPanelProps) {
  const entry = <LauncherEntry apps={apps} list={list} setQuery={setQuery} hideWindow={hideWindow} />
  const favorite = <FavoritesRow apps={apps} hideWindow={hideWindow} />
  const appList = <LauncherAppList list={list} query={query} />

  return (
    <Gtk.Grid
      class="launcher-panel"
      $={(self) => {
        self.attach(entry, 0, 0, 1, 1)
        self.attach(favorite, 0, 1, 1, 1)
        self.attach(appList, 0, 2, 1, 1)
      }} />
  )
}

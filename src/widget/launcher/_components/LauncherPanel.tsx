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
  return (
    <box cssClasses={["launcher-panel"]} orientation={Gtk.Orientation.VERTICAL}>
      <LauncherEntry apps={apps} list={list} setQuery={setQuery} hideWindow={hideWindow} />
      <FavoritesRow apps={apps} hideWindow={hideWindow} />
      <LauncherAppList list={list} query={query} />
    </box>
  )
}

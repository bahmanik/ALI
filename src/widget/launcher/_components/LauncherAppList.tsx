import { Gtk } from "ags/gtk4"
import { For, type Accessor } from "gnim"

import options from "src/configuration"
import type AstalApps from "gi://AstalApps?version=0.1"

import { numMin } from "../helpers"
import { AnimatedAppRow } from "./AnimatedAppRow"

export type LauncherAppListProps = {
  list: Accessor<AstalApps.Application[]>
  query: Accessor<string>
}

export function LauncherAppList({ list, query }: LauncherAppListProps) {
  const spacing = numMin(0, options.launcher.list.spacing.get(), 8)
  const iconPx = numMin(8, options.launcher.icons.app.get(), 36)
  const itemGap = numMin(0, options.launcher.list.itemGap.get(), 14)
  const showDescription = Boolean(options.launcher.list.showDescription.get())

  return (
    <box
      class={"launcher-list"}
      spacing={spacing}
      vexpand
      orientation={Gtk.Orientation.VERTICAL}
    >
      <For each={list}>
        {(app: AstalApps.Application) => (
          <AnimatedAppRow
            app={app}
            query={query}
            iconPx={iconPx}
            itemGap={itemGap}
            showDescription={showDescription}
          />
        )}
      </For>
    </box>
  )
}

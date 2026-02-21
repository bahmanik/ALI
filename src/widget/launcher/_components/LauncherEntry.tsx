import app from "ags/gtk4/app"
import { onCleanup, type Accessor } from "gnim"

import options from "src/configuration"
import type AstalApps from "gi://AstalApps?version=0.1"

import { numMin } from "../helpers"

export type LauncherEntryProps = {
  apps: AstalApps.Apps
  list: Accessor<AstalApps.Application[]>
  setQuery: (s: string) => void
  hideWindow: () => void
}

export function LauncherEntry({ apps, list, setQuery, hideWindow }: LauncherEntryProps) {
  let appconnect = 0

  onCleanup(() => {
    if (appconnect) app.disconnect(appconnect)
  })

  const onEnter = () => {
    const apps = list.peek()
    if (apps?.length) apps[0].launch()
    hideWindow()
  }

  return (
    <entry
      hexpand
      heightRequest={numMin(0, options.launcher.entry.height.get(), 44)}
      cssClasses={["launcher-entry"]}
      $={(self) => {
        appconnect = app.connect("window-toggled", async (_, win) => {
          const winName = win.name
          const visible = win.visible

          if (winName === "applauncher" && visible) {
            await apps.reload()
            setQuery("")
            self.set_text("")
            self.grab_focus()
          }
        })
      }}
      placeholderText={String(options.launcher.entry.placeholder.get() ?? "Search…")}
      onActivate={onEnter}
      onNotifyText={(self) => {
        setQuery(self.text)
      }}
    />
  )
}

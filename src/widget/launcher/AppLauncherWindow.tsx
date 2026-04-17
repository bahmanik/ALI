import AstalApps from "gi://AstalApps?version=0.1"
import options from "src/configuration"
import type { Gdk } from "ags/gtk4"
import { createState } from "gnim"
import { Popup } from "../shared/popup"
import { LauncherPanel } from "./_components"
import { hideLauncherWindow } from "./helpers"
import { toRevealerTransition } from "../shared/helpers"

const Apps = new AstalApps.Apps()

const { width, height } = options.launcher.window
const { transitionDuration, revealTransition, maxItems } = options.launcher

// keep behavior: these are evaluated once at import time
const transitionType = toRevealerTransition(revealTransition.get())
const transitionduration = transitionDuration.get()

export function hide_all_windows() {
  hideLauncherWindow()
}

const [text, text_set] = createState("")

// limit results by options.launcher.maxItems
const list = text.as((t) => {
  const max = maxItems.get()
  return Apps.fuzzy_query(t).slice(0, max)
})

export function AppLauncherWindow(gdkmonitor: Gdk.Monitor) {
  return (
    <Popup
      name={"launcher"}
      class="Launcher"
      width={width.get()}
      transitionDuration={transitionduration}
      height={height.get()}
      gdkmonitor={gdkmonitor}
      layout="top_center"
      transitionType={transitionType}
      surfaceClass="launcher-surface"
    >
      <LauncherPanel
        apps={Apps}
        list={list}
        query={text}
        setQuery={text_set}
        hideWindow={hideLauncherWindow}
      />
    </Popup>
  )
}

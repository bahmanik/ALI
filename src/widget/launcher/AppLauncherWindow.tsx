import AstalApps from "gi://AstalApps?version=0.1"
import options from "src/configuration"
import type { Gdk } from "ags/gtk4"
import { createState } from "gnim"
import { Popup } from "../shared/popup"
import { LauncherPanel } from "./_components"
import { hideLauncherWindow, numMin } from "./helpers"
import { toGtkRevealerTransitionType } from "../shared/helpers"

const Apps = new AstalApps.Apps()

// keep behavior: these are evaluated once at import time
const transitionType = toGtkRevealerTransitionType(options.launcher.revealTransition.get())
const transitionduration = options.launcher.transitionDuration.get()

export function hide_all_windows() {
  hideLauncherWindow()
}

const [text, text_set] = createState("")

// limit results by options.launcher.maxItems
const list = text.as((t) => {
  const max = numMin(1, options.launcher.maxItems.get(), 5)
  return Apps.fuzzy_query(t).slice(0, max)
})

export function AppLauncherWindow(gdkmonitor: Gdk.Monitor) {
  const width = numMin(240, options.launcher.window.width.get(), 520)
  const height = numMin(240, options.launcher.window.height.get(), 560)

  return (
    <Popup
      name={"applauncher"}
      class="AppLauncher"
      width={width}
      transitionDuration={transitionduration}
      height={height}
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

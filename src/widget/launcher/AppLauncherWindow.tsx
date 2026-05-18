import AstalApps from "gi://AstalApps?version=0.1"
import type { Gdk } from "ags/gtk4"
import { createState } from "gnim"
import options from "src/configuration"
import { Popup } from "../shared/popup"
import { toRevealerTransition } from "../shared/helpers"
import { hideLauncherWindow } from "./helpers"
import { LauncherPanel } from "./components/LauncherPanel"
import type { SearchMode } from "./providers/prefixes"

const Apps = new AstalApps.Apps()

const { width, height } = options.launcher.window
const { transitionDuration, revealTransition, maxItems } = options.launcher

// Evaluated once at import time — these drive the Popup's transition
const transitionType     = toRevealerTransition(revealTransition.get())
const transitionDurationMs = transitionDuration.get()

export function AppLauncherWindow(gdkmonitor: Gdk.Monitor) {
  const [query, setQuery] = createState("")
  const [mode,  setMode]  = createState<SearchMode>("app")

  const list = query.as((q) => Apps.fuzzy_query(q).slice(0, maxItems.get()))

  return (
    <Popup
      name="launcher"
      class="Launcher"
      gdkmonitor={gdkmonitor}
      layout="top_center"
      surfaceClass="launcher-surface"
      width={width.get()}
      height={height.get()}
      transitionType={transitionType}
      transitionDuration={transitionDurationMs}
    >
      <LauncherPanel
        apps={Apps}
        list={list}
        query={query}
        setQuery={setQuery}
        hideWindow={hideLauncherWindow}
        activeMode={mode}
        setMode={setMode}
      />
    </Popup>
  )
}

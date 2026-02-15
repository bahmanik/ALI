import app from "ags/gtk4/app"
import { Gdk, Gtk } from "ags/gtk4"
import { createState, For, onCleanup } from "gnim"
import { timeout, type Timer } from "ags/time"

import options from "../../configuration"
import AstalApps from "gi://AstalApps?version=0.1"

import { AppButton } from "./AppButton"
import { Popup } from "../shared/popup"
import { LauncherRevealTransition } from "../../lib/options/types"

const Apps = new AstalApps.Apps()

const transitionType = toGtkRevealerTransition(options.launcher.revealTransition.get())
const transitionduration = options.launcher.transitionDuration.get()

export function hide_all_windows() {
   app.get_window("applauncher")?.hide()
}
// 2) map option string -> Gtk enum
export function toGtkRevealerTransition(
   v: LauncherRevealTransition,
): Gtk.RevealerTransitionType {
   switch (v) {
      case "SWING_DOWN":
         return Gtk.RevealerTransitionType.SWING_DOWN
      case "SLIDE_DOWN":
         return Gtk.RevealerTransitionType.SLIDE_DOWN
      case "SLIDE_UP":
         return Gtk.RevealerTransitionType.SLIDE_UP
      case "CROSSFADE":
         return Gtk.RevealerTransitionType.CROSSFADE
      case "NONE":
         return Gtk.RevealerTransitionType.NONE
   }
}
const [text, text_set] = createState("")

// limit results by options.launcher.maxItems
const list = text.as((t) => {
   const max = Math.max(1, Number(options.launcher.maxItems.get() ?? 5))
   return Apps.fuzzy_query(t).slice(0, max)
})

// Animated row wrapper (enter-only animation)
function AnimatedAppRow({
   app,
   query,
   iconPx,
   itemGap,
   showDescription,
}: {
   app: AstalApps.Application
   query: string
   iconPx: number
   itemGap: number
   showDescription: boolean
}) {
   const animEnabled = Boolean(options.launcher.animateResults.get())
   const animDelay = Math.max(0, Number(options.launcher.animInDelayMs.get() ?? 0))

   const [revealed, setRevealed] = createState<boolean>(!animEnabled)

   // reveal on mount (only affects new rows)
   let tmr: Timer
   if (animEnabled) {
      tmr = timeout(animDelay, () => setRevealed(true))
   }
   onCleanup(() => tmr?.cancel?.())

   return (
      <Gtk.Revealer
         revealChild={revealed}
         transitionDuration={transitionduration}
         transitionType={transitionType}
      >
         <AppButton app={app} query={query} iconPx={iconPx} itemGap={itemGap} showDescription={showDescription} />
      </Gtk.Revealer>
   )
}

function Entry() {
   let appconnect: number

   onCleanup(() => {
      if (appconnect) app.disconnect(appconnect)
   })

   const onEnter = () => {
      const apps = list.peek()
      if (apps?.length) apps[0].launch()
      hide_all_windows()
   }

   return (
      <entry
         hexpand
         heightRequest={Math.max(0, Number(options.launcher.entry.height.get() ?? 44))}
         cssClasses={["launcher-entry"]}
         $={(self) => {
            appconnect = app.connect("window-toggled", async (_, win) => {
               const winName = win.name
               const visible = win.visible

               if (winName === "applauncher" && visible) {
                  await Apps.reload()
                  text_set("")
                  self.set_text("")
                  self.grab_focus()
               }
            })
         }}
         placeholderText={String(options.launcher.entry.placeholder.get() ?? "Search…")}
         onActivate={onEnter}
         onNotifyText={(self) => {
            text_set(self.text)
         }}
      />
   )
}

const Favorites = () => {
   if (!Boolean(options.launcher.showFavorites.get())) return <box />

   const favorites = (options.launcher.favorites.get() ?? []) as string[]

   const iconPx = Math.max(8, Number(options.launcher.icons.favorite.get() ?? 42))
   const spacing = Math.max(0, Number(options.launcher.favoritesUI.spacing.get() ?? 10))

   return (
      <box class={"launcher-favorites"} spacing={spacing} orientation={Gtk.Orientation.HORIZONTAL}>
         {favorites.map((fa) => {
            const app = Apps.exact_query(fa)[0]
            if (!app) return <box /> // skip missing favorites safely

            return (
               <button
                  hexpand
                  cssClasses={["launcher-favorite", "launcher-button", "appbutton"]}
                  onClicked={() => {
                     app.launch()
                     hide_all_windows()
                  }}
                  focusOnClick={false}
               >
                  <image iconName={app.iconName} pixelSize={iconPx} />
               </button>
            )
         })}
      </box>
   )
}

const AppList = () => {
   const spacing = Math.max(0, Number(options.launcher.list.spacing.get() ?? 8))
   const iconPx = Math.max(8, Number(options.launcher.icons.app.get() ?? 36))
   const itemGap = Math.max(0, Number(options.launcher.list.itemGap.get() ?? 14))
   const showDescription = Boolean(options.launcher.list.showDescription.get())

   return (
      <box class={"launcher-list"} spacing={spacing} vexpand orientation={Gtk.Orientation.VERTICAL}>
         <For each={list}>
            {(app: AstalApps.Application) => (
               <AnimatedAppRow app={app} query={text} iconPx={iconPx} itemGap={itemGap} showDescription={showDescription} />
            )}
         </For>
      </box>
   )
}

export function AppLauncherWindow(gdkmonitor: Gdk.Monitor) {
   const width = Math.max(240, Number(options.launcher.window.width.get() ?? 520))
   const height = Math.max(240, Number(options.launcher.window.height.get() ?? 560))

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
         <box cssClasses={["launcher-panel"]} orientation={Gtk.Orientation.VERTICAL}>
            <Entry />
            <Favorites />
            <AppList />
         </box>
      </Popup>
   )
}

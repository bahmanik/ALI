import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { createState, For, onCleanup } from "gnim"
import { timeout, type Timer } from "ags/time"

import options from "../../configuration"
import AstalApps from "gi://AstalApps?version=0.1"

import { AppButton } from "./AppButton"
import { Popup } from "../shared/popup"
import { LauncherRevealTransition } from "../../lib/options/types"

const Apps = new AstalApps.Apps()

const transitionType = options.launcher.revealTransition.as(toGtkRevealerTransition)

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
function AnimatedAppRow({ app, query }: { app: AstalApps.Application; query: string }) {
   const animEnabled = Boolean(options.launcher.animateResults.get())
   const animMs = Math.max(0, Number(options.launcher.animInMs.get() ?? 160))
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
         transitionDuration={animMs}
         transitionType={transitionType}
      >
         <AppButton app={app} query={query} />
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
         placeholderText={"Search..."}
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

   return (
      <box spacing={10} orientation={Gtk.Orientation.HORIZONTAL}>
         {favorites.map((fa) => {
            const app = Apps.exact_query(fa)[0]
            if (!app) return <box /> // skip missing favorites safely

            return (
               <button
                  hexpand
                  cssClasses={["launcher-button", "appbutton"]}
                  onClicked={() => {
                     app.launch()
                     hide_all_windows()
                  }}
                  focusOnClick={false}
               >
                  <image iconName={app.iconName} iconSize={Gtk.IconSize.LARGE} />
               </button>
            )
         })}
      </box>
   )
}

const AppList = () => (
   <box spacing={10} vexpand orientation={Gtk.Orientation.VERTICAL}>
      <For each={list}>{(app: AstalApps.Application) => <AnimatedAppRow app={app} query={text} />}</For>
   </box>
)

export function AppLauncherWindow(gdkmonitor: Gdk.Monitor) {
   const { TOP, BOTTOM, RIGHT, LEFT } = Astal.WindowAnchor

   return (
      <Popup
         valign={Gtk.Align.START}
         halign={Gtk.Align.CENTER}
         margin={10}
         visible
         name={"applauncher"}
         class="AppLauncher"
         gdkmonitor={gdkmonitor}
         exclusivity={Astal.Exclusivity.EXCLUSIVE}
         anchor={TOP | BOTTOM | RIGHT | LEFT}
         application={app}
      >
         <box orientation={Gtk.Orientation.VERTICAL}>
            <Entry />
            <Favorites />
            <AppList />
         </box>
      </Popup>
   )
}

import app from "ags/gtk4/app"
import { AppLauncherWindow } from "./src/widget/launcher/AppLauncherWindow"
import { PrimaryBar, Corner } from "./src/widget/bar"
import NotificationPopups from "./src/widget/notifications/NotificationPopups"
import CalendarWindow from "src/widget/calendar/CalendarWindow"
import CountdownWindow from "src/widget/countdown/CountdownWindow"

import { bootSession } from "src/lib/session"
import { bootOptions } from "src/lib/options/runtime"
import { bootNotif } from "src/lib/notiofication"
import { boot as bootPhase2 } from "src/boot"
import PowerWindow from "src/widget/power"
import SettingWindow from "src/widget/setting"
import TestWindow from "src/widget/test"

function mountUI() {
  const monitors = app.get_monitors()

  const perMonitor = [
    Corner,
    PrimaryBar,
    AppLauncherWindow,
    CalendarWindow,
    CountdownWindow,
    PowerWindow,
    SettingWindow,
    TestWindow,
  ] as const

  for (const mk of perMonitor) monitors.map(mk)

  NotificationPopups()
}

function bootPhase1() {
  void (async () => {
    try {
      await bootSession()
      await bootOptions()
      await bootNotif()
    } catch (e) {
      console.error("[boot] phase1 failed", e)
    }
  })()
}

bootPhase1()

app.start({
  main() {
    mountUI()
    void bootPhase2().catch((e) =>
      console.error("[boot] services boot failed", e),
    )
  },
})

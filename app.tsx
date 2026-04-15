import app from "ags/gtk4/app";
import { AppLauncherWindow } from "./src/widget/launcher/AppLauncherWindow";
import { PrimaryBar, SecondaryBar, Corner } from "./src/widget/bar";
import { MicOsd, SoundOsd, BrightnessOsd, KeyboardBrightnessOsd } from "./src/widget/osd";
import NotificationPopups from "./src/widget/notifications/NotificationPopups";
import CalendarWindow from "src/widget/calendar/CalendarWindow";
import CountdownWindow from "src/widget/countdown/CountdownWindow";

import { bootSession } from "src/lib/session";
import { bootOptions } from "src/lib/options/runtime";
import { bootNotif } from "src/lib/notiofication";
import { boot as bootPhase2 } from "src/boot";
import PowerWindow from "src/widget/power";
import DashboardWindows from "src/widget/dashboard";
import SettingWindow from "src/widget/setting";

function mountUI() {
  const monitors = app.get_monitors();

  // Per-monitor windows
  const perMonitor = [
    Corner,
    PrimaryBar,
    SecondaryBar,
    AppLauncherWindow,
    SoundOsd,
    MicOsd,
    BrightnessOsd,
    KeyboardBrightnessOsd,
    CalendarWindow,
    CountdownWindow,
    PowerWindow,
    SettingWindow,
    // DashboardWindows,
  ] as const;

  for (const mk of perMonitor) monitors.map(mk);

  // Singleton windows
  NotificationPopups();
}

function bootPhase1() {
  // Start, but DON'T await (keeps AGS tracking happy).
  void (async () => {
    try {
      await bootSession();
      await bootOptions();
      await bootNotif();
    } catch (e) {
      console.error("[boot] phase1 failed", e);
    }
  })();
}

// Start phase1 as early as possible, without blocking UI mount.
bootPhase1();

app.start({
  main() {
    mountUI();
    void bootPhase2().catch((e) => console.error("[boot] services boot failed", e));
  },
});

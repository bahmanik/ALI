import app from "ags/gtk4/app";

import Bar from "./src/widget/bar/Bar";
import Corner from "./src/widget/bar/corner";
import options from "./src/configuration";
import { setSecondaryRect } from "./src/widget/bar/geometry";

import { AppLauncherWindow } from "./src/widget/launcher/AppLauncherWindow";
import { MicOsd, SoundOsd, BrightnessOsd, KeyboardBrightnessOsd } from "./src/widget/osd";
import NotificationPopups from "./src/widget/notifications/NotificationPopups";
import CalendarWindow from "src/widget/calendar/CalendarWindow";
import CountdownWindow from "src/widget/countdown/CountdownWindow";

import { bootSession } from "src/lib/session";
import { bootOptions } from "src/lib/options/runtime";
import { bootNotif } from "src/lib/notiofication";
import { boot } from "src/boot";

// IMPORTANT (AGS tracking context):
// The widget tree must be created synchronously inside app.start({ main() { ... } }).
// Awaiting before mount breaks AGS' reactive tracking and produces "out of tracking context" errors.
void (async () => {
  // Phase 1: session + options should be ready before UI reads persisted values.
  // If this fails, we still start the UI (with defaults) and log the error.
  try {
    await bootSession();
    await bootOptions();
    await bootNotif();
  } catch (e) {
    console.error("[boot] session/options boot failed", e);
  }

  app.start({
    main() {
      // Outer wallpaper frame (behind apps, above desktop wallpaper)
      app.get_monitors().map(Corner);

      // Primary bar
      app.get_monitors().map((m) => (
        <Bar
          name={`primary-bar-${m.connector}`}
          gdkmonitor={m}
          option={options.bar}
          namespace="bar"
          kind="primary"
        />
      ));

      // Secondary bar (created/destroyed via options.bar.secondaryBar.enable)
      const secondary = new Map<string, any>();
      let poll: ReturnType<typeof setInterval> | null = null;

      const syncSecondaryBars = () => {
        const enabled = options.bar.secondaryBar.enable.get();
        const monitors = app.get_monitors();
        const live = new Set(monitors.map((mm) => mm.connector));

        if (!enabled) {
          for (const [id, win] of secondary) {
            try {
              app.remove_window(win);
            } catch { }
            try {
              win.destroy();
            } catch { }
            setSecondaryRect(id, undefined);
          }
          secondary.clear();
          if (poll) {
            clearInterval(poll);
            poll = null;
          }
          return;
        }

        // create missing
        for (const m of monitors) {
          const id = m.connector;
          if (secondary.has(id)) continue;
          const win = (
            <Bar
              name={`secondary-bar-${id}`}
              gdkmonitor={m}
              option={options.bar.secondaryBar}
              namespace="secondary-bar"
              kind="secondary"
            />
          ) as any;
          try {
            app.add_window(win);
          } catch { }
          secondary.set(id, win);
        }

        // destroy stale (monitor removed)
        for (const [id, win] of secondary) {
          if (live.has(id)) continue;
          try {
            app.remove_window(win);
          } catch { }
          try {
            win.destroy();
          } catch { }
          setSecondaryRect(id, undefined);
          secondary.delete(id);
        }

        // Keep a lightweight monitor-sync while enabled
        if (!poll) poll = setInterval(syncSecondaryBars, 1500);
      };

      options.bar.secondaryBar.enable.subscribe(syncSecondaryBars);
      syncSecondaryBars();

      app.get_monitors().map(AppLauncherWindow);
      app.get_monitors().map(SoundOsd);
      app.get_monitors().map(MicOsd);
      app.get_monitors().map(BrightnessOsd);
      app.get_monitors().map(KeyboardBrightnessOsd);
      app.get_monitors().map(CalendarWindow);
      app.get_monitors().map(CountdownWindow);
      NotificationPopups();

      // Phase 2: startup-critical services (previously initService()).
      // Don't await here: main() must stay synchronous for AGS tracking.
      void boot().catch((e) => console.error("[boot] services boot failed", e));
    },
  });
})();

import app from "ags/gtk4/app";

// ── Widget imports ────────────────────────────────────────────────
import { Corner, PrimaryBar, SecondaryBar } from "./src/widget/bar";
import { MicOsd, SoundOsd, BrightnessOsd, KeyboardBrightnessOsd } from "./src/widget/osd";
import NotificationPopups from "./src/widget/notifications/NotificationPopups";
import { AppLauncherWindow } from "./src/widget/launcher/AppLauncherWindow";
import CalendarWindow from "./src/widget/calendar/CalendarWindow";
import CountdownWindow from "./src/widget/countdown/CountdownWindow";
import PowerWindow from "./src/widget/power";
import SettingWindow from "./src/widget/setting";

// ── Service / boot imports ────────────────────────────────────────
import { bootSession } from "src/lib/session";
import { bootOptions } from "src/lib/options/runtime";
import { bootNotif } from "src/lib/notiofication";
import { bootStyle } from "src/style";
// import { bootHyprland } from "src/hyprland";
import { services } from "src/services";

// ── Lifecycle ─────────────────────────────────────────────────────
import { lifecycle } from "src/lib/lifecycle";
import { perf } from "src/lib/lifecycle/perf";
import TestWindow from "src/widget/test";

// ─────────────────────────────────────────────────────────────────
// Core services  (sequential, critical)
// ─────────────────────────────────────────────────────────────────

lifecycle
  .register({
    id: "session",
    phase: "core",
    start: bootSession,
  })
  .register({
    id: "options",
    phase: "core",
    deps: ["session"],
    start: bootOptions,
  })
  .register({
    id: "notif",
    phase: "core",
    start: bootNotif,
  });

// ─────────────────────────────────────────────────────────────────
// Lazy services  (parallel waves, non-critical)
// ─────────────────────────────────────────────────────────────────

lifecycle
  .register({
    id: "style",
    phase: "lazy",
    start: bootStyle,
  })
  // .register({
  //   id: "hyprland",
  //   phase: "lazy",
  //   start: bootHyprland,
  // })
  .register({
    id: "wallpaper",
    phase: "lazy",
    deps: ["style"],
    start: () => services.wallpaper.start(),
  })
  .register({
    id: "matugen",
    phase: "lazy",
    deps: ["wallpaper"],
    start: () => services.matugenPalette.start(),
  })
  .register({
    id: "countdown",
    phase: "lazy",
    start: () => services.countdown.start(),
  })
  .register({
    id: "brightness",
    phase: "lazy",
    start: () => services.brightness.start(),
  });

// ─────────────────────────────────────────────────────────────────
// Widgets  (all mounted synchronously inside createRoot)
// ─────────────────────────────────────────────────────────────────

lifecycle
  .registerWidget({
    id: "corner",
    priority: 0,
    mount: () => app.get_monitors().forEach(m => Corner(m)),
  })
  .registerWidget({
    id: "bar-primary",
    priority: 10,
    mount: () => app.get_monitors().forEach(m => PrimaryBar(m)),
  })
  .registerWidget({
    id: "bar-secondary",
    priority: 20,
    mount: () => app.get_monitors().forEach(m => SecondaryBar(m)),
  })
  .registerWidget({
    id: "notif-ui",
    priority: 30,
    mount: () => NotificationPopups(),
  })
  .registerWidget({
    id: "osd-sound",
    priority: 40,
    mount: () => app.get_monitors().forEach(m => SoundOsd(m)),
  })
  .registerWidget({
    id: "osd-mic",
    priority: 50,
    mount: () => app.get_monitors().forEach(m => MicOsd(m)),
  })
  .registerWidget({
    id: "osd-brightness",
    priority: 60,
    mount: () => app.get_monitors().forEach(m => BrightnessOsd(m)),
  })
  .registerWidget({
    id: "osd-kbd",
    priority: 70,
    mount: () => app.get_monitors().forEach(m => KeyboardBrightnessOsd(m)),
  })
  .registerWidget({
    id: "launcher",
    priority: 80,
    mount: () => app.get_monitors().forEach(m => AppLauncherWindow(m)),
  })
  .registerWidget({
    id: "calendar",
    priority: 90,
    mount: () => app.get_monitors().forEach(m => CalendarWindow(m)),
  })
  .registerWidget({
    id: "countdown-ui",
    priority: 100,
    mount: () => app.get_monitors().forEach(m => CountdownWindow(m)),
  })
  .registerWidget({
    id: "power",
    priority: 110,
    mount: () => app.get_monitors().forEach(m => PowerWindow(m)),
  })
  .registerWidget({
    id: "settings",
    priority: 120,
    mount: () => app.get_monitors().forEach(() => SettingWindow()),
  })
// .registerWidget({
//   id: "test",
//   priority: 1000,
//   mount: () => app.get_monitors().forEach(m => TestWindow(m)),
// });

// ─────────────────────────────────────────────────────────────────
// Ready listener
// ─────────────────────────────────────────────────────────────────

lifecycle.onPhase("ready", () => perf.report());

// ─────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────

lifecycle.bootCoreServices();

app.start({
  async main() {
    try {
      lifecycle.mountWidgets();
      await lifecycle.bootLazyServices();
    } catch (error) {
      console.error(error)
    }
  },
})

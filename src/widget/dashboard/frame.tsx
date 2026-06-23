import { Gtk } from "ags/gtk4"
import {
  ObserverMenu,
  AppLauncherMenu,
  AvatarMenu,
  ClockMenu,
  FileLauncherMenu,
  MediaMenu,
  QuickLaunchMenu,
  UptimeMenu,
  WeatherMenu,
} from "../shared/menus"

function Frame() {
  const observer = <ObserverMenu /> as Gtk.Widget
  const appLauncher = <AppLauncherMenu /> as Gtk.Widget
  const avatar = <AvatarMenu /> as Gtk.Widget
  const clock = <ClockMenu /> as Gtk.Widget
  const fileLauncher = <FileLauncherMenu /> as Gtk.Widget
  const media = <MediaMenu /> as Gtk.Widget
  const uptime = <UptimeMenu /> as Gtk.Widget
  const weather = <WeatherMenu /> as Gtk.Widget

  const quickLaunch1 = <QuickLaunchMenu /> as Gtk.Widget
  const quickLaunch2 = <QuickLaunchMenu /> as Gtk.Widget
  const quickLaunch3 = <QuickLaunchMenu /> as Gtk.Widget
  const quickLaunch4 = <QuickLaunchMenu /> as Gtk.Widget
  const quickLaunch5 = <QuickLaunchMenu /> as Gtk.Widget
  const quickLaunch6 = <QuickLaunchMenu /> as Gtk.Widget
  const quickLaunch7 = <QuickLaunchMenu /> as Gtk.Widget
  const quickLaunch8 = <QuickLaunchMenu /> as Gtk.Widget
  const quickLaunch9 = <QuickLaunchMenu /> as Gtk.Widget
  return (
    <Gtk.Grid
      $={(self) => {
        self.attach(avatar, 0, 0, 3, 4)
        self.attach(quickLaunch1, 0, 4, 1, 1)
        self.attach(weather, 3, 0, 4, 3)
        self.attach(quickLaunch2, 3, 3, 2, 1)
        self.attach(quickLaunch3, 5, 3, 2, 1)
        self.attach(media, 1, 4, 6, 1)
        self.attach(quickLaunch4, 7, 0, 2, 1)
        self.attach(fileLauncher, 7, 1, 2, 4)
        self.attach(quickLaunch5, 9, 0, 1, 1)
        self.attach(quickLaunch6, 9, 1, 1, 1)
        self.attach(quickLaunch7, 9, 2, 1, 1)
        self.attach(quickLaunch8, 9, 3, 1, 1)
        self.attach(quickLaunch9, 9, 4, 1, 1)
        console.log(self)
      }}
    >

    </Gtk.Grid>
  )
}

export default Frame

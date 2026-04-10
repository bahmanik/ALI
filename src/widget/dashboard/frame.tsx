import { Gtk } from "ags/gtk4"
import Cell from "./_component/cell"
import {
  Observer,
  AppLauncher,
  Avatar,
  Clock,
  FileLauncher,
  Media,
  QuickLaunch,
  Uptime,
  Weather,
} from "./_component"

function Frame() {
  const observer = <Observer /> as Gtk.Widget
  const appLauncher = <AppLauncher /> as Gtk.Widget
  const avatar = <Avatar /> as Gtk.Widget
  const clock = <Clock /> as Gtk.Widget
  const fileLauncher = <FileLauncher /> as Gtk.Widget
  const media = <Media /> as Gtk.Widget
  const uptime = <Uptime /> as Gtk.Widget
  const weather = <Weather /> as Gtk.Widget

  const quickLaunch1 = <QuickLaunch /> as Gtk.Widget
  const quickLaunch2 = <QuickLaunch /> as Gtk.Widget
  const quickLaunch3 = <QuickLaunch /> as Gtk.Widget
  const quickLaunch4 = <QuickLaunch /> as Gtk.Widget
  const quickLaunch5 = <QuickLaunch /> as Gtk.Widget
  const quickLaunch6 = <QuickLaunch /> as Gtk.Widget
  const quickLaunch7 = <QuickLaunch /> as Gtk.Widget
  const quickLaunch8 = <QuickLaunch /> as Gtk.Widget
  const quickLaunch9 = <QuickLaunch /> as Gtk.Widget
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

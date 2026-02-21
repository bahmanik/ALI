import app from "ags/gtk4/app"

export const LAUNCHER_WINDOW_NAME = "applauncher"

export function hideLauncherWindow() {
  app.get_window(LAUNCHER_WINDOW_NAME)?.hide()
}

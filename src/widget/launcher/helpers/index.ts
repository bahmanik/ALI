import app from "ags/gtk4/app"

export const LAUNCHER_WINDOW_NAME = "applauncher"

export function hideLauncherWindow() {
  app.get_window(LAUNCHER_WINDOW_NAME)?.hide()
}

/** Clamp `value` to at least `min`, falling back to `fallback` if not a number. */
export function numMin(min: number, value: unknown, fallback: number): number {
  return Math.max(min, Number(value ?? fallback))
}

/** Clamp `value` to at most `max`, falling back to `fallback` if not a number. */
export function numMax(max: number, value: unknown, fallback: number): number {
  return Math.min(max, Number(value ?? fallback))
}

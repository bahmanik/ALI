import Gtk from "gi://Gtk?version=4.0"
import GLib from "gi://GLib"
import giCairo from "cairo"

// ─────────────────────────────────────────────────────────────────────────────
//  useRef<T>
//  Stable mutable container.  Avoids bare `let` for widget-level state.
// ─────────────────────────────────────────────────────────────────────────────
export const useRef = <T>(initial: T): { current: T } => ({ current: initial })

// ─────────────────────────────────────────────────────────────────────────────
//  useAnimation(fps?)
//
//  Wraps GLib.timeout_add into a reusable, restartable animation driver.
//
//  .start(onTick, onDone?)
//    onTick  — called each frame.  Return true to continue, false to stop.
//    onDone  — called once after the last tick.  Use it to chain animations
//              (e.g. travel → fade, expand → contract).
//
//  .stop()   — cancels the running loop on the next tick.
//  .isRunning() — whether a loop is currently active.
//
//  Design note: start() returns immediately if already running, so callers
//  can safely call it without guarding.  If you need to update state that a
//  running tick reads (e.g. a spring target), just mutate the ref — the
//  in-flight tick will pick it up automatically on the next frame.
// ─────────────────────────────────────────────────────────────────────────────
export const useAnimation = (fps = 60) => {
  const active = useRef(false)
  const ms = Math.round(1000 / fps)

  return {
    isRunning: () => active.current,

    start(onTick: () => boolean, onDone?: () => void) {
      if (active.current) return
      active.current = true
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
        if (!active.current) return GLib.SOURCE_REMOVE
        const cont = onTick()
        if (!cont) {
          active.current = false
          onDone?.()
        }
        return cont ? GLib.SOURCE_CONTINUE : GLib.SOURCE_REMOVE
      })
    },

    stop() { active.current = false },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  useDrawingArea(draw, opts?)
//
//  Creates a GTK4 DrawingArea with two important defaults over the raw widget:
//
//  interactive (default false)
//    false → set_can_target(false): events pass through to widgets below.
//            Use this for pure overlay canvases (SliderAnimation, etc.).
//    true  → set_can_target(true): the area catches pointer events.
//            Use this when the canvas IS the interactive surface (OrbitSelector).
//
//  The draw callback receives a typed Cairo.Context plus the widget's current
//  pixel dimensions, so you never need to query them separately.
// ─────────────────────────────────────────────────────────────────────────────
export const useDrawingArea = (
  draw: (cr: giCairo.Context, w: number, h: number) => void,
  { interactive = false }: { interactive?: boolean } = {},
) => {
  const area = new Gtk.DrawingArea()
  area.set_hexpand(true)
  area.set_vexpand(true)
  area.set_can_target(interactive)
  area.set_draw_func((_, cr, w, h) =>
    draw(cr as unknown as giCairo.Context, w, h),
  )
  return {
    widget: area,
    redraw: () => area.queue_draw(),
  }
}

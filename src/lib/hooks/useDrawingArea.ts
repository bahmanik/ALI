import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"

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
const useDrawingArea = (
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

export default useDrawingArea

import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"
import GLib from "gi://GLib?version=2.0";

// ─────────────────────────────────────────────────────────────────────────────
//  useDrawingArea(draw, opts?)
//
//  Creates a GTK4 DrawingArea.
//
//  interactive (default false)
//    false → set_can_target(false): events pass through to widgets below.
//            Use this for pure overlay canvases (SliderAnimation, etc.).
//    true  → set_can_target(true): the area catches pointer events.
//            Use this when the canvas IS the interactive surface (OrbitSelector).
//
//  expand (default false)
//    false → no hexpand/vexpand. Use this for fixed-size canvases
//            (CircularProgress, LineGraph, etc.) that set their own
//            content_width/content_height.
//    true  → set both hexpand and vexpand. Use only when the canvas is
//            meant to fill its parent container (fullscreen overlays, etc.).
//
//  Startup flash fix
//    GTK invokes the draw function before the Wayland layer-shell configure
//    roundtrip completes, so the first frame arrives at the compositor's
//    fallback geometry (~200×200) rather than the real monitor dimensions.
//    The first draw call is intentionally skipped and rescheduled via
//    GLib.idle_add(PRIORITY_DEFAULT_IDLE), which runs after GDK has processed
//    the configure event and the widget has its real allocated size.
//
//  The draw callback receives a typed Cairo.Context plus the widget's current
//  pixel dimensions, so you never need to query them separately.
// ─────────────────────────────────────────────────────────────────────────────

const useDrawingArea = (
  draw: (cr: giCairo.Context, w: number, h: number) => void,
  { interactive = false, expand = false }: { interactive?: boolean; expand?: boolean } = {},
) => {
  const area = new Gtk.DrawingArea()
  area.set_hexpand(expand)
  area.set_vexpand(expand)
  area.set_can_target(interactive)

  let configured = false

  area.set_draw_func((_, cr, w, h) => {
    if (!configured) {
      configured = true
      GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        area.queue_draw()
        return GLib.SOURCE_REMOVE
      })
      return
    }
    draw(cr as unknown as giCairo.Context, w, h)
  })

  return {
    widget: area,
    redraw: () => area.queue_draw(),
  }
}

export default useDrawingArea

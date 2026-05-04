import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"

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
//            content_width/content_height. Leaving expand off prevents
//            the widget from requesting "all available space" during the
//            very first GTK allocation — which happens before the
//            layer-shell configure roundtrip completes. If expand were true
//            on a sized widget, GTK would allocate the parent window at a
//            fallback geometry (~200×200 @ 0,0) and render one bad frame
//            before the compositor sends the real monitor dimensions.
//    true  → set both hexpand and vexpand. Use only when the canvas is
//            meant to fill its parent container (fullscreen overlays, etc.).
//            In those cases the parent window is sized by layer-shell anchors
//            rather than the child's size request, so the expand flag does
//            not affect the window's initial allocation.
//
//  The draw callback receives a typed Cairo.Context plus the widget's current
//  pixel dimensions, so you never need to query them separately.
// ─────────────────────────────────────────────────────────────────────────────
const useDrawingArea = (
  draw: (cr: giCairo.Context, w: number, h: number) => void,
  { interactive = false, expand = false }: { interactive?: boolean; expand?: boolean } = {},
) => {
  const area = new Gtk.DrawingArea()
  if (expand) {
    area.set_hexpand(true)
    area.set_vexpand(true)
  }
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

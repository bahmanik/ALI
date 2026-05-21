import Gtk from "gi://Gtk?version=4.0"

function safe(fn: () => void) {
  try { fn() } catch { }
}

/**
 * Fires `onChange` whenever the widget's allocated size changes.
 * Prefers WidgetPaintable::invalidate-size, falls back to a tick callback.
 */
export function watchWidgetSize(widget: Gtk.Widget, onChange: () => void) {
  let lastW = -1
  let lastH = -1

  const fireIfChanged = () => {
    const w = widget.get_width?.() ?? widget.get_allocated_width?.() ?? 0
    const h = widget.get_height?.() ?? widget.get_allocated_height?.() ?? 0
    if (w !== lastW || h !== lastH) { lastW = w; lastH = h; onChange() }
  }

  try {
    const paintable: Gtk.WidgetPaintable = Gtk.WidgetPaintable.new?.(widget) ?? new Gtk.WidgetPaintable({ widget })
    const hid = paintable.connect("invalidate-size", fireIfChanged)
    fireIfChanged()
    return () => safe(() => paintable.disconnect(hid))
  } catch {
    const tickId = widget.add_tick_callback(() => { fireIfChanged(); return true })
    fireIfChanged()
    return () => safe(() => widget.remove_tick_callback(tickId))
  }
}

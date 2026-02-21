import Gtk from "gi://Gtk?version=4.0";

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    // ignore
  }
}

/**
 * GTK4 has no ::size-allocate signal.
 * We prefer WidgetPaintable::invalidate-size, with a tick callback fallback.
 */
export function watchWidgetSize(widget: Gtk.Widget, onChange: () => void) {
  let lastW = -1;
  let lastH = -1;

  const fireIfChanged = () => {
    const w = widget.get_width?.() ?? widget.get_allocated_width?.() ?? 0;
    const h = widget.get_height?.() ?? widget.get_allocated_height?.() ?? 0;
    if (w !== lastW || h !== lastH) {
      lastW = w;
      lastH = h;
      onChange();
    }
  };

  try {
    // @ts-ignore
    const paintable: Gtk.WidgetPaintable =
      // @ts-ignore
      Gtk.WidgetPaintable.new?.(widget) ?? new Gtk.WidgetPaintable({ widget });

    const hid = paintable.connect("invalidate-size", fireIfChanged);
    // initial
    fireIfChanged();

    return () => safe(() => paintable.disconnect(hid));
  } catch {
    const tickId = widget.add_tick_callback(() => {
      fireIfChanged();
      return true;
    });

    // initial
    fireIfChanged();

    return () => safe(() => widget.remove_tick_callback(tickId));
  }
}

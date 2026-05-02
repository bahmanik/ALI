import Gtk from "gi://Gtk?version=4.0"
import GLib from "gi://GLib"
import giCairo from "cairo"

export const useRef = <T>(initial: T): { current: T } => ({ current: initial })

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

    stop() {
      active.current = false
    },
  }
}

export const useDrawingArea = (
  draw: (cr: giCairo.Context, w: number, h: number) => void,
  { interactive = false }: { interactive?: boolean } = {},
) => {
  const area = new Gtk.DrawingArea()
  area.set_hexpand(true)
  area.set_vexpand(true)
  area.set_can_target(interactive)
  area.set_draw_func((_, cr, w, h) => draw(cr as unknown as giCairo.Context, w, h))

  return {
    widget: area,
    redraw: () => area.queue_draw(),
  }
}

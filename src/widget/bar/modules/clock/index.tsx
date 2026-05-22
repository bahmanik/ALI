import GLib from "gi://GLib"
import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"
import type { BarModuleProps } from "../types"

function Clock({ vertical }: BarModuleProps) {
  const fmt = vertical.as(v => (v ? "%H\n%M\n%S" : "%H:%M:%S"))

  const time = createPoll("", 1000, () => {
    return GLib.DateTime.new_now_local().format(fmt.peek())!
  })

  return (
    <button hexpand={false} halign={Gtk.Align.CENTER}>
      <label
        label={time}
        justify={Gtk.Justification.CENTER}
        xalign={0.5}
      />
    </button>
  )
}

export default Clock

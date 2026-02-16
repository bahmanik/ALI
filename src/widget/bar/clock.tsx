import Gtk from "gi://Gtk?version=4.0"
import GLib from "gi://GLib"
import { createPoll } from "ags/time"
import { Opt } from "src/lib/options"

export default function Clock({ vertical }: { vertical: Opt<boolean> }) {
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

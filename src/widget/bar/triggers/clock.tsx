import GLib from "gi://GLib"
import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"
import type { BarTriggerProps } from "./types"

export default function ClockTrigger({ vertical }: BarTriggerProps) {
  const fmt = vertical.as(v => (v ? "%H\n%M\n%S" : "%H:%M:%S"))

  const time = createPoll("", 1000, () =>
    GLib.DateTime.new_now_local().format(fmt.peek())!
  )

  return (
    <label
      label={time}
      justify={Gtk.Justification.CENTER}
      xalign={0.5}
      halign={Gtk.Align.CENTER}
    />
  )
}

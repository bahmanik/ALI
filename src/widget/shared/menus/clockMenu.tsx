import GLib from "gi://GLib"
import { createPoll } from "ags/time"
import { Gtk } from "ags/gtk4"
import { getMenuOpt } from "./getMenuOpt"
import type { NodeId } from "./types"

/**
 * Per-instance reactive Clock menu.
 *
 * Reads format and showSeconds from their per-instance Opts on every poll
 * tick. No With nesting needed — createPoll already ticks every second, so
 * config changes are picked up within one tick (<1 s delay), which is
 * imperceptible for a clock display.
 */
export function ClockMenu({ nodeId }: { nodeId: NodeId }) {
  const formatOpt      = getMenuOpt(nodeId, "Clock", "format")
  const showSecondsOpt = getMenuOpt(nodeId, "Clock", "showSeconds")

  const time = createPoll("", 1000, () => {
    const fmt          = formatOpt.get()
    const showSec      = showSecondsOpt.get()
    const effectiveFmt = showSec ? fmt : fmt.replace(":%S", "")
    return GLib.DateTime.new_now_local().format(effectiveFmt) ?? ""
  })

  return (
    <box
      cssClasses={["clock-menu"]}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={4}
    >
      <label
        label={time}
        justify={Gtk.Justification.CENTER}
        halign={Gtk.Align.CENTER}
      />
    </box>
  )
}

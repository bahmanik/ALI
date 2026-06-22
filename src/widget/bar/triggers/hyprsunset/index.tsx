import HyprsunsetService from "src/services/hyprsunset"
import { hyprsunsetOptions } from "./options"
import { createBinding } from "gnim"
import { Gtk } from "ags/gtk4"
import type { BarTriggerProps } from "../types"

const { onIcon, offIcon, onLabel, offLabel, label } = hyprsunsetOptions

export default function HyprsunsetTrigger(_props: BarTriggerProps) {
  const sunset = HyprsunsetService.get_default()
  const enabled = createBinding(sunset, "enabled")

  const triggerIcon = enabled.as(e => e ? onIcon : offIcon)
  const triggerLabel = label ? enabled.as(e => e ? onLabel : offLabel) : null

  return (
    <box spacing={4} hexpand={false} halign={Gtk.Align.CENTER}>
      <label label={triggerIcon} cssClasses={["icon"]} />
      {triggerLabel && <label label={triggerLabel} />}
    </box>
  )
}

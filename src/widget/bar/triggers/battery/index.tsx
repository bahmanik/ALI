import AstalBattery from "gi://AstalBattery"
import { Gtk } from "ags/gtk4"
import { createBinding } from "ags"
import type { BarTriggerProps } from "../types"

export default function BatteryTrigger({ vertical }: BarTriggerProps) {
  const battery = AstalBattery.get_default()

  const percent = createBinding(battery, "percentage")((p) => `${Math.floor(p * 100)}%`)

  const contentOrientation = vertical.as(v => v ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL)
  const contentHalign = vertical.as(v => v ? Gtk.Align.CENTER : Gtk.Align.START)
  const contentSpacing = vertical.as(v => v ? 2 : 6)

  return (
    <box
      visible={createBinding(battery, "isPresent")}
      orientation={contentOrientation}
      spacing={contentSpacing}
      halign={contentHalign}
    >
      <image iconName={createBinding(battery, "iconName")} halign={Gtk.Align.CENTER} />
      <label label={percent} xalign={0.5} halign={Gtk.Align.CENTER} />
    </box>
  )
}

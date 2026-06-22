import icons from "src/lib/icons/icons"
import { Gtk } from "ags/gtk4"
import type { BarTriggerProps } from "../types"

export default function ClipboardTrigger(_props: BarTriggerProps) {
  return (
    <box>
      <image iconName={icons.ui.link} halign={Gtk.Align.CENTER} />
      <label label={"clipboard"} xalign={0.5} halign={Gtk.Align.CENTER} />
    </box>
  )
}

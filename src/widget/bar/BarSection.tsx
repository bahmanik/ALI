import Gtk from "gi://Gtk?version=4.0"

type Slot = "start" | "center" | "end"

export default function BarSection({
  slot,
  orientation,
  halign,
  valign,
  children,
}: {
  slot: Slot
  orientation: Gtk.Orientation | any
  halign?: Gtk.Align | any
  valign?: Gtk.Align | any
  children?: any
}) {
  return (
    <box
      $type={slot}
      orientation={orientation}
      halign={halign}
      valign={valign}
    >
      {children}
    </box>
  )
}

import { Gtk } from "ags/gtk4"

function Cell({ children, className }: {
  children?: any
  className?: string
}) {
  return (
    <box
      hexpand
      vexpand
      orientation={Gtk.Orientation.HORIZONTAL}
      class={`${className}`}
    >
      {children}
    </box>
  )
}

export default Cell

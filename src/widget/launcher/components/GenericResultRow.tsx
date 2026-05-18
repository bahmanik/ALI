import Pango from "gi://Pango?version=1.0"
import { Gtk } from "ags/gtk4"
import options from "src/configuration"

export function GenericResultRow({
  icon,
  title,
  subtitle,
  onActivate,
}: {
  icon: string
  title: string
  subtitle?: string
  onActivate: () => void
}) {
  const iconPx   = options.launcher.icons.app.get()
  const itemGap  = options.launcher.list.itemGap.get()
  const showDesc = Boolean(options.launcher.list.showDescription.get())

  return (
    <button hexpand cssClasses={["launcher-item"]} onClicked={onActivate} focusOnClick={false}>
      <box class="launcher-item-inner" spacing={Math.max(0, itemGap)}>
        <image iconName={icon} pixelSize={Math.max(8, iconPx)} />
        <box orientation={Gtk.Orientation.VERTICAL}>
          <label class="title" ellipsize={Pango.EllipsizeMode.END} label={title} xalign={0} />
          {showDesc && subtitle ? (
            <label class="description" ellipsize={Pango.EllipsizeMode.END} label={subtitle} xalign={0} />
          ) : (
            <box />
          )}
        </box>
      </box>
    </button>
  )
}

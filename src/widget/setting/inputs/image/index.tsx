import { Gtk } from "ags/gtk4"
import { onCleanup } from "gnim"
import { ImageInputterProps } from "../types"

function ImageInputter({ opt }: ImageInputterProps): JSX.Element {
  return (
    <box class="image-inputter" spacing={6} hexpand>
      <entry
        hexpand
        placeholderText="Image path"
        onActivate={(self) => {
          opt.set(self.text)
        }}
        $={(self) => {
          self.text = opt.get()

          const unsub = opt.subscribe(() => {
            const next = opt.get()
            if (self.text !== next) self.text = next
          })

          onCleanup(() => unsub())
        }}
      />
      <button
        label="Browse"
        valign={Gtk.Align.CENTER}
        onClicked={(self) => {
          const root = self.get_root() as Gtk.Window | null
          const dialog = Gtk.FileDialog.new()
          const filter = Gtk.FileFilter.new()
          filter.name = "Images"
          filter.add_pixbuf_formats()
          dialog.defaultFilter = filter

          void dialog.open(root, null, (dlg, result) => {
            try {
              const file = dlg.open_finish(result)
              const path = file.get_path()
              if (path) opt.set(path)
            } catch {
              // dismissed or failed
            }
          })
        }}
      />
    </box>
  )
}

export default ImageInputter

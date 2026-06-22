import Gio from "gi://Gio?version=2.0";
import Cliphist from "src/services/cliphist";
import { Gtk } from "ags/gtk4";

const clipboard = Cliphist.get_default();

const config = {
  padding: 15,
  launcher: { width: 400 },
}

export function ClipImage({
  id,
  content,
}: {
  id: string;
  content: RegExpMatchArray;
}) {
  const [width, height] = content;
  const maxWidth = config.launcher.width - config.padding * 2;
  let widthPx = (Number(width) / Number(height)) * 200;
  let heightPx: number;

  if (widthPx > maxWidth) heightPx = (200 / widthPx) * maxWidth;
  else heightPx = 200;

  return (
    <button
      cssClasses={["launcher-button", "clipbutton", "image-content"]}
      heightRequest={heightPx}
      hexpand
      onClicked={() => {
        clipboard.copy(id);
      }}
      focusOnClick={false}
    >
      <Gtk.Picture
        halign={Gtk.Align.START}
        $={async (self) => {
          const image = await clipboard.load_image(id);
          if (image) self.set_file(Gio.file_new_for_path(image));
        }}
      />
    </button>
  );
}

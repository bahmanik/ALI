import Pango from "gi://Pango?version=1.0";
import { Gtk } from "ags/gtk4";
import Cliphist from "src/services/cliphist";
const clipboard = Cliphist.get_default();

export function ClipText({ id, content }: { id: string; content: string }) {
  return (
    <button
      cssClasses={["launcher-button", "clipbutton", "text-content"]}
      onClicked={() => {
        clipboard.copy(id);
        //hide_all_windows();
      }}
      focusOnClick={false}
    >
      <label
        hexpand
        class={"name"}
        maxWidthChars={35}
        ellipsize={Pango.EllipsizeMode.END}
        halign={Gtk.Align.START}
        label={content}
      />
    </button>
  );
}

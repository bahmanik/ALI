import icons from 'src/lib/icons/icons';
import options from 'src/configuration';
import { Gtk } from 'ags/gtk4';
import app from 'ags/gtk4/app';

export const Header = (): JSX.Element => {
  return (
    <centerbox class="header">
      <button
        $type="start"
        class="reset"
        onClicked={() => {
          options.reset();
        }}
        tooltipText={'Reset All Settings'}
        halign={Gtk.Align.START}
        valign={Gtk.Align.START}
      >
        <image iconName={icons.ui.refresh} pixelSize={20} />
      </button>
      <button
        $type="end"
        class="close"
        halign={Gtk.Align.END}
        valign={Gtk.Align.START}
        onClicked={() => {
          app.get_window('setting')?.set_visible(false);
        }}
      >
        <image iconName={icons.ui.close} pixelSize={20} />
      </button>
    </centerbox >
  );
};

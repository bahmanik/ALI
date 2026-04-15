import { Gtk } from "ags/gtk4";
import Dashboard from "./dashboard";

function SettingWindow() {
  return (
    <Gtk.Window
      visible={true}
      name={'test'}
      title={'settings'}
      $={(self) => {
        self.connect('destroy', () => {
          self.hide();
          return true;
        });
        self.set_default_size(200, 300);
      }}
    >
      <Dashboard />
    </Gtk.Window>
  )
}

export default SettingWindow

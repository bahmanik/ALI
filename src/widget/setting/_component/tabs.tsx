import { Gtk } from "ags/gtk4";
import { Setter } from "gnim";
import { SettingPage, settingPages } from "../pages";

//WARNING: there is bug that you should first select Global so stack child can be changed
const Tabs = ({ setPage }: { setPage: Setter<SettingPage> }) => {
  const settingPageNames = Object.keys(settingPages) as SettingPage[]

  return (
    <box halign={Gtk.Align.CENTER} hexpand>
      {settingPageNames.map(setting => (
        <button
          label={setting}
          onClicked={() => {
            console.log(`attempting change page to ${setting}`)
            setPage(setting);
          }}
          halign={Gtk.Align.CENTER}
        />
      ))}
    </box>
  )
}

export default Tabs

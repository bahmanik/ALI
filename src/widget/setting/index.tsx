import { Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { WindowTitle } from "./_component/windowTitle";
import { createState } from "gnim";
import PageContent from "./_component/pageContent";
import Tabs from "./_component/tabs";
import { SettingPage } from "./pages";

function SettingWindow() {
  const [page, setPage] = createState<SettingPage>("Global")

  return (
    <Gtk.Window
      name="setting"
      application={app}
      title={'settings'}
    >
      <box orientation={Gtk.Orientation.VERTICAL}>
        <WindowTitle />
        <Tabs setPage={setPage} />
        <PageContent page={page} />
      </box>
    </Gtk.Window>
  )
}

export default SettingWindow

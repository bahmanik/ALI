import { Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { Header } from "./_component/header";
import { createState } from "gnim";
import PageContent from "./_component/pageContent";
import Tabs from "./_component/tabs";
import { SettingPage } from "./pages";

function SettingWindow() {
  const [page, setPage] = createState<SettingPage>("Dashboard")

  return (
    <Gtk.Window
      name="setting"
      application={app}
      title={'settings'}
    >
      <box orientation={Gtk.Orientation.VERTICAL}>
        <Header />
        <Tabs setPage={setPage} />
        <PageContent page={page} />
      </box>
    </Gtk.Window>
  )
}

export default SettingWindow

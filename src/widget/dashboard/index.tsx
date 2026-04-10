import { Astal, Gdk } from "ags/gtk4"
import Frame from "./frame";

const FULL_ANCHOR: Astal.WindowAnchor =
  Astal.WindowAnchor.TOP |
  Astal.WindowAnchor.BOTTOM |
  Astal.WindowAnchor.LEFT |
  Astal.WindowAnchor.RIGHT;

function DashboardWindows(gdkmonitor: Gdk.Monitor) {
  return (
    <window
      name={"dashboard"}
      namespace={"Dashboard"}
      class={`dashboard`}
      gdkmonitor={gdkmonitor}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.NONE}
      visible={true}
      anchor={FULL_ANCHOR}
      css="background-color: transparent;"
    >
      <Frame />
    </window>
  )
}

export default DashboardWindows

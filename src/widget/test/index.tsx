import { Astal, Gdk } from "ags/gtk4"
import { createState } from "gnim";
import FusedRect from "./adaptiveRect";

const FULL_ANCHOR: Astal.WindowAnchor =
  Astal.WindowAnchor.TOP |
  Astal.WindowAnchor.BOTTOM |
  Astal.WindowAnchor.LEFT |
  Astal.WindowAnchor.RIGHT;

function TestWindow(gdkmonitor: Gdk.Monitor) {
  const history = createState<number[]>([])

  // simulate incoming data
  setInterval(() => {
    history[1](prev => {
      const next = [...prev, Math.random()]
      return next.slice(-50) // keep last 50 points
    })
  }, 1000)

  return (
    <window
      name={"test"}
      namespace={"Test"}
      class={`test`}
      gdkmonitor={gdkmonitor}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.NONE}
      visible={true}
      anchor={FULL_ANCHOR}
    // css="background-color: black;"
    >
    </window>
  )
}

export default TestWindow

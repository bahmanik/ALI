import options from "src/configuration"
import { Accessor } from "gnim"
import { Gtk } from "ags/gtk4"
import Inputter from "../../inputs"

type GlobalProps = JSX.IntrinsicElements["box"]

const Global = (props: GlobalProps) => {
  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      {...props}
    >
      <Inputter opt={options.global.scale} min={1} max={100} increment={1} />
    </box>
  )
}

export default Global

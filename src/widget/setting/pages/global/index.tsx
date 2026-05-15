import options from "src/configuration"
import { Accessor } from "gnim"
import { Gtk } from "ags/gtk4"
import { Option } from "../../_component/option"

type GlobalProps = JSX.IntrinsicElements["box"]

const Global = (props: GlobalProps) => {
  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      {...props}
    >
      <Option type="number" title="scale" opt={options.global.scale} min={1} max={100} increment={1} />
    </box>
  )
}

export default Global

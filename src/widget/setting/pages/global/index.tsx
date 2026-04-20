import options from "src/configuration"
import { NumberInputter } from "../../optSetters/number"
import { Accessor } from "gnim"
import { Gtk } from "ags/gtk4"
import { StringInputter } from "../../optSetters/string"
import { BooleanInputter } from "../../optSetters/boolean"
import { ColorInputter } from "../../optSetters/color"
import { EnumInputter } from "../../optSetters/enum"
import { FloatInputter } from "../../optSetters/float"

type GlobalProps = JSX.IntrinsicElements["box"]

const Global = (props: GlobalProps) => {
  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      {...props}
    >
      <NumberInputter opt={options.global.scale} min={1} max={100} increment={1} />
      <StringInputter opt={options.global.stringTest} />
      <BooleanInputter opt={options.global.booleanTest} />
      <ColorInputter opt={options.global.colorTest} />
      <EnumInputter opt={options.global.enumTest} values={["test1", "test2", "test3"]} />
      <FloatInputter opt={options.global.floatTest} />
    </box>
  )
}

export default Global

import BooleanInputter from "./boolean";
import NumberInputter from "./number";
import StringInputter from "./string";
import ColorInputter from "./color";
import FloatInputter from "./float";
import ImageInputter from "./image";
import EnumInputter from "./enum";
import { Accessor, createState } from "gnim";
import { InputterProps } from "./types";
import { Gtk } from "ags/gtk4";

function Inputter<T extends string | number | boolean | object>({
  opt,
  type = typeof opt.get() as InputterProps<T>['type'],
  enums = [],
  min = 0,
  max = 1000000,
  increment = 1,
}: InputterProps<T>): JSX.Element {
  const [isUnsaved, setIsUnsaved] = createState(false)

  const renderInput = () => {
    switch (type) {
      case 'number':
        return (
          <NumberInputter
            opt={opt}
            min={min}
            max={max}
            increment={increment}
            isUnsaved={isUnsaved}
            setIsUnsaved={setIsUnsaved}
          />
        )

      case 'float':
        return <FloatInputter opt={opt} isUnsaved={isUnsaved} setIsUnsaved={setIsUnsaved} />

      case 'string':
        return <StringInputter opt={opt} isUnsaved={isUnsaved} setIsUnsaved={setIsUnsaved} />

      case 'enum':
        return <EnumInputter opt={opt} values={enums} />

      case 'boolean':
        return <BooleanInputter opt={opt} />

      case 'img':
        return <ImageInputter opt={opt} />

      case 'color':
        return <ColorInputter opt={opt} />

      default:
        return <label label={`No setter with type ${type}`} />
    }
  }

  return (
    <box class="inputter-container" valign={Gtk.Align.START} halign={Gtk.Align.END}>
      {renderInput()}
    </box>
  )
}

export default Inputter

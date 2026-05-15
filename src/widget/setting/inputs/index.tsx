import { Gtk } from "ags/gtk4";
import BooleanInputter from "./boolean";
import NumberInputter from "./number";
import StringInputter from "./string";
import ColorInputter from "./color";
import FloatInputter from "./float";
import ImageInputter from "./image";
import EnumInputter from "./enum";
import KeybindInputter from "./keybind";
import { InputterProps } from "./types";

function Inputter(props: InputterProps): JSX.Element {
  const renderInput = () => {
    switch (props.type) {
      case 'number':
        return (
          <NumberInputter
            opt={props.opt}
            min={props.min ?? 0}
            max={props.max ?? 100}
            increment={props.increment ?? 1}
          />
        );
      case 'float':
        return <FloatInputter opt={props.opt} />
      case 'string':
        return <StringInputter opt={props.opt} />
      case 'enum':
        return <EnumInputter opt={props.opt} values={props.values ?? []} />;
      case 'boolean':
        return <BooleanInputter opt={props.opt} />;
      case 'image':
        return <ImageInputter opt={props.opt} />;
      case 'color':
        return <ColorInputter opt={props.opt} />;
      case 'keybind':
        return <KeybindInputter opt={props.opt} />;
    }
  }

  return (
    <box
      class="inputter-container"
      valign={Gtk.Align.START}
      halign={Gtk.Align.END}
    >
      {renderInput()}
    </box>
  )
}

export default Inputter

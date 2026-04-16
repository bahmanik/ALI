import AstalHyprland from "gi://AstalHyprland?version=0.1";
import { getKeyboardLayout, getLayoutShortName } from "./helpers";
import { createState } from "gnim";
import { options } from "./options";

const hyprland = AstalHyprland.get_default();

//WARNING: fix the type bug 
//and also find better name for getlayout 
//and use create computed to write a better state variable 
//and wire code and layout name switch with options
function getLayout(): string {
  try {
    const devices = hyprland.message('j/devices');
    return getKeyboardLayout(devices, options.labelType);
  } catch (error) {
    console.error(error);
  }
}

function KbLayout() {
  const [layoutName, setLayoutName] = createState<string>(getLayout())
  return (
    <box
      $={() => {
        hyprland.connect("keyboard-layout",
          (_, __, kblayout) => {
            setLayoutName(kblayout)
          },
        )
      }}
    >
      <label label={layoutName} />
    </box>
  )
}

export default KbLayout

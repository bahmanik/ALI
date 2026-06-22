import AstalHyprland from "gi://AstalHyprland?version=0.1"
import { getKeyboardLayout } from "./helpers"
import { createState } from "gnim"
import { options } from "./options"
import type { BarTriggerProps } from "../types"

const hyprland = AstalHyprland.get_default()

function getLayout(): string {
  try {
    const devices = hyprland.message("j/devices")
    return getKeyboardLayout(devices, options.labelType)
  } catch (error) {
    console.error(error)
  }
}

export default function KbLayoutTrigger(_props: BarTriggerProps) {
  const [layoutName, setLayoutName] = createState<string>(getLayout())

  return (
    <box
      $={() => {
        hyprland.connect("keyboard-layout", (_, __, kblayout) => {
          setLayoutName(kblayout)
        })
      }}
    >
      <label label={layoutName} />
    </box>
  )
}

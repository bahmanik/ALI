import AstalNetwork from "gi://AstalNetwork"
import { With, createBinding } from "ags"
import type { BarTriggerProps } from "../types"

export default function WirelessTrigger(_props: BarTriggerProps) {
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")

  return (
    <box visible={wifi(Boolean)}>
      <With value={wifi}>
        {(wifi) =>
          wifi && <image iconName={createBinding(wifi, "iconName")} />
        }
      </With>
    </box>
  )
}

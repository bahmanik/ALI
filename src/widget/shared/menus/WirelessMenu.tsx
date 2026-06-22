import AstalNetwork from "gi://AstalNetwork"
import { Gtk } from "ags/gtk4"
import { For, createBinding } from "ags"
import { execAsync } from "ags/process"

async function connect(ap: AstalNetwork.AccessPoint) {
  try {
    await execAsync(`nmcli d wifi connect ${ap.bssid}`)
  } catch (error) {
    console.error(error)
  }
}

function sortedPoints(arr: Array<AstalNetwork.AccessPoint>) {
  return arr.filter((ap) => !!ap.ssid).sort((a, b) => b.strength - a.strength)
}

/**
 * Pure UI content for the Wireless popover.
 *
 * Requires a connected `AstalNetwork.Wifi` instance to be passed in.
 * No `<menubutton>`, no `<popover>` wrapper.
 */
export function WirelessMenu({ wifi }: { wifi: AstalNetwork.Wifi }) {
  return (
    <box orientation={Gtk.Orientation.VERTICAL}>
      <For each={createBinding(wifi, "accessPoints")(sortedPoints)}>
        {(ap: AstalNetwork.AccessPoint) => (
          <button onClicked={() => connect(ap)}>
            <box spacing={4}>
              <image iconName={createBinding(ap, "iconName")} />
              <label label={createBinding(ap, "ssid")} />
              <image
                iconName="object-select-symbolic"
                visible={createBinding(wifi, "activeAccessPoint")((active) => active === ap)}
              />
            </box>
          </button>
        )}
      </For>
    </box>
  )
}

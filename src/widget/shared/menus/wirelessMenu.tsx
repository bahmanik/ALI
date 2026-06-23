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

function sortedPoints(arr: AstalNetwork.AccessPoint[]) {
  return [...arr]
    .filter((ap) => !!ap.ssid)
    .sort((a, b) => b.strength - a.strength)
}

/**
 * Pure UI content for the Wireless popover.
 *
 * Requires a connected `AstalNetwork.Wifi` instance to be passed in.
 * No `<menubutton>`, no `<popover>` wrapper.
 */
export function WirelessMenu() {
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")

  const accessPoints = wifi.as((wifi) =>
    wifi ? sortedPoints(wifi.accessPoints) : []
  )

  const activeBssid = wifi.as((wifi) => wifi?.activeAccessPoint?.bssid ?? "")

  return (
    <box orientation={Gtk.Orientation.VERTICAL}>
      <For each={accessPoints}>
        {(ap: AstalNetwork.AccessPoint) => (
          <button onClicked={() => connect(ap)}>
            <box spacing={4}>
              <image iconName={createBinding(ap, "iconName")} />
              <label label={createBinding(ap, "ssid")} />
              <image
                iconName="object-select-symbolic"
                visible={activeBssid.as((bssid) => bssid === ap.bssid)}
              />
            </box>
          </button>
        )}
      </For>
    </box>
  )
}

import HyprsunsetService from "src/services/hyprsunset"
import { createBinding } from "gnim"
import { Gtk } from "ags/gtk4"

type HyprsunsetMenuProps = {
  /**
   * Temperature (in Kelvin) to use when enabling hyprsunset for the first time.
   * Defaults to 3000 K. The slider always reflects and writes the service's
   * live temperature value directly.
   */
  defaultTemperature?: number
}

/**
 * Pure UI content for the Hyprsunset popover.
 *
 * No `<menubutton>`, no `<popover>` wrapper — drop this inside any container.
 * The caller (trigger) is responsible for wrapping it in a popover.
 */
export function HyprsunsetMenu({ defaultTemperature = 3000 }: HyprsunsetMenuProps = {}) {
  const sunset = HyprsunsetService.get_default()
  const enabled = createBinding(sunset, "enabled")

  const toggleEnabled = () => {
    if (sunset.enabled) {
      sunset.disable()
    } else {
      // Use the service's current temperature if set, otherwise fall back to
      // the caller-supplied default.
      sunset.enable(sunset.temperature || defaultTemperature)
    }
  }

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
      <button onClicked={toggleEnabled}>
        <label label={enabled.as(e => e ? "Disable" : "Enable")} />
      </button>
      <slider
        min={1000}
        max={12000}
        value={createBinding(sunset, "temperature")}
        onChangeValue={({ value }) => { sunset.temperature = value }}
        hexpand
      />
    </box>
  )
}

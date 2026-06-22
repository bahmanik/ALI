import { Gtk } from "ags/gtk4"
import AstalPowerProfiles from "gi://AstalPowerProfiles"

/**
 * Pure UI content for the Battery / Power Profiles popover.
 *
 * No `<menubutton>`, no `<popover>` wrapper — drop this inside any container.
 */
export function BatteryMenu() {
  const powerprofiles = AstalPowerProfiles.get_default()

  const setProfile = (profile: string) => {
    powerprofiles.set_active_profile(profile)
  }

  return (
    <box orientation={Gtk.Orientation.VERTICAL}>
      {powerprofiles.get_profiles().map(({ profile }) => (
        <button onClicked={() => setProfile(profile)}>
          <label label={profile} xalign={0} />
        </button>
      ))}
    </box>
  )
}

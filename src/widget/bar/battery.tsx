import Gtk from "gi://Gtk?version=4.0"
import AstalBattery from "gi://AstalBattery"
import AstalPowerProfiles from "gi://AstalPowerProfiles"
import { createBinding } from "ags"
import { Opt } from "src/lib/options"

export default function Battery({ vertical }: { vertical: Opt<boolean> }) {
  const v = vertical.get()
  const battery = AstalBattery.get_default()
  const powerprofiles = AstalPowerProfiles.get_default()

  const percent = createBinding(battery, "percentage")((p) => `${Math.floor(p * 100)}%`)

  const setProfile = (profile: string) => {
    powerprofiles.set_active_profile(profile)
  }

  const contentOrientation = v ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL
  const contentHalign = v ? Gtk.Align.CENTER : Gtk.Align.START

  return (
    <menubutton visible={createBinding(battery, "isPresent")} hexpand={false} halign={Gtk.Align.CENTER}>
      <box
        orientation={contentOrientation}
        spacing={v ? 2 : 6}
        halign={contentHalign}
      >
        <image iconName={createBinding(battery, "iconName")} halign={Gtk.Align.CENTER} />
        <label label={percent} xalign={0.5} halign={Gtk.Align.CENTER} />
      </box>

      <popover>
        <box orientation={Gtk.Orientation.VERTICAL}>
          {powerprofiles.get_profiles().map(({ profile }) => (
            <button onClicked={() => setProfile(profile)}>
              <label label={profile} xalign={0} />
            </button>
          ))}
        </box>
      </popover>
    </menubutton>
  )
}

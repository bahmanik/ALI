import AstalBattery from "gi://AstalBattery"
import AstalPowerProfiles from "gi://AstalPowerProfiles"
import { Gtk } from "ags/gtk4"
import { createBinding } from "ags"
import type { Opt } from "src/lib/options"

export default function Battery({ vertical }: { vertical: Opt<boolean> }) {
  const battery = AstalBattery.get_default()
  const powerprofiles = AstalPowerProfiles.get_default()

  const percent = createBinding(battery, "percentage")((p) => `${Math.floor(p * 100)}%`)

  const setProfile = (profile: string) => {
    powerprofiles.set_active_profile(profile)
  }

  const contentOrientation = vertical.as(v => v ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL)
  const contentHalign = vertical.as(v => v ? Gtk.Align.CENTER : Gtk.Align.START)
  const contentSpacing = vertical.as(v => v ? 2 : 6)

  return (
    <menubutton visible={createBinding(battery, "isPresent")} hexpand={false} halign={Gtk.Align.CENTER}>
      <box
        orientation={contentOrientation}
        spacing={contentSpacing}
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

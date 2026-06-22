import AstalMpris from "gi://AstalMpris"
import AstalApps from "gi://AstalApps"
import { For, createBinding } from "ags"
import type { BarTriggerProps } from "../types"

const mpris = AstalMpris.get_default()
const apps = new AstalApps.Apps()

export default function MediaTrigger(_props: BarTriggerProps) {
  const players = createBinding(mpris, "players")

  return (
    <box>
      <For each={players}>
        {(player) => {
          const [app] = apps.exact_query(player.entry)
          return <image visible={!!app.iconName} iconName={app?.iconName} />
        }}
      </For>
    </box>
  )
}

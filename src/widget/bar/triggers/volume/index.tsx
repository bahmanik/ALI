import AstalWp from "gi://AstalWp"
import { createBinding } from "ags"
import type { BarTriggerProps } from "../types"

export default function VolumeTrigger(_props: BarTriggerProps) {
  const { defaultSpeaker: speaker } = AstalWp.get_default()!
  return <image iconName={createBinding(speaker, "volumeIcon")} />
}

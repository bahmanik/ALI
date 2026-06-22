import { createPoll } from "ags/time"
import { RamObserver } from "src/lib/observers/ram"
import type { BarTriggerProps } from "./types"

export default function RamTrigger(_props: BarTriggerProps) {
  const ram = new RamObserver()
  const labelBinding = createPoll(0, 1000, () => ram.getRamUsage().percentage)

  return (
    <box>
      <label label={labelBinding(String)} />
    </box>
  )
}

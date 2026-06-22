import { createPoll } from "ags/time"
import { CpuTempObserver } from "src/lib/observers/cputemp"
import type { BarTriggerProps } from "./types"

export default function CpuTempTrigger(_props: BarTriggerProps) {
  const cpu = new CpuTempObserver()
  const labelBinding = createPoll(0, 1000, () => cpu.getCpuTemp())

  return (
    <box>
      <label label={labelBinding(String)} />
    </box>
  )
}

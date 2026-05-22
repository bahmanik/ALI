import { createPoll } from "ags/time"
import { CpuTempObserver } from "src/lib/observers/cputemp"
import type { BarModuleProps } from "../types"

function CpuTemp(_props: BarModuleProps) {
  const cpu = new CpuTempObserver()
  const labelBinding = createPoll(0, 1000, () => cpu.getCpuTemp())

  return (
    <box>
      <label label={labelBinding(String)} />
    </box>
  )
}

export default CpuTemp

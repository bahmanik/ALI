import { createPoll } from "ags/time"
import { Gtk } from "ags/gtk4"
import { createState } from "gnim"
import { CpuObserver } from "src/lib/observers/cpu"
import { CircularProgress } from "src/widget/shared/circularProgress"
import { LineGraph } from "src/widget/shared/lineGraph"
import options from "src/configuration"
import type { BarModuleProps } from "../types"

const { cpu } = options.bar.modules

function renderCpuLabel(percentage: number, round: boolean): string {
  const value = round ? Math.round(percentage) : parseFloat(percentage.toFixed(2))
  return `${value}%`
}

function Cpu(_props: BarModuleProps) {
  const observer = new CpuObserver()

  const cpuUsage = createPoll(0, cpu.pollingInterval.value, () =>
    observer.getCpuUsage(),
  )

  const normalised = cpuUsage((raw) => raw / 100)

  const [history, setHistory] = createState<number[]>([])
  cpuUsage((raw) => {
    const next = [...history.peek(), raw / 100]
    const maxLen = cpu.graphHistory.value
    setHistory(next.length > maxLen ? next.slice(next.length - maxLen) : next)
  })

  const ring = CircularProgress({ value: normalised, options: cpu.ring })
  const graph = LineGraph({ values: [history, setHistory], options: cpu.graph })

  return (
    <box
      cssClasses={["cpu-module"]}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={4}
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      visible={cpu.enable.value}
    >
      <box spacing={4} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
        <label label={cpu.icon.value} visible={cpu.icon.as(v => v !== "")} cssClasses={["cpu-icon"]} />
        {ring}
        <label label={cpuUsage(raw => renderCpuLabel(raw, cpu.round.value))} visible={cpu.label.value} />
      </box>
      <box visible={cpu.showGraph.as(Boolean)}>
        {graph}
      </box>
    </box>
  )
}

export default Cpu

import { Gtk } from "ags/gtk4"
import options from "src/configuration"
import { Option } from "../../_component/option"
import { CircularProgressSetting } from "../../_component/circularProgressSetting"
import { Header } from "../../_component/header"
import { LineGraphSetting } from "../../_component/lineGraphSetting"

type BarProps = JSX.IntrinsicElements["box"]

const Bar = (props: BarProps) => {
  const { style, buttons, modules } = options.bar

  return (
    <box orientation={Gtk.Orientation.VERTICAL} {...props}>
      {/* ── Layout ──────────────────────────────────────────────────────── */}
      <Header title="Layout" />
      <Option
        title="Position"
        subtitle="Which screen edge the bar sits on"
        opt={options.bar.position}
        type="enum"
        values={["top", "bottom", "left", "right"]}
      />

      {/* ── Style ───────────────────────────────────────────────────────── */}
      <Header title="Style" />
      <Option title="Floating" subtitle="Detach the bar from the screen edge" opt={style.floating} type="boolean" />
      <Option title="Transparent" subtitle="Remove the background fill" opt={style.transparent} type="boolean" />
      <Option title="Background" subtitle="Bar background colour" opt={style.bg} type="color" />
      <Option title="BG opacity" subtitle="Background opacity (0–100)" opt={style.bgOpacity} type="number" min={0} max={100} increment={1} />
      <Option title="Height" subtitle="Bar height in px" opt={style.height} type="number" min={16} max={120} increment={1} />
      <Option title="Radius" subtitle="Corner radius in px" opt={style.radius} type="number" min={0} max={60} increment={1} />
      <Option title="Padding X" subtitle="Horizontal internal padding" opt={style.paddingX} type="number" min={0} max={60} increment={1} />
      <Option title="Padding Y" subtitle="Vertical internal padding" opt={style.paddingY} type="number" min={0} max={60} increment={1} />
      <Option title="Margin top" subtitle="Gap above bar (px)" opt={style.marginTop} type="number" min={0} max={60} increment={1} />
      <Option title="Margin bottom" subtitle="Gap below bar (px)" opt={style.marginBottom} type="number" min={0} max={60} increment={1} />
      <Option title="Margin sides" subtitle="Left/right gap (px)" opt={style.marginSides} type="number" min={0} max={60} increment={1} />

      {/* ── Border ──────────────────────────────────────────────────────── */}
      <Header title="Border" />
      <Option title="Enable border" subtitle="Draw a border around the bar" opt={style.borderEnable} type="boolean" />
      <Option title="Border location" subtitle="Which sides show the border" opt={style.borderLocation} type="enum" values={["full", "top", "bottom", "left", "right"]} />
      <Option title="Border width" subtitle="Border thickness in px" opt={style.borderWidth} type="number" min={1} max={16} increment={1} />
      <Option title="Border colour" subtitle="Border colour" opt={style.borderColor} type="color" />

      {/* ── Shadow ──────────────────────────────────────────────────────── */}
      <Header title="Shadow" />
      <Option title="Enable shadow" subtitle="Drop shadow beneath the bar" opt={style.shadowEnable} type="boolean" />
      <Option title="Shadow margin" subtitle="Shadow margin offset (px)" opt={style.shadowMargin} type="number" min={0} max={40} increment={1} />
      <Option title="Shadow X" subtitle="Horizontal shadow offset (px)" opt={style.shadowX} type="number" min={-40} max={40} increment={1} />
      <Option title="Shadow Y" subtitle="Vertical shadow offset (px)" opt={style.shadowY} type="number" min={-40} max={40} increment={1} />
      <Option title="Shadow blur" subtitle="Blur radius (px)" opt={style.shadowBlur} type="number" min={0} max={80} increment={1} />
      <Option title="Shadow spread" subtitle="Spread radius (px)" opt={style.shadowSpread} type="number" min={0} max={40} increment={1} />

      {/* ── Buttons ─────────────────────────────────────────────────────── */}
      <Header title="Buttons" />
      <Option title="Button BG" subtitle="Button background colour" opt={buttons.bg} type="color" />
      <Option title="Button BG opacity" subtitle="Background opacity (0–100)" opt={buttons.bgOpacity} type="number" min={0} max={100} increment={1} />
      <Option title="Button hover opacity" subtitle="Hover opacity (0–100)" opt={buttons.bgHoverOpacity} type="number" min={0} max={100} increment={1} />
      <Option title="Button radius" subtitle="Corner radius (px)" opt={buttons.radius} type="number" min={0} max={40} increment={1} />
      <Option title="Button spacing" subtitle="Gap between buttons (px)" opt={buttons.spacing} type="number" min={0} max={40} increment={1} />
      <Option title="Button padding X" subtitle="Horizontal padding (px)" opt={buttons.paddingX} type="number" min={0} max={40} increment={1} />
      <Option title="Button padding Y" subtitle="Vertical padding (px)" opt={buttons.paddingY} type="number" min={0} max={40} increment={1} />

      {/* ── CPU module ──────────────────────────────────────────────────── */}
      <Header title="CPU" />
      <Option title="Enable" subtitle="Show the CPU module in the bar" opt={modules.cpu.enable} type="boolean" />
      <Option title="Polling interval" subtitle="Usage sample interval (ms)" opt={modules.cpu.pollingInterval} type="number" min={200} max={10000} increment={100} />
      <Option title="Show label" subtitle="Text label next to the ring" opt={modules.cpu.label} type="boolean" />
      <Option title="Label type" subtitle="What the label displays" opt={modules.cpu.labelType} type="enum" values={["percentage", "used", "used/total", "free"]} />
      <Option title="Icon" subtitle="Nerd Font glyph" opt={modules.cpu.icon} type="string" />
      <Option title="Round value" subtitle="Round percentage to integer" opt={modules.cpu.round} type="boolean" />
      <Option title="Show graph" subtitle="Show line graph below ring" opt={modules.cpu.showGraph} type="boolean" />
      <Option title="Graph history" subtitle="Samples to keep in buffer" opt={modules.cpu.graphHistory} type="number" min={10} max={300} increment={10} />
      {/* ring and graph use their own sub-option trees */}
      <CircularProgressSetting label="CPU ring appearance" options={modules.cpu.ring} />
      <LineGraphSetting label="CPU graph appearance" options={modules.cpu.graph} />
    </box>
  )
}

export default Bar

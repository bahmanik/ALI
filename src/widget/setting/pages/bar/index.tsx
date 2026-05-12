import { Gtk } from "ags/gtk4"
import options from "src/configuration"
import { Option } from "../../_component/option"
import { CircularProgressSetting } from "../../_component/circularProgressSetting"
import { Header } from "../../_component/header"
import { LineGraphSetting } from "../../_component/lineGraphSetting"
import { AssetSetting } from "../../_component/assetSetting"

type BarProps = JSX.IntrinsicElements["box"]

const Bar = (props: BarProps) => {
  const { style, buttons, modules, corner } = options.bar

  return (
    <box orientation={Gtk.Orientation.VERTICAL} {...props}>
      <button
        onClicked={() => {
          corner.background.set({
            kind: "solid",
            color: "#ff0000",
            opacity: 100,
          });
        }}
      >
        Set Background to Red
      </button>
      {/* ── Corner ─────────────────────────────────────────────────────── */}
      <Header title="Corner" />
      <Option title="Enable" subtitle="Show the corner background layer" opt={corner.enable} type="boolean" />
      <Option title="Gap" subtitle="Inset gap from monitor edges" opt={corner.gap} type="number" min={0} max={80} increment={1} />
      <Option title="Edge" subtitle="Corner edge thickness in px" opt={corner.edge} type="number" min={0} max={80} increment={1} />
      <Option title="Radius" subtitle="Corner cut radius in px" opt={corner.radius} type="number" min={0} max={80} increment={1} />
      <AssetSetting label="Corner background" asset={corner.background} />
    </box>
  )
}

export default Bar

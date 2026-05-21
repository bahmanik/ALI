import { Gtk } from "ags/gtk4"
import app from "ags/gtk4/app"
import { For } from "ags"
import { createState } from "gnim"
import options from "src/configuration"
import { Option } from "../../_component/option"
import { Header } from "../../_component/header"
import { AssetSetting } from "../../_component/assetSetting"
import { LayoutEditor } from "./BarLayoutEditor"
import type { BarSlotLayout } from "src/configuration/widgets/bar/type"

type BarProps = JSX.IntrinsicElements["box"]

// ─── MonitorLayouts ────────────────────────────────────────────────────────────

function MonitorLayouts() {
  const { defaultLayout, monitorLayouts } = options.bar.modules

  const [defaultLyt, setDefaultLyt] = createState<BarSlotLayout>(defaultLayout.get())
  const [perMonitor, setPerMonitor] = createState<Record<string, BarSlotLayout>>(monitorLayouts.get())

  const connectors: string[] = (app.get_monitors?.() ?? []).map((m: any) => m.connector as string)

  const saveDefault = (l: BarSlotLayout) => {
    defaultLayout.set(l)
    setDefaultLyt(l)
  }

  const saveMonitor = (connector: string, l: BarSlotLayout) => {
    const next = { ...perMonitor.peek(), [connector]: l }
    monitorLayouts.set(next)
    setPerMonitor(next)
  }

  if (connectors.length === 0) {
    return <label class="options-sublabel" label="No monitors detected." xalign={0} />
  }

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={16}>
      <For each={defaultLyt}>
        {(def: BarSlotLayout) => (
          <LayoutEditor
            label="Default layout"
            layout={def}
            onChange={saveDefault}
          />
        )}
      </For>

      <For each={perMonitor}>
        {(layouts: Record<string, BarSlotLayout>) => (
          <box orientation={Gtk.Orientation.VERTICAL} spacing={16}>
            {connectors.map((connector) => (
              <LayoutEditor
                label={`Monitor: ${connector}`}
                layout={layouts[connector] ?? defaultLayout.get()}
                onChange={(l) => saveMonitor(connector, l)}
              />
            ))}
          </box>
        )}
      </For>
    </box>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

const Bar = (props: BarProps) => {
  const { corner, modules } = options.bar

  return (
    <box orientation={Gtk.Orientation.VERTICAL} {...props}>
    </box>
  )
}

export default Bar

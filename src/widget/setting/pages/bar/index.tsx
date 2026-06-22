import { Gtk } from "ags/gtk4"
import app from "ags/gtk4/app"
import { With } from "ags"
import { createState } from "gnim"
import options from "src/configuration"
import { Option } from "../../_component/option"
import { Header } from "../../_component/header"
import { AssetSetting } from "../../_component/assetSetting"
import { LayoutEditor } from "./BarLayoutEditor"
import type { BarSlotLayout } from "src/configuration/widgets/bar/type"

type BarProps = JSX.IntrinsicElements["box"]

// ─── MonitorLayouts ────────────────────────────────────────────────────────────

/**
 * Renders the layout editors for all connected monitors.
 *
 * - Always shows a "Default layout" editor bound to `options.bar.modules.defaultLayout`.
 * - When `mirrorFirstMonitor` is OFF, also shows one `LayoutEditor` per connected
 *   monitor connector, each bound to its entry in `monitorLayouts`.
 * - Local state shadows the opts so edits are immediately reflected in the UI
 *   while the opt handles persistence to disk.
 */
function MonitorLayouts() {
  const { defaultLayout, monitorLayouts, mirrorFirstMonitor } = options.bar.modules

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

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={16}>
      {/*
        With re-renders LayoutEditor whenever defaultLyt changes so that the
        internal event handlers always close over the latest layout value.
      */}
      <With value={defaultLyt}>
        {(def) => (
          <LayoutEditor
            label="Default layout"
            layout={def}
            onChange={saveDefault}
          />
        )}
      </With>

      {/*
        Per-monitor overrides. Use a GTK `visible` binding to show/hide the
        section reactively — avoids nesting a Fragment (With) inside another
        Fragment's render output, which AGS does not support.
        The With for perMonitor lives inside a real <box>, not inside another With.
      */}
      {connectors.length > 0 && (
        <box
          visible={mirrorFirstMonitor.as((m) => !m)}
          orientation={Gtk.Orientation.VERTICAL}
          spacing={16}
        >
          <With value={perMonitor}>
            {(layouts) => (
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
          </With>
        </box>
      )}
    </box>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

const Bar = (props: BarProps) => {
  const { corner, modules } = options.bar

  return (
    <box orientation={Gtk.Orientation.VERTICAL} {...props}>
      <Header title="Module Layout" />
      <Option
        title="Mirror first monitor"
        subtitle="All bars display the first connected monitor's layout"
        opt={modules.mirrorFirstMonitor}
        type="boolean"
      />
      <MonitorLayouts />

      <Header title="Corner" />
      <Option
        title="Enable"
        subtitle="Show the corner background layer"
        opt={corner.enable}
        type="boolean"
      />
      <Option
        title="Gap"
        subtitle="Inset gap from monitor edges"
        opt={corner.gap}
        type="number"
        min={0} max={80} increment={1}
      />
      <Option
        title="Edge"
        subtitle="Corner edge thickness in px"
        opt={corner.edge}
        type="number"
        min={0} max={80} increment={1}
      />
      <Option
        title="Radius"
        subtitle="Corner cut radius in px"
        opt={corner.radius}
        type="number"
        min={0} max={80} increment={1}
      />
      <AssetSetting label="Corner background" options={corner} />
    </box>
  )
}

export default Bar

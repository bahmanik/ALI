import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4"
import { For, onCleanup } from "ags"

import { barModuleMap } from "./modules"
import type { BarModule } from "./modules"
import {
  createBarWindowBinds,
  computeBarRect,
  getBarOrientation,
  isBarVertical,
  storeBarRect,
  subscribeOpt,
  watchWidgetSize,
} from "./helpers"
import type { Gdk, Gtk } from "ags/gtk4"
import type { BarOptionGroup } from "./helpers"
import type { Opt } from "src/lib/options"
import type { BarSlotLayout } from "src/configuration/widgets/bar/type"
import { createMemo } from "gnim"

type BarProps = {
  gdkmonitor: Gdk.Monitor
  name: string
  option: BarOptionGroup
  /** Used as the Wayland layer-shell namespace AND as the CSS class on the window. */
  namespace?: string
  layout: Opt<BarSlotLayout>
}

export default function Bar({
  gdkmonitor,
  name,
  option,
  namespace = "bar",
  layout,
}: BarProps) {
  let win: Astal.Window
  let root: Gtk.Widget | null = null

  const monitorId = gdkmonitor.connector
  const orientation = getBarOrientation(option.position)
  const winBinds = createBarWindowBinds(option)

  /** Reactive boolean — true when the bar is on the left or right edge. */
  const vertical = createMemo(() => isBarVertical(option.position.get()))

  const startModules = layout.as((l) => l.start)
  const centerModules = layout.as((l) => l.center)
  const endModules = layout.as((l) => l.end)

  const recompute = () => {
    if (!win) return
    storeBarRect(namespace, monitorId, computeBarRect({ gdkmonitor, monitorId, name, option, root }))
  }

  onCleanup(() => {
    try { win?.destroy() } catch { }
    storeBarRect(namespace, monitorId, undefined)
  })

  function Slot({ modules, halign, valign }: {
    modules: ReturnType<typeof layout.as>
    halign: any
    valign: any
  }) {
    return (
      <box orientation={orientation.orientation} halign={halign} valign={valign}>
        <For each={modules}>
          {(modName: BarModule) => {
            const Component = barModuleMap[modName]
            if (!Component) return <box />
            return <Component vertical={vertical} />
          }}
        </For>
      </box>
    )
  }

  return (
    <window
      $={(self) => {
        win = self
        const stopPos = subscribeOpt(option.position, recompute)
        const stopMargin = subscribeOpt(option.margin, recompute)
        recompute()
        onCleanup(() => { stopPos(); stopMargin() })
      }}
      visible
      namespace={namespace}
      name={name}
      class={`bar ${namespace}`}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={winBinds.anchor}
      marginTop={winBinds.marginTop}
      marginRight={winBinds.marginRight}
      marginBottom={winBinds.marginBottom}
      marginLeft={winBinds.marginLeft}
      application={app}
      css="background: transparent;"
    >
      <centerbox
        orientation={orientation.orientation}
        class="bar-panel"
        $={(self) => {
          root = self
          const stopWatch = watchWidgetSize(self, recompute)
          recompute()
          onCleanup(() => stopWatch())
        }}
      >
        <Slot $type="start" modules={startModules} halign={orientation.start.halign} valign={orientation.start.valign} />
        <Slot $type="center" modules={centerModules} halign={orientation.center.halign} valign={orientation.center.valign} />
        <Slot $type="end" modules={endModules} halign={orientation.end.halign} valign={orientation.end.valign} />
      </centerbox>
    </window>
  )
}

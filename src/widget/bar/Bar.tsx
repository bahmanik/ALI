import app from "ags/gtk4/app"
import Astal from "gi://Astal?version=4.0"
import Gtk from "gi://Gtk?version=4.0"
import type Gdk from "gi://Gdk?version=4.0"
import { onCleanup } from "ags"
import type { BarLocation } from "src/lib/options/types"

import Clock from "./clock"
import Mpris from "./mpris"
import Tray from "./tray"
import Wireless from "./wireless"
import AudioOutput from "./audioOutput"
import Battery from "./battery"
import BarSection from "./BarSection"

import type { BarOptionGroup as BarOptionGroupT, BarKind } from "./helper"
import {
  getBarOrientation,
  createBarWindowBinds,
  computeBarRect,
  storeBarRect,
  subscribeOpt,
  watchWidgetSize,
  isBarVertical,
} from "./helper"

type BarOptionGroup = BarOptionGroupT & {
  position: { get(): BarLocation; subscribe(cb: () => void): any; as?: any }
  margin: { get(): number[]; subscribe(cb: () => void): any; as?: any }
}

type BarProps = {
  gdkmonitor: Gdk.Monitor
  name: string
  option: BarOptionGroup
  namespace?: string
  kind?: BarKind
}

export default function Bar({
  gdkmonitor,
  name,
  option,
  namespace = "bar",
  kind = "primary",
}: BarProps) {
  let win: Astal.Window
  let root: Gtk.Widget | null = null

  const isVertical = option.position.as(isBarVertical)
  console.log(name, isVertical)

  const monitorId = gdkmonitor.connector

  const layout = getBarOrientation(option)
  const winBinds = createBarWindowBinds(option)

  const recompute = () => {
    if (!win) return
    const rect = computeBarRect({ gdkmonitor, monitorId, name, option, root })
    storeBarRect(monitorId, kind, rect)
  }

  onCleanup(() => {
    // window is not auto-destroyed
    try { win?.destroy() } catch { }
    storeBarRect(monitorId, kind, undefined)
  })

  return (
    <window
      $={(self) => {
        win = self

        const stopPos = subscribeOpt(option.position, recompute)
        const stopMargin = subscribeOpt(option.margin, recompute)

        recompute()

        onCleanup(() => {
          stopPos()
          stopMargin()
        })
      }}
      visible
      namespace={namespace}
      name={name}
      class={`bar ${kind === "primary" ? "bar-primary" : "bar-secondary"}`}
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
        orientation={layout.orientation}
        class="bar-panel"
        $={(self) => {
          root = self

          const stopWatch = watchWidgetSize(self, recompute)
          recompute()

          onCleanup(() => {
            stopWatch()
          })
        }}
      >
        <BarSection slot="start" orientation={layout.orientation} halign={layout.start.halign} valign={layout.start.valign}>
          <Clock vertical={isVertical} />
          <Mpris />
        </BarSection>

        <BarSection slot="end" orientation={layout.orientation} halign={layout.end.halign} valign={layout.end.valign}>
          <Tray />
          <Wireless />
          <AudioOutput />
          <Battery vertical={isVertical} />
        </BarSection>
      </centerbox>
    </window>
  )
}

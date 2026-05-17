import options from "src/configuration"
import giCairo from "cairo"
import GLib from "gi://GLib?version=2.0"
import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"
import { onCleanup } from "ags"

import { barsGeometry } from "../shared"
import type { BarsOnMonitor } from "../shared"
import {
  clearToTransparent,
  normalizeOpacity,
  paintCoverSurface,
  paintSolid,
  paintTiledSurface,
  punchRoundedHole,
  useImageAsset,
  usePatternAsset,
  useSolidAsset,
  useDrawingArea,
} from "src/lib/hooks"

import {
  computeInsets,
  forceClickThrough,
  makeClickThrough,
} from "./helpers"

export default function Corner(gdkmonitor: Gdk.Monitor) {
  let win: Astal.Window

  const monitorId = gdkmonitor.connector
  const background = options.bar.corner.background

  const { widget: da, redraw } = useDrawingArea(
    (ctx, w, h) => {
      if (w <= 0 || h <= 0) return

      clearToTransparent(ctx)

      const asset = background.get()

      if (asset.kind === "solid") {
        const rgba = solidColor.peek()
        if (rgba) paintSolid(ctx, w, h, rgba)
      } else if (asset.kind === "pattern") {
        const loaded = patternSurface.peek()
        if (loaded) {
          paintTiledSurface(
            ctx,
            w,
            h,
            loaded.surface,
            loaded.width,
            loaded.height,
            Math.max(1, Number(asset.size ?? 12)),
            normalizeOpacity(asset.opacity),
          )
        }
      } else {
        const loaded = imageSurface.peek()
        if (loaded) {
          paintCoverSurface(
            ctx,
            w,
            h,
            loaded.surface,
            loaded.width,
            loaded.height,
          )
        }
      }

      const geo = barsGeometry.get()[monitorId] ?? {}
      const ins = computeInsets({
        w,
        h,
        geo: geo as BarsOnMonitor,
        gap: options.bar.corner.gap.get(),
        edge: options.bar.corner.edge.get(),
        radius: options.bar.corner.radius.get(),
      })

      const x = ins.left
      const y = ins.top
      const iw = Math.max(0, w - ins.left - ins.right)
      const ih = Math.max(0, h - ins.top - ins.bottom)

      const holeIsWholeSurface = x === 0 && y === 0 && iw === w && ih === h
      if (!holeIsWholeSurface) {
        ctx.setAntialias(giCairo.Antialias.BEST)
        punchRoundedHole(ctx, x, y, iw, ih, ins.radius)
      }
    },
    { interactive: false, expand: true },
  )

  da.set_can_focus(false)
  da.set_sensitive(false)

  const queueDraw = () => {
    try {
      redraw()
    } catch {
      // ignore
    }
  }

  const imageSurface = useImageAsset(background, queueDraw)
  const patternSurface = usePatternAsset(background, queueDraw)
  const solidColor = useSolidAsset(background, queueDraw)

  const unsubs: Array<() => void> = []
  unsubs.push(barsGeometry.subscribe(queueDraw))
  unsubs.push(options.bar.corner.gap.subscribe(queueDraw))
  unsubs.push(options.bar.corner.edge.subscribe(queueDraw))
  unsubs.push(options.bar.corner.radius.subscribe(queueDraw))
  // Keep visible state in sync with the enable option after startup.
  unsubs.push(options.bar.corner.enable.subscribe((val: boolean) => {
    if (!win) return
    const show = Boolean(val)
    if (show && !win.visible) {
      forceClickThrough(win)
      win.visible = true
    } else if (!show && win.visible) {
      win.visible = false
    }
  }))

  onCleanup(() => {
    for (const unsubscribe of unsubs) {
      try {
        unsubscribe()
      } catch {
        // ignore
      }
    }
    unsubs.length = 0
  })

  onCleanup(() => {
    try {
      win.destroy()
    } catch {
      // ignore
    }
  })

  return (
    <window
      name={`corner-${monitorId}`}
      application={app}
      gdkmonitor={gdkmonitor}
      visible={false}
      layer={Astal.Layer.BOTTOM}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
      css="background: transparent;"
      $={(self) => {
        win = self

        // Block all input immediately and keep it blocked.
        makeClickThrough(win)

        // The Wayland layer-shell configure roundtrip happens after the first
        // map. We wait for it via idle_add so the window has its real monitor
        // geometry before we paint the first frame. Only then do we show it,
        // which avoids the startup flash entirely. We also re-apply
        // click-through here because the compositor may reset the input region
        // during the configure exchange.
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
          if (Boolean(options.bar.corner.enable.get())) {
            forceClickThrough(win)
            win.visible = true
          }
          return GLib.SOURCE_REMOVE
        })
      }}
    >
      {da as unknown as JSX.Element}
    </window>
  )
}

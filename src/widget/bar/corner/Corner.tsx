import options from "src/configuration"
import giCairo from "cairo"
import app from "ags/gtk4/app"
import { Astal, Gdk } from "ags/gtk4"
import { onCleanup } from "ags"
import type { Gtk } from "ags/gtk4"

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
} from "src/lib/hooks"

import {
  computeInsets,
  forceClickThrough,
  makeClickThrough,
} from "./helpers"

export default function Corner(gdkmonitor: Gdk.Monitor) {
  let win: Astal.Window
  let da: Gtk.DrawingArea

  const monitorId = gdkmonitor.connector
  const background = options.bar.corner.background

  const queueDraw = () => {
    try {
      da?.queue_draw()
    } catch {
      // ignore
    }
  }

  const imageSurface = useImageAsset(background, queueDraw)
  const patternSurface = usePatternAsset(background, queueDraw)
  const solidColor = useSolidAsset(background, queueDraw)

  const visible = options.bar.corner.enable.as
    ? options.bar.corner.enable.as(Boolean)
    : options.bar.corner.enable.get()

  const unsubs: Array<() => void> = []
  const subscribeRedraw = () => {
    unsubs.push(barsGeometry.subscribe(queueDraw))
    unsubs.push(options.bar.corner.gap.subscribe(queueDraw))
    unsubs.push(options.bar.corner.edge.subscribe(queueDraw))
    unsubs.push(options.bar.corner.radius.subscribe(queueDraw))

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
  }

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
      visible={visible}
      layer={Astal.Layer.BOTTOM}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
      css="background: transparent;"
      $={(self) => {
        win = self
        makeClickThrough(win)
      }}
      onNotifyVisible={({ visible }) => {
        if (visible) forceClickThrough(win)
      }}
    >
      <drawingarea
        hexpand
        vexpand
        canFocus={false}
        sensitive={false}
        $={(self: Gtk.DrawingArea) => {
          da = self
          subscribeRedraw()

          da.set_draw_func((_area, ctx: any, w: number, h: number) => {
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
          })
        }}
      />
    </window>
  )
}

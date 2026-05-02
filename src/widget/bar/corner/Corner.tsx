import options from "src/configuration"
import giCairo from "cairo"
import { Astal, Gdk } from "ags/gtk4"
import { onCleanup } from "ags"
import type { Gtk } from "ags/gtk4"

import { barsGeometry } from "../shared"
import type { BarsOnMonitor } from "../shared"
import { VisualAssetImageService } from "src/services/assets/VisualAssetImageService"

import {
  clearToTransparent,
  computeInsets,
  forceClickThrough,
  makeClickThrough,
  paintCoverSurface,
  paintSolid,
  paintTiledPattern,
  parseSolidColor,
  punchRoundedHole,
} from "./helpers"

import { CornerWindow } from "./_components"

export default function Corner(gdkmonitor: Gdk.Monitor) {
  let win: Astal.Window
  let da: Gtk.DrawingArea

  const monitorId = gdkmonitor.connector
  const assetSvc = VisualAssetImageService.getInstance()

  let backgroundSurface: giCairo.ImageSurface | null = null
  let backgroundW = 1
  let backgroundH = 1

  let unwatchBackground: (() => void) | null = null
  let watchGen = 0

  const queueDraw = () => {
    try {
      da?.queue_draw()
    } catch {
      // ignore
    }
  }

  const readSolidFallback = () =>
    parseSolidColor(options.bar.style.bg.get?.() ?? "#111318", options.bar.style.bgOpacity.get?.() ?? 100)

  const loadBackgroundFrom = (outPath: string, gen: number) => {
    if (gen !== watchGen) return

    try {
      backgroundSurface = giCairo.ImageSurface.createFromPNG(outPath)
      backgroundW = backgroundSurface.getWidth()
      backgroundH = backgroundSurface.getHeight()
      queueDraw()
    } catch (e) {
      console.error("corner background load failed:", e)
    }
  }

  const stopWatches = () => {
    try {
      unwatchBackground?.()
    } catch {
      // ignore
    }

    unwatchBackground = null
  }

  const rewatchAssets = () => {
    const gen = ++watchGen
    stopWatches()

    backgroundSurface = null
    queueDraw()

    const asset = options.bar.corner.background.get()

    if (asset.kind === "solid") return

    unwatchBackground = assetSvc.watch(asset, "bar-corner-background", (outPath) => {
      loadBackgroundFrom(outPath, gen)
    })
  }

  const subscribeRedraw = () => {
    const unsubs: Array<() => void> = []

    unsubs.push(barsGeometry.subscribe(queueDraw))

    unsubs.push(options.bar.corner.gap.subscribe(queueDraw))
    unsubs.push(options.bar.corner.edge.subscribe(queueDraw))
    unsubs.push(options.bar.corner.radius.subscribe(queueDraw))

    unsubs.push(options.bar.style.bg.subscribe(queueDraw))
    unsubs.push(options.bar.style.bgOpacity.subscribe(queueDraw))

    unsubs.push(options.bar.corner.background.subscribe(rewatchAssets))

    onCleanup(() => {
      for (const u of unsubs) {
        try {
          u()
        } catch {
          // ignore
        }
      }
    })
  }

  onCleanup(() => {
    stopWatches()
    try {
      win.destroy()
    } catch {
      // ignore
    }
  })

  const visible = options.bar.corner.enable.as ? options.bar.corner.enable.as(Boolean) : options.bar.corner.enable.get()

  return (
    <CornerWindow
      monitorId={monitorId}
      gdkmonitor={gdkmonitor}
      visible={visible}
      onWindow={(self) => {
        win = self
        makeClickThrough(win)
      }}
      onNotifyVisible={(v) => {
        if (v) forceClickThrough(win)
      }}
      onArea={(self) => {
        da = self
        subscribeRedraw()
        rewatchAssets()

        da.set_draw_func((_area, ctx: any, w: number, h: number) => {
          if (w <= 0 || h <= 0) return

          clearToTransparent(ctx)

          const asset = options.bar.corner.background.get()
          const solidFallback = readSolidFallback()

          if (asset.kind === "solid") {
            paintSolid(ctx, w, h, parseSolidColor(asset.color, asset.opacity ?? 100))
          } else if (asset.kind === "pattern") {
            if (!backgroundSurface) {
              paintSolid(ctx, w, h, solidFallback)
            } else {
              const size = Math.max(1, Number(asset.size ?? 12))
              paintTiledPattern(ctx, w, h, backgroundSurface, backgroundW, backgroundH, size)
            }
          } else {
            if (!backgroundSurface) {
              paintSolid(ctx, w, h, solidFallback)
            } else {
              paintCoverSurface(ctx, w, h, backgroundSurface, backgroundW, backgroundH)
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
  )
}

import { createState, onCleanup, onMount } from "gnim"
import giCairo from "cairo"
import type { Opt } from "src/lib/options"
import type { VisualAsset } from "src/configuration/types"
import type { ImageAsset, PatternAsset } from "src/services/assets/types"
import { AssetPipelineService } from "src/services/assets/AssetPipelineService"
import {
  parseSolidColor,
  type Rgba,
} from "./assetPaint"

export type RasterAssetSurface = {
  surface: giCairo.ImageSurface
  width: number
  height: number
  path: string
}

type AssetSource = Opt<VisualAsset>

function loadRasterSurface(path: string): RasterAssetSurface {
  const surface = giCairo.ImageSurface.createFromPNG(path)
  return {
    surface,
    width: surface.getWidth(),
    height: surface.getHeight(),
    path,
  }
}

function useRasterAsset(
  source: AssetSource,
  predicate: (asset: VisualAsset) => asset is ImageAsset | PatternAsset,
  onUpdate: () => void,
) {
  const [state, setState] = createState<RasterAssetSurface | null>(null)

  onMount(() => {
    let generation = 0
    let stopWatch: (() => void) | null = null

    const sync = () => {
      const asset = source.get()
      const currentGen = ++generation

      if (stopWatch) {
        stopWatch()
        stopWatch = null
      }

      setState(null)
      onUpdate()

      if (!predicate(asset)) return

      stopWatch = AssetPipelineService.get_default().watch(asset, (outPath) => {
        if (currentGen !== generation) return

        try {
          setState(loadRasterSurface(outPath))
          onUpdate()
        } catch (error) {
          console.error("[asset hooks] raster load failed:", error)
          setState(null)
          onUpdate()
        }
      })
    }

    const unsubscribe = source.subscribe(sync)
    sync()

    onCleanup(() => {
      generation += 1
      unsubscribe()
      stopWatch?.()
    })
  })

  return state
}

export function useImageAsset(source: AssetSource, onUpdate: () => void) {
  return useRasterAsset(source, (asset): asset is ImageAsset => asset.kind === "image", onUpdate)
}

export function usePatternAsset(source: AssetSource, onUpdate: () => void) {
  return useRasterAsset(source, (asset): asset is PatternAsset => asset.kind === "pattern", onUpdate)
}

export function useSolidAsset(source: AssetSource, onUpdate: () => void) {
  const [state, setState] = createState<Rgba | null>(null)

  onMount(() => {
    const sync = () => {
      const asset = source.get()

      if (asset.kind !== "solid") {
        setState(null)
        onUpdate()
        return
      }

      setState(parseSolidColor(asset.color, asset.opacity ?? 100))
      onUpdate()
    }

    const unsubscribe = source.subscribe(sync)
    sync()

    onCleanup(() => {
      unsubscribe()
    })
  })

  return state
}

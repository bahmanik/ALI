import { Gtk } from "ags/gtk4"
import giCairo from "cairo"
import { onCleanup } from "gnim"

import { Option } from "./option"
import {
  clearToTransparent,
  normalizeOpacity,
  paintCoverSurface,
  paintSolid,
  paintTiledSurface,
  roundedRectPath,
  useDrawingArea,
  useImageAsset,
  usePatternAsset,
  useSolidAsset,
} from "src/lib/hooks"
import type { Opt } from "src/lib/options"
import type { VisualAsset } from "src/configuration/types"
import type { ImageTechnique, PatternAsset, SolidAsset } from "src/services/assets/types"

const KINDS: VisualAsset["kind"][] = ["solid", "pattern", "image"]
const TECHNIQUES: ImageTechnique[] = ["none", "negative", "grayscale", "sepia"]

const DEFAULT_SOLID_COLOR = "#111318"
const DEFAULT_PATTERN_SIZE = 80
const DEFAULT_OPACITY = 100
const DEFAULT_TECHNIQUE: ImageTechnique = "none"

interface AssetSettingProps {
  asset: Opt<VisualAsset>
  label?: string
}

type AssetOpt<T> = Opt<T>

function mapAssetOpt<T>(params: {
  source: Opt<VisualAsset>
  initial: T
  read: (asset: VisualAsset) => T
  write: (current: VisualAsset, next: T) => VisualAsset
}): AssetOpt<T> {
  const { source, initial, read, write } = params

  return {
    initial,
    get: () => read(source.get()),
    set: (next: T) => source.set(write(source.get(), next)),
    as: (transform: (value: T) => unknown) => source.as((asset) => transform(read(asset))),
    subscribe: (callback: () => void) => source.subscribe(callback),
    reset: () => source.set(write(source.initial, initial)),
  } as unknown as AssetOpt<T>
}

function solidDefaults(asset: VisualAsset): SolidAsset {
  return asset.kind === "solid"
    ? {
      kind: "solid",
      color: asset.color,
      opacity: asset.opacity ?? DEFAULT_OPACITY,
    }
    : {
      kind: "solid",
      color: DEFAULT_SOLID_COLOR,
      opacity: DEFAULT_OPACITY,
    }
}

function imageDefaults(asset: VisualAsset) {
  return asset.kind === "image"
    ? {
      kind: "image" as const,
      path: asset.path,
      technique: asset.technique ?? DEFAULT_TECHNIQUE,
      transformations: asset.transformations,
    }
    : {
      kind: "image" as const,
      path: "",
      technique: DEFAULT_TECHNIQUE,
      transformations: undefined,
    }
}

function patternDefaults(asset: VisualAsset): PatternAsset {
  return asset.kind === "pattern"
    ? {
      kind: "pattern",
      path: asset.path,
      size: asset.size ?? DEFAULT_PATTERN_SIZE,
      opacity: asset.opacity ?? DEFAULT_OPACITY,
      technique: asset.technique ?? DEFAULT_TECHNIQUE,
      transformations: asset.transformations,
    }
    : {
      kind: "pattern",
      path: "",
      size: DEFAULT_PATTERN_SIZE,
      opacity: DEFAULT_OPACITY,
      technique: DEFAULT_TECHNIQUE,
      transformations: undefined,
    }
}

function paintCheckerboard(ctx: giCairo.Context, w: number, h: number, size = 12) {
  const step = Math.max(4, size)
  const cols = Math.ceil(w / step)
  const rows = Math.ceil(h / step)

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const odd = (x + y) % 2 === 1
      ctx.setSourceRGBA(odd ? 0.24 : 0.18, odd ? 0.25 : 0.19, odd ? 0.28 : 0.22, 1)
      ctx.rectangle(x * step, y * step, step, step)
      ctx.fill()
    }
  }
}

function createAssetOptions(asset: Opt<VisualAsset>) {
  const kindOpt = mapAssetOpt({
    source: asset,
    initial: asset.initial.kind,
    read: (value) => value.kind,
    write: (current, next) => {
      // Hydrating the full target shape ensures no stale parameters break the runtime views
      if (next === "solid") return solidDefaults(current)
      if (next === "pattern") return patternDefaults(current)
      return imageDefaults(current)
    },
  })

  const solidOpacityOpt = mapAssetOpt({
    source: asset,
    initial: asset.initial.kind === "solid" ? asset.initial.opacity ?? DEFAULT_OPACITY : DEFAULT_OPACITY,
    read: (value) => (value.kind === "solid" ? value.opacity ?? DEFAULT_OPACITY : DEFAULT_OPACITY),
    write: (current, next) => ({
      ...solidDefaults(current),
      opacity: next,
    }),
  })

  const imagePathOpt = mapAssetOpt({
    source: asset,
    initial: asset.initial.kind === "image" ? asset.initial.path : "",
    read: (value) => (value.kind === "image" ? value.path : ""),
    write: (current, next) => ({
      ...imageDefaults(current),
      path: next,
    }),
  })

  const imageTechniqueOpt = mapAssetOpt({
    source: asset,
    initial: asset.initial.kind === "image" ? asset.initial.technique ?? DEFAULT_TECHNIQUE : DEFAULT_TECHNIQUE,
    read: (value) => (value.kind === "image" ? value.technique ?? DEFAULT_TECHNIQUE : DEFAULT_TECHNIQUE),
    write: (current, next) => ({
      ...imageDefaults(current),
      technique: next,
    }),
  })

  const patternPathOpt = mapAssetOpt({
    source: asset,
    initial: asset.initial.kind === "pattern" ? asset.initial.path : "",
    read: (value) => (value.kind === "pattern" ? value.path : ""),
    write: (current, next) => ({
      ...patternDefaults(current),
      path: next,
    }),
  })

  const patternSizeOpt = mapAssetOpt({
    source: asset,
    initial: asset.initial.kind === "pattern" ? asset.initial.size ?? DEFAULT_PATTERN_SIZE : DEFAULT_PATTERN_SIZE,
    read: (value) => (value.kind === "pattern" ? value.size ?? DEFAULT_PATTERN_SIZE : DEFAULT_PATTERN_SIZE),
    write: (current, next) => ({
      ...patternDefaults(current),
      size: next,
    }),
  })

  const patternOpacityOpt = mapAssetOpt({
    source: asset,
    initial: asset.initial.kind === "pattern" ? asset.initial.opacity ?? DEFAULT_OPACITY : DEFAULT_OPACITY,
    read: (value) => (value.kind === "pattern" ? value.opacity ?? DEFAULT_OPACITY : DEFAULT_OPACITY),
    write: (current, next) => ({
      ...patternDefaults(current),
      opacity: next,
    }),
  })

  const patternTechniqueOpt = mapAssetOpt({
    source: asset,
    initial: asset.initial.kind === "pattern" ? asset.initial.technique ?? DEFAULT_TECHNIQUE : DEFAULT_TECHNIQUE,
    read: (value) => (value.kind === "pattern" ? value.technique ?? DEFAULT_TECHNIQUE : DEFAULT_TECHNIQUE),
    write: (current, next) => ({
      ...patternDefaults(current),
      technique: next,
    }),
  })

  return {
    kindOpt,
    solidOpacityOpt,
    imagePathOpt,
    imageTechniqueOpt,
    patternPathOpt,
    patternSizeOpt,
    patternOpacityOpt,
    patternTechniqueOpt,
  }
}

function AssetPreview({ asset }: { asset: Opt<VisualAsset> }): JSX.Element {
  const { widget: preview, redraw } = useDrawingArea(
    (ctx, w, h) => {
      if (w <= 0 || h <= 0) return

      clearToTransparent(ctx)

      const radius = Math.min(18, Math.min(w, h) / 6)
      roundedRectPath(ctx, 0, 0, w, h, radius)
      ctx.clip()

      paintCheckerboard(ctx, w, h, 14)

      const current = asset.get()

      // Defensive Rendering: Verify asynchronous surfaces are fully cached before invoking Cairo loops
      if (current.kind === "solid") {
        const rgba = solidColor.peek()
        if (rgba) paintSolid(ctx, w, h, rgba)
      } else if (current.kind === "pattern") {
        const loaded = patternSurface.peek()
        if (loaded && loaded.surface) {
          paintTiledSurface(
            ctx,
            w,
            h,
            loaded.surface,
            loaded.width,
            loaded.height,
            Math.max(1, Number(current.size ?? DEFAULT_PATTERN_SIZE)),
            normalizeOpacity(current.opacity),
          )
        }
      } else {
        const loaded = imageSurface.peek()
        if (loaded && loaded.surface) {
          paintCoverSurface(ctx, w, h, loaded.surface, loaded.width, loaded.height)
        }
      }

      ctx.save()
      ctx.setSourceRGBA(1, 1, 1, 0.12)
      ctx.setLineWidth(1)
      roundedRectPath(ctx, 0.5, 0.5, w - 1, h - 1, radius)
      ctx.stroke()
      ctx.restore()
    },
    { interactive: false, expand: false },
  )

  preview.set_hexpand(true)
  preview.set_vexpand(false)
  preview.set_content_width(280)
  preview.set_content_height(160)

  const queueDraw = () => {
    try {
      redraw()
    } catch {
      // ignore redraw races
    }
  }

  const imageSurface = useImageAsset(asset, queueDraw)
  const patternSurface = usePatternAsset(asset, queueDraw)
  const solidColor = useSolidAsset(asset, queueDraw)

  return <box>{preview as unknown as JSX.Element}</box>
}

function AssetEditor({ asset, options }: { asset: Opt<VisualAsset>; options: ReturnType<typeof createAssetOptions> }): JSX.Element {
  return (
    <stack
      transitionType={Gtk.StackTransitionType.CROSSFADE}
      $={(self) => {
        const current = asset.get()
        self.set_visible_child_name(current.kind)

        // Active State Broadcast: Forcefully push un-committed static defaults up to the central store on mount
        if (current.kind === "solid" && current.opacity === undefined) {
          options.solidOpacityOpt.set(DEFAULT_OPACITY)
        } else if (current.kind === "pattern" && current.size === undefined) {
          options.patternSizeOpt.set(DEFAULT_PATTERN_SIZE)
        }

        const unsub = asset.subscribe(() => {
          self.set_visible_child_name(asset.get().kind)
        })

        onCleanup(() => unsub())
      }}
    >
      <box $type="named" name="solid" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
        <Option
          title="Opacity"
          subtitle="Solid color opacity (0–100)"
          opt={options.solidOpacityOpt}
          type="number"
          min={0}
          max={100}
          increment={1}
        />
      </box>

      <box $type="named" name="image" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
        <Option title="Image" subtitle="Pick an image file" opt={options.imagePathOpt} type="image" />
        <Option title="Technique" subtitle="Image filter applied after loading" opt={options.imageTechniqueOpt} type="enum" values={TECHNIQUES} />
      </box>

      <box $type="named" name="pattern" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
        <Option title="Pattern image" subtitle="Pick the pattern source file" opt={options.patternPathOpt} type="image" />
        <Option title="Tile size" subtitle="Pattern tile size in px" opt={options.patternSizeOpt} type="number" min={1} max={512} increment={1} />
        <Option title="Opacity" subtitle="Pattern opacity (0–100)" opt={options.patternOpacityOpt} type="number" min={0} max={100} increment={1} />
        <Option title="Technique" subtitle="Image filter applied after loading" opt={options.patternTechniqueOpt} type="enum" values={TECHNIQUES} />
      </box>
    </stack>
  )
}

export const AssetSetting = ({ asset, label = "Asset" }: AssetSettingProps): JSX.Element => {
  const options = createAssetOptions(asset)

  return (
    <box orientation={Gtk.Orientation.VERTICAL} class="asset-setting" spacing={10}>
      {label ? <label class="setting-section-label" label={label} halign={Gtk.Align.START} xalign={0} /> : null}
      <AssetPreview asset={asset} />
      <Option title="Type" subtitle="What kind of visual asset to use" opt={options.kindOpt} type="enum" values={KINDS} />
      <AssetEditor asset={asset} options={options} />
    </box>
  )
}

export default AssetSetting

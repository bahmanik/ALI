import { Gtk } from "ags/gtk4"
import giCairo from "cairo"
import { createState, onCleanup, With } from "gnim"

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
import type { HexColor, VisualAsset } from "src/configuration/types"
import type { ImageTechnique, SolidAsset, ImageAsset, PatternAsset } from "src/services/assets/types"
import type { OverrideVisualAssetResult } from "src/lib/options/factories/overrideVisualAsset"
import { Option } from "./option"

// ─── Constants ────────────────────────────────────────────────────────────────

const TECHNIQUES: ImageTechnique[] = ["none", "negative", "grayscale", "sepia"]

const DEFAULT_SOLID: SolidAsset = { kind: "solid", color: "#111318", opacity: 100 }
const DEFAULT_IMAGE: ImageAsset = { kind: "image", path: "", technique: "none" }
const DEFAULT_PATTERN: PatternAsset = { kind: "pattern", path: "", size: 80, opacity: 100, technique: "none" }

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AssetSettingProps {
  options: OverrideVisualAssetResult
  label?: string
}

// ─── Colour normalisation ─────────────────────────────────────────────────────

function rgbaArrayToHex(arr: number[]): HexColor {
  const h = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")
  const [r = 0, g = 0, b = 0] = arr
  return `#${h(r)}${h(g)}${h(b)}` as HexColor
}

function normaliseColor(raw: unknown): HexColor {
  if (Array.isArray(raw)) return rgbaArrayToHex(raw as number[])
  if (typeof raw === "string" && raw.length > 0) return raw as HexColor
  return DEFAULT_SOLID.color as HexColor
}

// ─── Kind switching — reads/writes snapshot opts ──────────────────────────────
//
// When switching kind:
//   1. Save the current localBackground value into the outgoing kind's snapshot opt.
//   2. Load the incoming kind's snapshot opt into localBackground.
//
// Because snapshot opts are plain Opt<T> they are persisted to the JSON config
// file normally — switching solid→pattern→solid across sessions never loses
// the solid color or the pattern path.
//
// Path cross-population: when moving between raster kinds for the first time
// (snapshot path is empty) we carry over the current path so the user doesn't
// have to re-pick the same file.

type Snapshots = {
  solid: Opt<SolidAsset>
  image: Opt<ImageAsset>
  pattern: Opt<PatternAsset>
}

function switchKind(
  local: Opt<VisualAsset>,
  snapshots: Snapshots,
  toKind: VisualAsset["kind"],
): void {
  const current = local.get()

  // 1. Save outgoing state into its snapshot
  if (current.kind === "solid") snapshots.solid.set(current as SolidAsset)
  if (current.kind === "image") snapshots.image.set(current as ImageAsset)
  if (current.kind === "pattern") snapshots.pattern.set(current as PatternAsset)

  // 2. Build the incoming state from its snapshot
  if (toKind === "solid") {
    local.set({ ...snapshots.solid.get() })
    return
  }

  // For raster kinds, cross-populate path if snapshot has none
  const currentPath = current.kind !== "solid" ? current.path : ""

  if (toKind === "image") {
    const snap = snapshots.image.get()
    const next: ImageAsset = { ...snap }
    if (!next.path && currentPath) next.path = currentPath
    local.set(next)
    return
  }

  // pattern
  const snap = snapshots.pattern.get()
  const next: PatternAsset = { ...snap }
  if (!next.path && currentPath) next.path = currentPath
  local.set(next)
}

// ─── Proxy factory ────────────────────────────────────────────────────────────

function makeFieldProxy<T>(
  source: Opt<VisualAsset>,
  defaultValue: T,
  read: (a: VisualAsset) => T,
  write: (a: VisualAsset, v: T) => VisualAsset,
  normalise?: (raw: unknown) => T,
): Opt<T> {
  return {
    initial: defaultValue,
    get: () => read(source.get()),
    set: (raw: T) => source.set(write(source.get(), normalise ? normalise(raw) : raw)),
    as: (fn: any) => source.as((a: VisualAsset) => fn(read(a))),
    subscribe: (cb: any) => source.subscribe(cb),
    reset: () => source.set(write(source.get(), defaultValue)),
  } as unknown as Opt<T>
}

// ─── Checkerboard ─────────────────────────────────────────────────────────────

function paintCheckerboard(ctx: giCairo.Context, w: number, h: number) {
  const step = 14
  for (let y = 0; y < Math.ceil(h / step); y++) {
    for (let x = 0; x < Math.ceil(w / step); x++) {
      const odd = (x + y) % 2 === 1
      ctx.setSourceRGBA(odd ? 0.24 : 0.18, odd ? 0.25 : 0.19, odd ? 0.28 : 0.22, 1)
      ctx.rectangle(x * step, y * step, step, step)
      ctx.fill()
    }
  }
}

// ─── Preview ──────────────────────────────────────────────────────────────────

function AssetPreview({
  background,
  locked,
  onClick,
}: {
  background: Opt<VisualAsset>
  locked: boolean
  onClick: () => void
}): JSX.Element {
  const { widget: area, redraw } = useDrawingArea(
    (ctx, w, h) => {
      if (w <= 0 || h <= 0) return
      clearToTransparent(ctx)

      const r = Math.min(18, Math.min(w, h) / 6)
      roundedRectPath(ctx, 0, 0, w, h, r)
      ctx.clip()
      paintCheckerboard(ctx, w, h)

      const a = background.get()
      if (a.kind === "solid") {
        const rgba = solidColor.peek()
        if (rgba) paintSolid(ctx, w, h, rgba)
      } else if (a.kind === "pattern") {
        const s = patternSurface.peek()
        if (s?.surface)
          paintTiledSurface(ctx, w, h, s.surface, s.width, s.height,
            Math.max(1, a.size ?? 80), normalizeOpacity(a.opacity))
      } else {
        const s = imageSurface.peek()
        if (s?.surface) paintCoverSurface(ctx, w, h, s.surface, s.width, s.height)
      }

      // rim
      ctx.save()
      ctx.setSourceRGBA(1, 1, 1, 0.12)
      ctx.setLineWidth(1)
      roundedRectPath(ctx, 0.5, 0.5, w - 1, h - 1, r)
      ctx.stroke()
      ctx.restore()

      // edit / lock badge
      const bs = 26, bx = w - bs - 6, by = h - bs - 6
      ctx.save()
      ctx.setSourceRGBA(0, 0, 0, 0.45)
      roundedRectPath(ctx, bx, by, bs, bs, 5)
      ctx.fill()
      ctx.setSourceRGBA(1, 1, 1, 0.78)
      ctx.selectFontFace("Sans", giCairo.FontSlant.NORMAL, giCairo.FontWeight.NORMAL)
      ctx.setFontSize(12)
      const glyph = locked ? "🔒" : "✎"
      const ext = ctx.textExtents(glyph)
      ctx.moveTo(bx + (bs - ext.width) / 2 - ext.xBearing, by + (bs + ext.height) / 2)
      ctx.showText(glyph)
      ctx.restore()
    },
    { interactive: false, expand: false },
  )

  area.set_hexpand(true)
  area.set_vexpand(false)
  area.set_content_width(280)
  area.set_content_height(160)

  const queueDraw = () => { try { redraw() } catch { /* */ } }
  const imageSurface = useImageAsset(background, queueDraw)
  const patternSurface = usePatternAsset(background, queueDraw)
  const solidColor = useSolidAsset(background, queueDraw)

  return (
    <button class="asset-preview-button" onClicked={onClick} hexpand>
      {area as unknown as JSX.Element}
    </button>
  )
}

// ─── Kind tabs ────────────────────────────────────────────────────────────────

function KindTabs({
  local,
  snapshots,
}: {
  local: Opt<VisualAsset>
  snapshots: Snapshots
}): JSX.Element {
  const kinds: VisualAsset["kind"][] = ["solid", "pattern", "image"]
  return (
    <box class="asset-kind-tabs" spacing={4} hexpand>
      {kinds.map((k) => (
        <button
          class={local.as((a) => `asset-kind-tab${a.kind === k ? " active" : ""}`)}
          label={k}
          hexpand
          onClicked={() => {
            if (local.get().kind !== k) switchKind(local, snapshots, k)
          }}
        />
      ))}
    </box>
  )
}

// ─── Per-kind editors ─────────────────────────────────────────────────────────

function SolidEditor({ local }: { local: Opt<VisualAsset> }): JSX.Element {
  const colorOpt: Opt<HexColor> = makeFieldProxy<HexColor>(
    local,
    DEFAULT_SOLID.color as HexColor,
    (a) => (a.kind === "solid" ? normaliseColor(a.color) : normaliseColor(DEFAULT_SOLID.color)),
    (a, v) => ({
      kind: "solid",
      color: v,
      opacity: a.kind === "solid" ? (a.opacity ?? DEFAULT_SOLID.opacity) : DEFAULT_SOLID.opacity,
    }),
    normaliseColor,
  )

  const opacityOpt = makeFieldProxy<number>(
    local,
    DEFAULT_SOLID.opacity!,
    (a) => a.kind === "solid" ? (a.opacity ?? DEFAULT_SOLID.opacity!) : DEFAULT_SOLID.opacity!,
    (a, v) => ({
      kind: "solid",
      color: a.kind === "solid" ? normaliseColor(a.color) : normaliseColor(DEFAULT_SOLID.color),
      opacity: v,
    }),
  )

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
      <Option title="Color" subtitle="Fill color" opt={colorOpt} type="color" />
      <Option title="Opacity" subtitle="0 – 100" opt={opacityOpt} type="number" min={0} max={100} increment={1} />
    </box>
  )
}

function ImageEditor({ local }: { local: Opt<VisualAsset> }): JSX.Element {
  const pathOpt = makeFieldProxy<string>(
    local,
    DEFAULT_IMAGE.path,
    (a) => a.kind === "image" ? a.path : DEFAULT_IMAGE.path,
    (a, v) => ({
      kind: "image",
      path: v,
      technique: a.kind !== "solid" ? (a.technique ?? DEFAULT_IMAGE.technique) : DEFAULT_IMAGE.technique,
      transformations: a.kind !== "solid" ? a.transformations : undefined,
    }),
  )

  const techniqueOpt = makeFieldProxy<ImageTechnique>(
    local,
    DEFAULT_IMAGE.technique!,
    (a) => a.kind === "image" ? (a.technique ?? DEFAULT_IMAGE.technique!) : DEFAULT_IMAGE.technique!,
    (a, v) => ({
      kind: "image",
      path: a.kind === "image" ? a.path : DEFAULT_IMAGE.path,
      technique: v,
      transformations: a.kind === "image" ? a.transformations : undefined,
    }),
  )

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
      <Option title="Image" subtitle="Pick an image file" opt={pathOpt} type="image" />
      <Option title="Technique" subtitle="Filter applied after loading" opt={techniqueOpt} type="enum" values={TECHNIQUES} />
    </box>
  )
}

function PatternEditor({ local }: { local: Opt<VisualAsset> }): JSX.Element {
  const isPat = (a: VisualAsset): a is PatternAsset => a.kind === "pattern"

  const pathOpt = makeFieldProxy<string>(
    local,
    DEFAULT_PATTERN.path,
    (a) => isPat(a) ? a.path : DEFAULT_PATTERN.path,
    (a, v) => ({
      kind: "pattern",
      path: v,
      size: isPat(a) ? (a.size ?? DEFAULT_PATTERN.size!) : DEFAULT_PATTERN.size!,
      opacity: isPat(a) ? (a.opacity ?? DEFAULT_PATTERN.opacity!) : DEFAULT_PATTERN.opacity!,
      technique: a.kind !== "solid" ? (a.technique ?? DEFAULT_PATTERN.technique!) : DEFAULT_PATTERN.technique!,
    }),
  )

  const sizeOpt = makeFieldProxy<number>(
    local,
    DEFAULT_PATTERN.size!,
    (a) => isPat(a) ? (a.size ?? DEFAULT_PATTERN.size!) : DEFAULT_PATTERN.size!,
    (a, v) => ({
      kind: "pattern",
      path: isPat(a) ? a.path : DEFAULT_PATTERN.path,
      size: v,
      opacity: isPat(a) ? (a.opacity ?? DEFAULT_PATTERN.opacity!) : DEFAULT_PATTERN.opacity!,
      technique: a.kind !== "solid" ? (a.technique ?? DEFAULT_PATTERN.technique!) : DEFAULT_PATTERN.technique!,
    }),
  )

  const opacityOpt = makeFieldProxy<number>(
    local,
    DEFAULT_PATTERN.opacity!,
    (a) => isPat(a) ? (a.opacity ?? DEFAULT_PATTERN.opacity!) : DEFAULT_PATTERN.opacity!,
    (a, v) => ({
      kind: "pattern",
      path: isPat(a) ? a.path : DEFAULT_PATTERN.path,
      size: isPat(a) ? (a.size ?? DEFAULT_PATTERN.size!) : DEFAULT_PATTERN.size!,
      opacity: v,
      technique: a.kind !== "solid" ? (a.technique ?? DEFAULT_PATTERN.technique!) : DEFAULT_PATTERN.technique!,
    }),
  )

  const techniqueOpt = makeFieldProxy<ImageTechnique>(
    local,
    DEFAULT_PATTERN.technique!,
    (a) => isPat(a) ? (a.technique ?? DEFAULT_PATTERN.technique!) : DEFAULT_PATTERN.technique!,
    (a, v) => ({
      kind: "pattern",
      path: isPat(a) ? a.path : DEFAULT_PATTERN.path,
      size: isPat(a) ? (a.size ?? DEFAULT_PATTERN.size!) : DEFAULT_PATTERN.size!,
      opacity: isPat(a) ? (a.opacity ?? DEFAULT_PATTERN.opacity!) : DEFAULT_PATTERN.opacity!,
      technique: v,
    }),
  )

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
      <Option title="Pattern image" subtitle="Pick the pattern source file" opt={pathOpt} type="image" />
      <Option title="Tile size" subtitle="Tile size in px" opt={sizeOpt} type="number" min={1} max={512} increment={1} />
      <Option title="Opacity" subtitle="0 – 100" opt={opacityOpt} type="number" min={0} max={100} increment={1} />
      <Option title="Technique" subtitle="Filter applied after loading" opt={techniqueOpt} type="enum" values={TECHNIQUES} />
    </box>
  )
}

// ─── Editor panel ─────────────────────────────────────────────────────────────

function AssetEditorPanel({
  local,
  snapshots,
}: {
  local: Opt<VisualAsset>
  snapshots: Snapshots
}): JSX.Element {
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={8} class="asset-editor-panel">
      <KindTabs local={local} snapshots={snapshots} />
      <stack
        transitionType={Gtk.StackTransitionType.CROSSFADE}
        transitionDuration={120}
        $={(self) => {
          self.set_visible_child_name(local.get().kind)
          const unsub = local.subscribe(() => self.set_visible_child_name(local.get().kind))
          onCleanup(() => unsub())
        }}
      >
        <box $type="named" name="solid">   <SolidEditor local={local} /></box>
        <box $type="named" name="image">   <ImageEditor local={local} /></box>
        <box $type="named" name="pattern"> <PatternEditor local={local} /></box>
      </stack>
    </box>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export const AssetSetting = ({ options, label = "Asset" }: AssetSettingProps): JSX.Element => {
  const {
    useLocalBackground,
    localBackground,
    background,
    solidSnapshot,
    imageSnapshot,
    patternSnapshot,
  } = options

  const snapshots: Snapshots = {
    solid: solidSnapshot,
    image: imageSnapshot,
    pattern: patternSnapshot,
  }

  const [editorOpen, setEditorOpen] = createState(false)

  return (
    <box orientation={Gtk.Orientation.VERTICAL} class="asset-setting" spacing={10}>

      {label
        ? <label class="setting-section-label" label={label} halign={Gtk.Align.START} xalign={0} />
        : null}

      <Option
        title="Use local background"
        subtitle="Use the asset below instead of the global background"
        opt={useLocalBackground}
        type="boolean"
      />

      <AssetPreview
        background={background}
        locked={!useLocalBackground.get()}
        onClick={() => {
          if (useLocalBackground.get()) setEditorOpen((v) => !v)
        }}
      />

      <With value={useLocalBackground.as(v => v)}>
        {(isLocal: boolean) =>
          isLocal
            ? <revealer
              revealChild={editorOpen as any}
              transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
              transitionDuration={180}
            >
              <AssetEditorPanel local={localBackground} snapshots={snapshots} />
            </revealer>
            : <label
              class="options-sublabel"
              label="Enable 'Use local background' to edit"
              halign={Gtk.Align.CENTER}
            />
        }
      </With>
    </box>
  )
}

export default AssetSetting

import { opt } from "src/lib/options"
import type { OptExports } from "../types"
import type { VisualAsset } from "src/configuration/types"
import type { SolidAsset, ImageAsset, PatternAsset } from "src/services/assets/types"
import type { Opt } from "src/lib/options/opt"

const at = (o: any, path: string) =>
  path.split(".").reduce((acc: any, key: string) => acc?.[key], o)

const DEFAULT_SOLID: SolidAsset = { kind: "solid", color: "#111318", opacity: 100 }
const DEFAULT_IMAGE: ImageAsset = { kind: "image", path: "", technique: "none" }
const DEFAULT_PATTERN: PatternAsset = { kind: "pattern", path: "", size: 80, opacity: 100, technique: "none" }

export interface OverrideVisualAssetResult {
  useLocalBackground: Opt<boolean>
  localBackground: Opt<VisualAsset>
  background: Opt<VisualAsset>
  solidSnapshot: Opt<SolidAsset>
  imageSnapshot: Opt<ImageAsset>
  patternSnapshot: Opt<PatternAsset>
}

export function overrideVisualAsset(params: {
  widgetId: string
  defaultLocal: VisualAsset
  defaultUseLocal?: boolean
  exports?: OptExports
  defaultSolid?: SolidAsset
  defaultImage?: ImageAsset
  defaultPattern?: PatternAsset
}): OverrideVisualAssetResult {
  const {
    widgetId,
    defaultLocal,
    defaultUseLocal = false,
    exports = {},
    defaultSolid = DEFAULT_SOLID,
    defaultImage = DEFAULT_IMAGE,
    defaultPattern = DEFAULT_PATTERN,
  } = params

  // Seed the snapshot for the initial kind from defaultLocal
  const seedSolid: SolidAsset = defaultLocal.kind === "solid" ? defaultLocal as SolidAsset : defaultSolid
  const seedImage: ImageAsset = defaultLocal.kind === "image" ? defaultLocal as ImageAsset : defaultImage
  const seedPattern: PatternAsset = defaultLocal.kind === "pattern" ? defaultLocal as PatternAsset : defaultPattern

  return {
    useLocalBackground: opt(defaultUseLocal),
    localBackground: opt<VisualAsset>(defaultLocal),
    solidSnapshot: opt<SolidAsset>(seedSolid),
    imageSnapshot: opt<ImageAsset>(seedImage),
    patternSnapshot: opt<PatternAsset>(seedPattern),

    background: opt<VisualAsset>(defaultLocal, {
      ...exports,
      runtime: true,
      deps: [
        "global.background",
        `${widgetId}.useLocalBackground`,
        `${widgetId}.localBackground`,
      ] as any,
      derive: ({ root }: { root: any }) => {
        const w = at(root, widgetId)
        return w.useLocalBackground.value
          ? w.localBackground.value
          : root.global.background.value
      },
    }),
  }
}

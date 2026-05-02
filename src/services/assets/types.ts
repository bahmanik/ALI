export type AssetTransformation =
  | { type: "none" }
  | { type: "negative" }
  | { type: "grayscale" }
  | { type: "sepia" }
  | { type: "blur"; radius: number }
  | { type: "opacity"; value: number }

export type SolidAsset = {
  kind: "solid"
  color: string
}

export type ImageAsset = {
  kind: "image"
  path: string
  transformations?: AssetTransformation[]
}

export type PatternAsset = {
  kind: "pattern"
  path: string
  size?: number
  opacity?: number
}

export type VisualAsset = SolidAsset | ImageAsset | PatternAsset

export type ResolvedAsset = {
  asset: VisualAsset
  renderPath?: string
}

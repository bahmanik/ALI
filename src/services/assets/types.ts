export type ImageTechnique = "none" | "negative" | "grayscale" | "sepia"

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
  opacity?: number
}

export type ImageAsset = {
  kind: "image"
  path: string
  technique?: ImageTechnique
  transformations?: AssetTransformation[]
}

export type PatternAsset = {
  kind: "pattern"
  path: string
  size?: number
  opacity?: number
  technique?: ImageTechnique
  transformations?: AssetTransformation[]
}

export type VisualAsset = SolidAsset | ImageAsset | PatternAsset

export type ResolvedAsset = {
  asset: VisualAsset
  renderPath?: string | null
}

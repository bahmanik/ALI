import type { Opt } from "src/lib/options"
import type { OverrideVisualAssetResult } from "src/lib/options/factories/overrideVisualAsset"

export interface BarCornerOptions extends OverrideVisualAssetResult {
  enable: Opt<boolean>
  gap: Opt<number>
  edge: Opt<number>
  radius: Opt<number>
}


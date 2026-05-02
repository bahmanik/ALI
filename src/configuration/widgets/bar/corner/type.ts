import type { VisualAsset } from "src/configuration/types"
import type { Opt } from "src/lib/options"

export interface BarCornerOptions {
  enable: Opt<boolean>
  gap: Opt<number>
  edge: Opt<number>
  radius: Opt<number>

  background: Opt<VisualAsset>

  // compatibility / convenience values can stay in config UI later,
  // but the widget now consumes only a resolved VisualAsset.
}

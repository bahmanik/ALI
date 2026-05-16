import type { Opt } from "src/lib/options"
import type { VisualAsset } from "src/configuration/types"

export interface GlobalOptions {
    scale: Opt<number>
    background: Opt<VisualAsset>
}

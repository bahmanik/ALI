import { Opt } from "src/lib/options"
import { ResourceLabelType } from "src/widget/bar/triggers/storage/options"
import { CircularProgressOptions } from "src/widget/shared/circularProgress/type"
import { LineGraphOptions } from "src/widget/shared/lineGraph/type"

export interface CpuOptions {
  // ── module ────────────────────────────────────────────────────────────────
  enable: Opt<boolean>
  pollingInterval: Opt<number>
  label: Opt<boolean>
  labelType: Opt<ResourceLabelType>
  icon: Opt<string>
  round: Opt<boolean>
  showGraph: Opt<boolean>
  graphHistory: Opt<number>

  // ── sub-option trees ──────────────────────────────────────────────────────
  ring: CircularProgressOptions
  graph: LineGraphOptions
}

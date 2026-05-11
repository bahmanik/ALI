import { opt } from "src/lib/options"
import { overrideCircularProgress } from "src/lib/options/factories/overrideCircularProgress"
import { overrideLineGraph } from "src/lib/options/factories/overrideLineGraph"
import type { CpuOptions } from "./type"
import { ResourceLabelType } from "src/widget/bar/bar/modules/storage/options"

const cpu: CpuOptions = {
  // ── module ────────────────────────────────────────────────────────────────
  enable: opt(true),
  pollingInterval: opt(1000),
  label: opt(true),
  labelType: opt<ResourceLabelType>("percentage"),
  icon: opt(""),
  round: opt(true),
  showGraph: opt(true),
  graphHistory: opt(60),

  // ── ring ──────────────────────────────────────────────────────────────────
  ring: overrideCircularProgress({
    defaultVariant: "glow",
    defaultThickness: 4,
    defaultSmoothing: 0.15,
    defaultColor: [0.2, 0.85, 0.5, 1],
    defaultSpringStiffness: 0.05,
    defaultSpringDamping: 0.7,
  }),

  // ── graph ─────────────────────────────────────────────────────────────────
  graph: overrideLineGraph({
    defaultVariant: "wave",
    defaultWidth: 120,
    defaultHeight: 36,
    defaultColor: [0.2, 0.85, 0.5, 1],
    defaultSmoothing: 0.15,
  }),
}

export default cpu

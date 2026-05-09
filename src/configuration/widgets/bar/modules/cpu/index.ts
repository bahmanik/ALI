import { opt } from "src/lib/options";
import { overrideCircularProgress } from "src/lib/options/factories/overrideCircularProgress";
import type { CpuOptions } from "./type";
import { ResourceLabelType } from "src/widget/bar/bar/modules/storage/options";

const cpu: CpuOptions = {
  // ── Visibility & polling ──────────────────────────────────────────────
  enable: opt(true),
  pollingInterval: opt(1000),

  // ── Label ─────────────────────────────────────────────────────────────
  label: opt(true),
  labelType: opt<ResourceLabelType>("percentage"),
  icon: opt(""),        // Nerd Font CPU glyph
  round: opt(true),

  // ── Circular-progress visual overrides ────────────────────────────────
  ...overrideCircularProgress(),
};

export default cpu;

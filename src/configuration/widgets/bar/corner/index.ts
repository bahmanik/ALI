import { overrideVisualAsset } from "src/lib/options/factories/overrideVisualAsset"
import { opt } from "src/lib/options"
import type { BarCornerOptions } from "./type"

const corner: BarCornerOptions = {
  enable: opt(true, { scss: true }),
  gap: opt(0, { scss: true }),
  edge: opt(0, { scss: true }),
  radius: opt(12, { scss: true }),

  // Three flat opts — no hidden backing, no derive interception:
  //   useLocalBackground  →  whether to use localBackground or global.background
  //   localBackground     →  the locally-stored asset (persisted to disk normally)
  //   background          →  derived, runtime, consumed by the Corner widget
  ...overrideVisualAsset({
    widgetId: "bar.corner",
    defaultUseLocal: true,
    defaultLocal: {
      kind: "pattern",
      path: "/home/ali/.config/ALI/patter.jpg",
      size: 80,
      opacity: 100,
      technique: "none",
    },
  }),
}

export default corner

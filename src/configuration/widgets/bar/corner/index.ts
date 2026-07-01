import { overrideVisualAsset } from "src/lib/options/factories/overrideVisualAsset"
import { opt } from "src/lib/options"
import type { BarCornerOptions } from "./type"

const corner: BarCornerOptions = {
  enable: opt(true, { scss: true }),
  gap: opt(0, { scss: true }),
  edge: opt(0, { scss: true }),
  radius: opt(12, { scss: true }),

  ...overrideVisualAsset({
    widgetId: "bar.corner",
    defaultUseLocal: true,
    defaultLocal: {
      kind: "solid",
      color: "#010101",
      opacity: 100,
    },
  }),
}

export default corner

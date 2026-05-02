import { overrideVisualAsset } from "src/lib/options/factories/overrideVisualAsset"
import { opt } from "src/lib/options"
import type { BarCornerOptions } from "../../corner/type"

const window: BarCornerOptions = {
  enable: opt(true, { scss: true }),
  gap: opt(0, { scss: true }),
  edge: opt(0, { scss: true }),
  radius: opt(12, { scss: true }),

  background: overrideVisualAsset({
    widgetId: "bar.corner",
    defaultUseLocal: true,
    defaultLocal: {
      kind: "image",
      path: "/home/ali/.config/ALI/background1",
      technique: "none",
    },
    defaultRemote: ({ display }) => ({
      kind: "image",
      path: display.wallpaper.file.value,
      technique: "none",
    }),
    deps: ["display.wallpaper.file"],
  }).background,
}

export default window

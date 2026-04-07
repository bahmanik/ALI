import { overrideImage } from "src/lib/options/factories/overrideImage";
import { overridePattern } from "src/lib/options/factories/overridePattern";
import { opt } from "src/lib/options";
import type { BarCornerOptions } from "./type";
import type { CornerFill } from "src/configuration/types";

const corner: BarCornerOptions = {
  enable: opt(true, { scss: true }),
  gap: opt(0, { scss: true }),
  edge: opt(0, { scss: true }),
  radius: opt(12, { scss: true }),

  /**
   * How the outer area is painted.
   * - image: use outerImage (+ optional technique)
   * - solid: fill with solidColor and then punch the inner hole
   */
  fill: opt<CornerFill>("solid", { scss: true }),
  ...overrideImage({
    widgetId: 'bar.corner',
    defaultUseLocal: true,
    defaultLocal: "/home/ali/.config/ALI/background1",
    exports: {
      outerImage: { scss: true }
    },
  }),

  ...overridePattern({
    widgetId: 'bar.corner',
    defaultEnable: true,
    defaultUseLocal: true,
    defaultLocal: { path: "/home/ali/.config/ALI/patter.jpg", size: 12 },
  }),
}
export default corner;

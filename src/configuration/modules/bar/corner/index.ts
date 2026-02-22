import { stem, graft } from "src/configuration/helper";
import { overrideImage } from "src/lib/options/factories/overrideImage";
import { overridePattern } from "src/lib/options/factories/overridePattern";
import type { CornerFill, HexColor } from "src/lib/options/types";
import type { BarCornerOptions } from "./type";

const corner = stem((opt): BarCornerOptions =>
  graft(
    {
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
      solidColor: opt<HexColor>("#111318", { scss: true }),
      solidOpacity: opt(100, { scss: true }), // 0..100
    },
    overrideImage(opt, {
      defaultUseLocal: true,
      defaultLocal: "/home/ali/.config/ALI/background1",
      exports: {
        outerImage: { scss: true }
      },
    }),
    overridePattern(opt, {
      defaultEnable: true,
      defaultUseLocal: true,
      defaultLocal: { path: "/home/ali/.config/ALI/patter.jpg", size: 12 },
    }),
  )
);

export default corner;

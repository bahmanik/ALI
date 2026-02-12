import { stem, graft } from "src/configuration/helper";
import { overrideImage } from "src/lib/options/factories/overrideImage";
import { overridePattern } from "src/lib/options/factories/overridePattern";

const corner = stem((opt) =>
  graft(
    {
      enable: opt(true, { scss: true }),
      gap: opt(2, { scss: true }),
      edge: opt(0, { scss: true }),
      radius: opt(18, { scss: true }),
    },
    overrideImage(opt, {
      widgetId: "bar.corner",
      exports: { outerImage: { scss: true } },
    }),
    overridePattern(opt, {
      widgetId: "bar.corner",
      defaultLocal: { path: "none", size: 12 },
    }),
  )
);

export type BarCornerOptions = ReturnType<typeof corner>;
export default corner;

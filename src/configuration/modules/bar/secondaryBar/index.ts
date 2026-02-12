import { stem, graft } from "src/configuration/helper";
import { overrideScale } from "src/lib/options/factories/overrideScale";
import { overridePattern } from "src/lib/options/factories/overridePattern";
import type { BarLocation } from "src/lib/options/types";

const secondaryBar = stem((opt) =>
  graft(
    {
      enable: opt(true),
      position: opt<BarLocation>("left", { scss: true, hyprland: true }),
      margin: opt<number[]>([0, 0, 0, 0]),
    },
    overrideScale(opt, {
      widgetId: "bar.secondaryBar",
      defaultLocal: 12,
      exports: { scss: true },
    }),
    overridePattern(opt, {
      widgetId: "bar.secondaryBar",
      defaultLocal: { path: "none", size: 12 },
    }),
  )
);

export type SecondaryBarOptions = ReturnType<typeof secondaryBar>;
export default secondaryBar;

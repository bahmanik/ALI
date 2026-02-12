import { graft, stem, twig } from "src/configuration/helper";
import type { BarLocation } from "src/lib/options/types";
import { overrideScale } from "src/lib/options/factories/overrideScale";
import { overridePattern } from "src/lib/options/factories/overridePattern";

import corner from "./corner";
import secondaryBar from "./secondaryBar";

const bar = stem((opt) =>
  graft(
    {
      position: opt<BarLocation>("top", { scss: true, hyprland: true }),
      margin: opt<number[]>([0, 0, 0, 0]),

      secondaryBar: secondaryBar(twig(opt)),
      corner: corner(twig(opt)),
    },
    overrideScale(opt, {
      widgetId: "bar",
      defaultLocal: 12,
      exports: { scss: true },
    }),
    overridePattern(opt, {
      widgetId: "bar",
      defaultLocal: { path: "none", size: 12 },
    }),
  )
);

export type BarOptions = ReturnType<typeof bar>;

declare module "src/lib/options/root" {
  interface OptionsRoot {
    bar: BarOptions;
  }
}

export default bar;

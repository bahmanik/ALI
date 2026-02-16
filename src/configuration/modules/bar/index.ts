import { graft, stem, twig } from "src/configuration/helper";
import type { BarBorderLocation, BarLocation, HexColor } from "src/lib/options/types";
import { overrideScale } from "src/lib/options/factories/overrideScale";
import { overridePattern } from "src/lib/options/factories/overridePattern";

import corner from "./corner";
import secondaryBar from "./secondaryBar";

const bar = stem((opt) =>
  graft(
    {
      position: opt<BarLocation>("top", { scss: true, hyprland: true }),
      margin: opt<number[]>([0, 0, 0, 0]),

      /** Visual styling options (exported to SCSS). Inspired by HyprPanel's bar theming knobs. */
      style: {
        floating: opt(false, { scss: true }),
        transparent: opt(false, { scss: true }),

        // background
        bg: opt<HexColor>("#1d2024", { scss: true }),
        bgOpacity: opt(80, { scss: true }), // 0..100

        // geometry
        height: opt(36, { scss: true }), // px
        radius: opt(16, { scss: true }), // px
        paddingX: opt(0, { scss: true }), // px
        paddingY: opt(0, { scss: true }), // px
        marginTop: opt(8, { scss: true }), // px (inside the window)
        marginBottom: opt(8, { scss: true }), // px (inside the window)
        marginSides: opt(10, { scss: true }), // px (inside the window)

        // border
        borderEnable: opt(false, { scss: true }),
        borderLocation: opt<BarBorderLocation>("full", { scss: true }),
        borderWidth: opt(1, { scss: true }), // px
        borderColor: opt<HexColor>("#8d9199", { scss: true }),

        // shadow
        shadowEnable: opt(true, { scss: true }),
        shadowMargin: opt(8, { scss: true }), // px (space reserved for blur)
        shadowX: opt(0, { scss: true }), // px
        shadowY: opt(10, { scss: true }), // px
        shadowBlur: opt(24, { scss: true }), // px
        shadowSpread: opt(0, { scss: true }), // px
        shadowColor: opt("rgba(0,0,0,0.35)", { scss: true }),
      },

      /** Button-ish widgets inside the bar (buttons / menubuttons). */
      buttons: {
        bg: opt<HexColor>("#1d2024", { scss: true }),
        bgOpacity: opt(45, { scss: true }), // 0..100
        bgHoverOpacity: opt(70, { scss: true }), // 0..100

        radius: opt(12, { scss: true }), // px
        spacing: opt(4, { scss: true }), // px (horizontal spacing)
        paddingX: opt(2, { scss: true }), // px
        paddingY: opt(2, { scss: true }), // px
      },

      secondaryBar: secondaryBar(twig(opt)),
      corner: corner(twig(opt)),
    },
    overrideScale(opt, {
      defaultLocal: 12,
      exports: { scss: true },
    }),
    overridePattern(opt, {
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

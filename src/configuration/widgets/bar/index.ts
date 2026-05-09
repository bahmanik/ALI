import corner from "./corner";
import secondaryBar from "./secondaryBar";
import barModules from "./modules";
import { overrideScale } from "src/lib/options/factories/overrideScale";
import { opt } from "src/lib/options";
import type { BarBorderLocation, BarLocation, HexColor } from "src/configuration/types";
import type { BarOptions } from "./type";

const bar: BarOptions = {
  position: opt<BarLocation>("top", { scss: true, hyprland: true }),
  margin: opt<number[]>([0, 0, 0, 0]),
  secondaryBar: secondaryBar,
  corner: corner,
  modules: barModules,

  style: {
    floating: opt(false, { scss: true }),
    transparent: opt(false, { scss: true }),

    bg: opt<HexColor>("#1d2024", { scss: true }),
    bgOpacity: opt(80, { scss: true }),

    height: opt(36, { scss: true }),
    radius: opt(16, { scss: true }),
    paddingX: opt(0, { scss: true }),
    paddingY: opt(0, { scss: true }),
    marginTop: opt(8, { scss: true }),
    marginBottom: opt(8, { scss: true }),
    marginSides: opt(10, { scss: true }),

    borderEnable: opt(false, { scss: true }),
    borderLocation: opt<BarBorderLocation>("full", { scss: true }),
    borderWidth: opt(1, { scss: true }),
    borderColor: opt<HexColor>("#8d9199", { scss: true }),

    shadowEnable: opt(true, { scss: true }),
    shadowMargin: opt(8, { scss: true }),
    shadowX: opt(0, { scss: true }),
    shadowY: opt(10, { scss: true }),
    shadowBlur: opt(24, { scss: true }),
    shadowSpread: opt(0, { scss: true }),
    shadowColor: opt("rgba(0,0,0,0.35)", { scss: true }),
  },

  buttons: {
    bg: opt<HexColor>("#1d2024", { scss: true }),
    bgOpacity: opt(45, { scss: true }),
    bgHoverOpacity: opt(70, { scss: true }),

    radius: opt(12, { scss: true }),
    spacing: opt(4, { scss: true }),
    paddingX: opt(0, { scss: true }),
    paddingY: opt(0, { scss: true }),
  },

  ...overrideScale({
    widgetId: "bar",
    defaultLocal: 12,
    exports: { scss: true },
  }),
};

declare module "src/lib/options/root" {
  interface OptionsRoot {
    bar: BarOptions;
  }
}

export default bar;

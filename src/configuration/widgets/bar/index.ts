import corner from "./corner";
import secondaryBar from "./secondaryBar";
import barModules from "./modules";
import { overrideScale } from "src/lib/options/factories/overrideScale";
import { opt } from "src/lib/options";
import { RgbaColor, type BarBorderLocation, type BarLocation, type HexColor } from "src/configuration/types";
import type { BarOptions, BarSlotLayout } from "./type";

const defaultLayout: BarSlotLayout = {
  start: [
    { kind: "trigger", id: "n_ws", triggerWidget: "Workspaces", children: [], menuMinimumWidth: 0 },
    { kind: "trigger", id: "n_wt", triggerWidget: "Windowtitle", children: [], menuMinimumWidth: 0 },
  ],
  center: [
    { kind: "trigger", id: "n_cl", triggerWidget: "Clock", children: [], menuMinimumWidth: 0 },
  ],
  end: [
    { kind: "trigger", id: "n_tr", triggerWidget: "Tray", children: [], menuMinimumWidth: 0 },
    {
      kind: "trigger", id: "n_vol", triggerWidget: "Volume",
      children: [{ kind: "menu-widget", id: "n_vol_m", widget: "Volume" }],
      menuMinimumWidth: 410,
    },
    {
      kind: "trigger", id: "n_net", triggerWidget: "Wireless",
      children: [{
        kind: "menu-container", id: "n_net_co", direction: "horizontal", spacing: 16, minimumWidth: 16,
        children: [
          { kind: "menu-widget", id: "n_net_m", widget: "Wireless" },
          { kind: "menu-widget", id: "n_net_m2", widget: "Wireless" },
        ],
      }],
      menuMinimumWidth: 410,
    },
    {
      kind: "trigger", id: "n_bat", triggerWidget: "Battery",
      children: [{ kind: "menu-widget", id: "n_bat_m", widget: "Battery" }],
      menuMinimumWidth: 0,
    },
  ],
}

const bar: BarOptions = {
  position: opt<BarLocation>("top", { scss: true, hyprland: true }),
  margin: opt<number[]>([0, 0, 0, 0]),
  secondaryBar: secondaryBar,
  corner: corner,
  modules: {
    ...barModules,
    defaultLayout: opt<BarSlotLayout>(defaultLayout),
    monitorLayouts: opt<Record<string, BarSlotLayout>>({}),
    mirrorFirstMonitor: opt<boolean>(false),
  },

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
    shadowColor: opt<RgbaColor>("rgba(0,0,0,0.35)", { scss: true }),
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

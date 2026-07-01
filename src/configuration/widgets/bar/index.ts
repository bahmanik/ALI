import corner from "./corner";
import secondaryBar from "./secondaryBar";
import barModules from "./modules";
import { overrideScale } from "src/lib/options/factories/overrideScale";
import { opt } from "src/lib/options";
import type { BarOptions, BarSlotLayout } from "./type";
import { BarLocationType } from "src/configuration/enums";
import { overrideContainer } from "src/lib/options/factories/overrideContainer";
import { overrideInteractiveSurface } from "src/lib/options/factories/overrideInteractiveSurface";

export const barDefaultLayout: BarSlotLayout = {
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
      children: [
          { kind: "menu-widget", id: "n_net_m", widget: "Wireless" },
      ],
      menuMinimumWidth: 0,
    },
    {
      kind: "trigger", id: "n_bat", triggerWidget: "Battery",
      children: [{ kind: "menu-widget", id: "n_bat_m", widget: "Battery" }],
      menuMinimumWidth: 0,
    },
  ],
}

const bar: BarOptions = {
  position: opt<BarLocationType>("top", { scss: true, hyprland: true }),
  secondaryBar: secondaryBar,
  corner: corner,

  modules: {
    ...barModules,
    defaultLayout: opt<BarSlotLayout>(barDefaultLayout),
    monitorLayouts: opt<Record<string, BarSlotLayout>>({}),
    mirrorFirstMonitor: opt<boolean>(false),
  },

  style: {
    floating: opt(false, { scss: true }),
    transparent: opt(false, { scss: true }),

    height: opt(36, { scss: true }),
    ...overrideContainer({})
  },

  buttons: overrideInteractiveSurface({}),

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

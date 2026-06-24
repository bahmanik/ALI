import { overrideScale } from "src/lib/options/factories/overrideScale";
import { opt } from "src/lib/options";
import type { SecondaryBarOptions } from "./type";
import type { BarLocationType } from "src/configuration/enums";
import { overrideContainer } from "src/lib/options/factories/overrideContainer";
import { overrideInteractiveSurface } from "src/lib/options/factories/overrideInteractiveSurface";
import type { BarSlotLayout } from "../type";
import { barDefaultLayout } from "..";
import barModules from "../modules";

const secondaryBar: SecondaryBarOptions = {
  enable: opt(false),
  position: opt<BarLocationType>("left", { scss: true, hyprland: true }),

  modules: {
    ...barModules,
    defaultLayout: opt<BarSlotLayout>(barDefaultLayout),
    monitorLayouts: opt<Record<string, BarSlotLayout>>({}),
    mirrorFirstMonitor: opt<boolean>(false),
  },

  style: {
    floating: opt(true, { scss: true }),
    transparent: opt(false, { scss: true }),

    height: opt(36, { scss: true }),
    ...overrideContainer({})
  },

  buttons: overrideInteractiveSurface({}),

  ...overrideScale({
    widgetId: 'bar.secondaryBar',
    defaultLocal: 12,
    exports: { scss: true },
  }),
}

export default secondaryBar;

import { opt } from "src/lib/options";
import type { LauncherOptions } from "./type";
import type {
  GtkRevealerTransitionName,
  ModuleMapArray,
} from "src/configuration/types";
import { colorWithAlpha } from "src/lib/options/factories/colorWithAlpha";
import { overrideContainer } from "src/lib/options/factories/overrideContainer";
import { overridePopupWindow } from "src/lib/options/factories/overridePopupWindow";
import { overrideGrid } from "src/lib/options/factories/overrideGrid";

const launcher: LauncherOptions = {
  maxItems: opt(5),

  grid: overrideGrid({}),
  window: overridePopupWindow({}),
  style: overrideContainer({}),

  entry: {
    placeholder: opt("Search…"),
    height: opt(44, { scss: true }),
    radius: opt(14, { scss: true }),
    paddingX: opt(12, { scss: true }),
    paddingY: opt(10, { scss: true }),
    spacing: opt(0, { scss: true }),

    bg: colorWithAlpha({ color: "#111318", alpha: 0.70 }),
    hoverOpacity: opt(0, { scss: true }),

    borderEnable: opt(false, { scss: true }),
    borderWidth: opt(1, { scss: true }),
    borderColor: colorWithAlpha({ color: "#8d9199", alpha: 1 }),
  },

  list: {
    spacing: opt(8, { scss: true }),
    radius: opt(14, { scss: true }),
    paddingX: opt(12, { scss: true }),
    paddingY: opt(10, { scss: true }),
    itemGap: opt(14, { scss: true }), // icon <-> text

    bg: colorWithAlpha({ color: "#111318", alpha: 0 }), // transparent until hover
    hoverOpacity: opt(0.55, { scss: true }),
    activeOpacity: opt(0.75, { scss: true }),

    showDescription: opt(true),
  },

  icons: {
    app: opt(36, { scss: true }),
    favorite: opt(42, { scss: true }),
  },

  favoritesUI: {
    spacing: opt(10, { scss: true }),
    radius: opt(14, { scss: true }),
    bg: colorWithAlpha({ color: "#111318", alpha: 0.35 }),
    hoverOpacity: opt(0.55, { scss: true }),
    paddingX: opt(0, { scss: true }),
    paddingY: opt(0, { scss: true }),
  },

  animateResults: opt<GtkRevealerTransitionName>("CROSSFADE"),
  animateDuration: opt(0.4),
  animInDelayMs: opt(0),

  showFavorites: opt(true),
  favorites: opt([
    "kitty",
    "Zen Browser",
    "Heroic Games Launcher",
    "Hiddify",
    "Dolphin",
  ]),
};

declare module "src/lib/options/root" {
  interface OptionsRoot {
    launcher: LauncherOptions;
  }
}

export default launcher;

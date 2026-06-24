import { opt } from "src/lib/options";
import type { LauncherOptions } from "./type";
import { overrideContainer } from "src/lib/options/factories/overrideContainer";
import { overridePopupWindow } from "src/lib/options/factories/overridePopupWindow";
import { overrideGrid } from "src/lib/options/factories/overrideGrid";
import { overrideBorder } from "src/lib/options/factories/overrideBorder";
import { overrideInteractiveSurface } from "src/lib/options/factories/overrideInteractiveSurface";
import type { GtkRevealerTransitionType } from "src/configuration/enums";

const launcher: LauncherOptions = {
  maxItems: opt(5),

  grid: overrideGrid({}),
  window: overridePopupWindow({}),
  style: overrideContainer({}),

  entry: {
    placeholder: opt("Search…"),
    height: opt(44, { scss: true }),
    ...overrideBorder({}),
    ...overrideInteractiveSurface({}),
  },

  list: {
    itemGap: opt(14, { scss: true }), // icon <-> text
    showDescription: opt(true),

    ...overrideInteractiveSurface({})
  },

  icons: {
    app: opt(36, { scss: true }),
    favorite: opt(42, { scss: true }),
  },

  favoritesUI: overrideInteractiveSurface({}),

  animateResults: opt<GtkRevealerTransitionType>("CROSSFADE"),
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

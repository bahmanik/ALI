import type { Opt } from "src/lib/options";
import type {
  ColorWithAlpha,
  GtkRevealerTransitionName,
} from "src/configuration/types";
import { InteractiveSurfaceOptions } from "src/lib/options/factories/overrideInteractiveSurface";
import { PopupWindowOptions } from "src/lib/options/factories/overridePopupWindow";
import { ContainerStyleOptions } from "src/lib/options/factories/overrideContainer";
import { GridLayoutOptions } from "src/lib/options/factories/overrideGrid";
import { BorderOptions } from "src/lib/options/factories/overrideBorder";

export interface LauncherListOptions extends InteractiveSurfaceOptions {
  activeOpacity: Opt<number>; // unique to list
  itemGap: Opt<number>; // unique to list
  showDescription: Opt<boolean>;
}

export interface LauncherEntryOptions extends InteractiveSurfaceOptions, BorderOptions {
  placeholder: Opt<string>;
  height: Opt<number>;
}

export interface LauncherOptions {
  window: PopupWindowOptions;
  style: ContainerStyleOptions;
  entry: LauncherEntryOptions;
  list: LauncherListOptions;
  favoritesUI: InteractiveSurfaceOptions;
  grid: GridLayoutOptions;

  icons: {
    app: Opt<number>;
    favorite: Opt<number>;
  };

  animateResults: Opt<GtkRevealerTransitionName>;
  animateDuration: Opt<number>;
  animInDelayMs: Opt<number>;
  maxItems: Opt<number>;
  showFavorites: Opt<boolean>;
  favorites: Opt<string[]>;
}

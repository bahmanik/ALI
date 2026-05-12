import type { GtkRevealerTransitionName, HexColor, LauncherBorderLocation, ModuleMapArray, RevealTransitionWithAuto, RgbaColor } from "src/configuration/types";
import type { Opt } from "src/lib/options";

export interface LauncherOptions {
  localScale: Opt<boolean>;
  scale: Opt<number>;
  revealTransition: Opt<RevealTransitionWithAuto>;
  transitionDuration: Opt<number>;
  maxItems: Opt<number>;

  grid: {
    rows: Opt<number>,
    cols: Opt<number>,
    modulesList: Opt<ModuleMapArray>,
  }

  window: {
    width: Opt<number>;
    height: Opt<number>;
    margin: Opt<number>;
  };

  style: {
    bg: Opt<HexColor>;
    bgOpacity: Opt<number>;
    radius: Opt<number>;
    padding: Opt<number>;

    borderEnable: Opt<boolean>;
    borderLocation: Opt<LauncherBorderLocation>;
    borderWidth: Opt<number>;
    borderColor: Opt<HexColor>;

    shadowEnable: Opt<boolean>;
    shadowX: Opt<number>;
    shadowY: Opt<number>;
    shadowBlur: Opt<number>;
    shadowSpread: Opt<number>;
    shadowColor: Opt<RgbaColor>;
  };

  entry: {
    placeholder: Opt<string>;
    height: Opt<number>;
    radius: Opt<number>;
    paddingX: Opt<number>;
    paddingY: Opt<number>;

    bg: Opt<HexColor>;
    bgOpacity: Opt<number>;

    borderEnable: Opt<boolean>;
    borderWidth: Opt<number>;
    borderColor: Opt<HexColor>;
  };

  list: {
    spacing: Opt<number>;
    itemRadius: Opt<number>;
    itemPaddingX: Opt<number>;
    itemPaddingY: Opt<number>;
    itemGap: Opt<number>;

    itemBg: Opt<HexColor>;
    itemBgOpacity: Opt<number>;
    itemHoverOpacity: Opt<number>;
    itemActiveOpacity: Opt<number>;

    showDescription: Opt<boolean>;
  };

  icons: {
    app: Opt<number>;
    favorite: Opt<number>;
  };

  favoritesUI: {
    spacing: Opt<number>;
    radius: Opt<number>;
    bg: Opt<HexColor>;
    bgOpacity: Opt<number>;
    hoverOpacity: Opt<number>;
  };

  animateResults: Opt<GtkRevealerTransitionName>;
  animateDuration: Opt<number>
  animInDelayMs: Opt<number>;

  showFavorites: Opt<boolean>;
  favorites: Opt<string[]>;
}

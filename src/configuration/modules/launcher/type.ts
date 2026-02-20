import type { Opt } from "src/lib/options";
import type { HexColor, LauncherRevealTransition } from "src/lib/options/types";

export interface LauncherOptions {
  localScale: Opt<boolean>;
  scale: Opt<number>;
  revealTransition: Opt<LauncherRevealTransition>;
  maxItems: Opt<number>;

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
    borderLocation: Opt<"none" | "full">;
    borderWidth: Opt<number>;
    borderColor: Opt<HexColor>;

    shadowEnable: Opt<boolean>;
    shadowX: Opt<number>;
    shadowY: Opt<number>;
    shadowBlur: Opt<number>;
    shadowSpread: Opt<number>;
    shadowColor: Opt<string>;
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

  animateResults: Opt<boolean>;
  transitionDuration: Opt<number>;
  animInDelayMs: Opt<number>;

  showFavorites: Opt<boolean>;
  favorites: Opt<string[]>;
}

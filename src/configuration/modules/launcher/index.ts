import { stem } from "src/configuration/helper";
import type { HexColor, LauncherRevealTransition } from "src/lib/options/types";

type LauncherBorderLocation = "none" | "full";

const launcher = stem((opt) => ({
  localScale: opt(true),
  scale: opt(12, { scss: true, hyprland: true }),
  revealTransition: opt<LauncherRevealTransition>("SWING_DOWN"),
  maxItems: opt(5),

  // --- Window + panel theming (SCSS exported) ---
  window: {
    width: opt(520, { scss: true }),
    height: opt(560, { scss: true }), // clamp heightRequest
    margin: opt(12, { scss: true }),
  },

  style: {
    bg: opt<HexColor>("#1d2024", { scss: true }),
    bgOpacity: opt(92, { scss: true }), // 0..100
    radius: opt(18, { scss: true }),
    padding: opt(12, { scss: true }),

    borderEnable: opt(false, { scss: true }),
    borderLocation: opt<LauncherBorderLocation>("full", { scss: true }),
    borderWidth: opt(1, { scss: true }),
    borderColor: opt<HexColor>("#8d9199", { scss: true }),

    shadowEnable: opt(true, { scss: true }),
    shadowX: opt(0, { scss: true }),
    shadowY: opt(18, { scss: true }),
    shadowBlur: opt(42, { scss: true }),
    shadowSpread: opt(0, { scss: true }),
    shadowColor: opt("rgba(0,0,0,0.45)", { scss: true }),
  },

  entry: {
    placeholder: opt("Search…"),
    height: opt(44, { scss: true }),
    radius: opt(14, { scss: true }),
    paddingX: opt(12, { scss: true }),
    paddingY: opt(10, { scss: true }),

    bg: opt<HexColor>("#111318", { scss: true }),
    bgOpacity: opt(70, { scss: true }),

    borderEnable: opt(false, { scss: true }),
    borderWidth: opt(1, { scss: true }),
    borderColor: opt<HexColor>("#8d9199", { scss: true }),
  },

  list: {
    spacing: opt(8, { scss: true }),
    itemRadius: opt(14, { scss: true }),
    itemPaddingX: opt(12, { scss: true }),
    itemPaddingY: opt(10, { scss: true }),
    itemGap: opt(14, { scss: true }), // icon <-> text

    itemBg: opt<HexColor>("#111318", { scss: true }),
    itemBgOpacity: opt(0, { scss: true }), // 0 means transparent until hover
    itemHoverOpacity: opt(55, { scss: true }),
    itemActiveOpacity: opt(75, { scss: true }),

    showDescription: opt(true),
  },

  icons: {
    app: opt(36, { scss: true }),
    favorite: opt(42, { scss: true }),
  },

  favoritesUI: {
    spacing: opt(10, { scss: true }),
    radius: opt(14, { scss: true }),
    bg: opt<HexColor>("#111318", { scss: true }),
    bgOpacity: opt(35, { scss: true }),
    hoverOpacity: opt(55, { scss: true }),
  },

  animateResults: opt(true),
  transitionDuration: opt(0.4),
  animInDelayMs: opt(0),

  showFavorites: opt(true),
  favorites: opt([
    "kitty",
    "Zen Browser",
    "Heroic Games Launcher",
    "Hiddify",
    "Dolphin",
  ]),
}));

export type LauncherOptions = ReturnType<typeof launcher>;

declare module "src/lib/options/root" {
  interface OptionsRoot {
    launcher: LauncherOptions;
  }
}

export default launcher;

import { stem } from "src/configuration/helper";
import type { LauncherRevealTransition } from "src/lib/options/types";

const launcher = stem((opt) => ({
  localScale: opt(true),
  scale: opt(12, { scss: true, hyprland: true }),
  revealTransition: opt<LauncherRevealTransition>("SWING_DOWN"),
  maxItems: opt(5),

  animateResults: opt(true),
  animInMs: opt(160),
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

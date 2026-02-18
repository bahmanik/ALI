import { stem } from "src/configuration/helper";
import type { WallpaperOptions } from "./type";
import type { TransitionPos, TransitionType } from "src/lib/options/types";

const wallpaper = stem((opt): WallpaperOptions => ({
  enable: opt(true),
  file: opt(`${CONFIG_DIR}/background`),

  daemon: {
    namespace: opt(""),
    layer: opt<"background" | "bottom">("background"),
    quiet: opt(true),
  },

  transition: {
    enabled: opt(true),
    type: opt<TransitionType>("grow"),
    duration: opt(1.5),
    fps: opt(60),
    invert_y: opt(true),
    pos: opt<TransitionPos>("cursor"),
  },
}));

export default wallpaper;

import { CONFIG_DIR } from "src/lib/session/api";
import type { WallpaperOptions } from "./type";
import type { TransitionType } from "src/configuration/types";
import type { TransitionPosType, WallpaperLayoutType } from "./enums";
import { opt } from "src/lib/options";

const wallpaper: WallpaperOptions = {
    enable: opt(true),
    file: opt(`${CONFIG_DIR}/background`),

    daemon: {
        namespace: opt(""),
        layer: opt<WallpaperLayoutType>("background"),
        quiet: opt(true),
    },

    transition: {
        enabled: opt(true),
        type: opt<TransitionType>("grow"),
        duration: opt(1.5),
        fps: opt(60),
        invert_y: opt(true),
        pos: opt<TransitionPosType>("cursor"),
    },
}

export default wallpaper;

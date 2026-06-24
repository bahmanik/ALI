import type { Opt } from "src/lib/options";
import type { TransitionPosType, TransitionType, WallpaperLayoutType } from "./enums";

export interface WallpaperOptions {
    enable: Opt<boolean>;
    file: Opt<string>;

    daemon: {
        namespace: Opt<string>;
        layer: Opt<WallpaperLayoutType>;
        quiet: Opt<boolean>;
    };

    transition: {
        enabled: Opt<boolean>;
        type: Opt<TransitionType>;
        duration: Opt<number>;
        fps: Opt<number>;
        invert_y: Opt<boolean>;
        pos: Opt<TransitionPosType>;
    };
}

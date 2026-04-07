import type { Opt } from "src/lib/options";
import type { TransitionPos, TransitionType } from "src/configuration/types";

export interface WallpaperOptions {
    enable: Opt<boolean>;
    file: Opt<string>;

    daemon: {
        namespace: Opt<string>;
        layer: Opt<"background" | "bottom">;
        quiet: Opt<boolean>;
    };

    transition: {
        enabled: Opt<boolean>;
        type: Opt<TransitionType>;
        duration: Opt<number>;
        fps: Opt<number>;
        invert_y: Opt<boolean>;
        pos: Opt<TransitionPos>;
    };
}

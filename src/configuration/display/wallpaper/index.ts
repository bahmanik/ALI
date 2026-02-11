import { opt } from "src/lib/options"
import { TransitionPos, TransitionType } from "src/lib/options/types"

export default {
    /** Master toggle for wallpaper management via swww */
    enable: opt(true),

    /** Where the "managed" wallpaper file lives */
    file: opt(`${CONFIG_DIR}/background`),

    daemon: {
        /** Optional swww namespace (empty string = default) */
        namespace: opt(""),

        /** swww-daemon layer: background or bottom */
        layer: opt<"background" | "bottom">("background"),

        /** Keep daemon logs quiet */
        quiet: opt(true),
    },

    transition: {
        enabled: opt(true),
        type: opt<TransitionType>("grow"),
        duration: opt(1.5),
        fps: opt(60),
        invert_y: opt(true),

        /** "cursor" uses Hyprland cursorpos, otherwise use swww aliases */
        pos: opt<TransitionPos>("cursor"),
    },
}

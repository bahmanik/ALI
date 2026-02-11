import { opt } from "src/lib/options"
import { LauncherRevealTransition } from "src/lib/options/types"

export default {
    localScale: opt(true),
    scale: opt(12, { scss: true, hyprland: true }),
    revealTransition: opt<LauncherRevealTransition>("SWING_DOWN"),
    // max results shown in list
    maxItems: opt(5),

    // animate app rows entering (revealer)
    animateResults: opt(true),
    animInMs: opt(160),
    animInDelayMs: opt(0),

    // favorites row
    showFavorites: opt(true),
    favorites: opt(["kitty", "Zen Browser", "Heroic Games Launcher", "Hiddify", "Dolphin"]),
}

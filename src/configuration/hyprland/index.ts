import { opt } from "src/lib/options";

export default {
    enable: opt(false),

    // Hyprland section: general { ... }
    general: {
        gaps_in_enable: opt(true),
        gaps_in: opt(30, { hyprland: true }),
    },
};

import { opt } from "src/lib/options";
import { hyprOpt } from "src/lib/options/factories/hypeOpt";

export default {
    enable: opt(false),

    // Hyprland section: general { ... }
    general: {
        ...hyprOpt("gaps_in", 15),
        ...hyprOpt("gaps_out", 20),
    },

    // Hyprland section: decoration { ... }
    decoration: {
        ...hyprOpt("rounding", 10),
    },
};

import { stem } from "src/configuration/helper";
import { hyprOpt } from "src/lib/options/factories/hypeOpt";
import type { HyprlandOptions } from "./type";

const hyprland = stem((opt): HyprlandOptions => ({
  enable: opt(false),

  general: {
    ...hyprOpt(opt, "gaps_in", 15),
    ...hyprOpt(opt, "gaps_out", 20),
  },

  decoration: {
    ...hyprOpt(opt, "rounding", 10),
  },
}));

export default hyprland;

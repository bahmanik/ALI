import { stem } from "src/configuration/helper";
import { hyprOpt } from "src/lib/options/factories/hypeOpt";

const hyprland = stem((opt) => ({
  enable: opt(false),

  general: {
    ...hyprOpt(opt, "gaps_in", 15),
    ...hyprOpt(opt, "gaps_out", 20),
  },

  decoration: {
    ...hyprOpt(opt, "rounding", 10),
  },
}));

export type HyprlandOptions = ReturnType<typeof hyprland>;

declare module "src/lib/options/root" {
  interface OptionsRoot {
    hyprland: HyprlandOptions;
  }
}

export default hyprland;

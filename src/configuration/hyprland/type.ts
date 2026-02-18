import type { Opt } from "src/lib/options";

export interface HyprlandOptions {
  enable: Opt<boolean>;

  general: {
    gaps_in: Opt<number>;
    gaps_in_enable: Opt<boolean>;
    gaps_out: Opt<number>;
    gaps_out_enable: Opt<boolean>;
  };

  decoration: {
    rounding: Opt<number>;
    rounding_enable: Opt<boolean>;
  };
}

declare module "src/lib/options/root" {
  interface OptionsRoot {
    hyprland: HyprlandOptions;
  }
}

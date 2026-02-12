import type { OptionsRoot, Opt } from "src/lib/options";
import { stem, twig } from "src/configuration/helper";
import brightness from "./brightness";
import type { OsdBrightnessOptions } from "./brightness"; // if you export it

export interface OsdOptions {
  enable: Opt<boolean, OptionsRoot, OsdOptions>;
  brightness: OsdBrightnessOptions;
}

const osd = stem((opt) => ({
  enable: opt(true),
  brightness: brightness(twig(opt)),
}));

declare module "src/lib/options/root" {
  interface OptionsRoot {
    osd: OsdOptions;
  }
}

export default osd;

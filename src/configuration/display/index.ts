import wallpaper from "./wallpaper";
import { stem, twig } from "src/configuration/helper";
import type { DisplayOptions } from "./type";

const display = stem((opt): DisplayOptions => ({
  wallpaper: wallpaper(twig(opt)),
}));

declare module "src/lib/options/root" {
  interface OptionsRoot {
    display: DisplayOptions;
  }
}

export default display;

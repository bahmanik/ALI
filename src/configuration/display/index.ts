import { stem, twig } from "src/configuration/helper";
import wallpaper from "./wallpaper";

const display = stem((opt) => ({
  wallpaper: wallpaper(twig(opt)),
}));

export type DisplayOptions = ReturnType<typeof display>;

declare module "src/lib/options/root" {
  interface OptionsRoot {
    display: DisplayOptions;
  }
}

export default display;

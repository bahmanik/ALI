import wallpaper from "./wallpaper";
import type { DisplayOptions } from "./type";

const display: DisplayOptions = {
    wallpaper: wallpaper,
}

declare module "src/lib/options/root" {
    interface OptionsRoot {
        display: DisplayOptions;
    }
}

export default display;

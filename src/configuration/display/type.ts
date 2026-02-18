import type { WallpaperOptions } from "./wallpaper/type";

export interface DisplayOptions {
  wallpaper: WallpaperOptions;
}

declare module "src/lib/options/root" {
  interface OptionsRoot {
    display: DisplayOptions;
  }
}

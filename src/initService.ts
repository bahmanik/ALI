import { WallpaperService } from "./service/wallpaper/WallpaperService";
// import BrightnessService from "./service/brightness";
import { MatugenPaletteService } from "./service/matugenPalette";

export async function initService() {
  WallpaperService.getInstance().apply();
  MatugenPaletteService.getInstance();
  // const b = BrightnessService.getInstance();
  // b.connect("notify::screen", () => {
  //   console.log("[Brightness] screen changed:", b.screenPercent, "%", b.screen);
  // });
}

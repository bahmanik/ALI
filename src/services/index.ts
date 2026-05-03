import BrightnessService from "./brightness";
import CountdownService from "./countdown";
import { MatugenPaletteService } from "./matugenPalette";
import { WallpaperService } from "./wallpaper";

/**
 * Composition root: single place that wires options -> runtimes.
 *
 * NOTE: services are exposed via getters to avoid import-time construction.
 */
export const services = {
  get brightness(): BrightnessService {
    return BrightnessService.get_default();
  },
  get wallpaper(): WallpaperService {
    return WallpaperService.get_default();
  },
  get matugenPalette(): MatugenPaletteService {
    return MatugenPaletteService.get_default();
  },
  get countdown(): CountdownService {
    return CountdownService.get_default();
  },
};

// TODO: removed — boot is now owned by LifecycleManager (see src/lib/lifecycle)

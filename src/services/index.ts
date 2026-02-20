import BrightnessService from "./brightness";
import CountdownService from "./countdown";
import { MatugenPaletteService } from "./matugenPalette";
import { WallpaperService } from "./wallpaper/WallpaperService";
import { getNetwork } from "./network";

/**
 * Composition root: single place that wires options -> runtimes.
 *
 * NOTE: services are exposed via getters to avoid import-time construction.
 */
export const services = {
  get brightness(): BrightnessService {
    return BrightnessService.getInstance();
  },
  get wallpaper(): WallpaperService {
    return WallpaperService.getInstance();
  },
  get matugenPalette(): MatugenPaletteService {
    return MatugenPaletteService.getInstance();
  },
  get countdown(): CountdownService {
    return CountdownService.getInstance();
  },
  get network() {
    return getNetwork();
  },
};

/**
 * Deterministic startup of startup-critical services.
 * Idempotent by virtue of each service's ensureStarted*().
 */
export async function bootServices(): Promise<void> {
  // Wallpaper was previously started in src/initService.ts (apply() at startup).
  await services.wallpaper.ensureStarted();
  await services.wallpaper.apply();
  // Matugen palette was previously started in src/initService.ts.
  await services.matugenPalette.ensureStarted();

  // Countdown: global actions only. Heavy watchers/timers are widget-owned.
  await services.countdown.ensureStartedMinimal();
}

import { opt } from "src/lib/options";
import { overrideImage } from "src/lib/options/factories/overrideImage";
import { overridePattern } from "src/lib/options/factories/overridePattern";

export default {
    enable: opt(true, { scss: true }),
    gap: opt(2, { scss: true }),
    edge: opt(0, { scss: true }),
    radius: opt(18, { scss: true }),

    ...overrideImage({
        widgetId: "bar.corner",
        // default: inherit from display.wallpaper.file
        defaultUseLocal: false,
        defaultLocal: "",
        defaultEnableTechnique: false,
        defaultTechnique: "none",
        exports: { outerImage: { scss: true } },
    }),

    // Optional pattern overlay config (kept consistent with your factories)
    ...overridePattern({
        widgetId: "bar.corner",
        defaultLocal: { path: "none", size: 12 },
    }),
}

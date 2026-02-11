import { opt } from "src/lib/options";
import { overrideScale } from "src/lib/options/factories/overrideScale";
import { overridePattern } from "src/lib/options/factories/overridePattern";
import { overrideImage } from "src/lib/options/factories/overrideImage";
import { BarLocation } from "src/lib/options/types";

export default {
    position: opt<BarLocation>("top", { scss: true, hyprland: true }),

    margin: opt<number[]>([0, 0, 0, 0]),

    ...overrideScale({
        widgetId: "bar",
        defaultLocal: 12,
        exports: { scss: true },
    }),

    ...overridePattern({
        widgetId: "bar",
        defaultLocal: { path: "none", size: 12 },
    }),

    /** Optional second bar that can be created/destroyed via `enable` */
    secondaryBar: {
        enable: opt(false, { scss: true, hyprland: true }),
        position: opt<BarLocation>("top", { scss: true, hyprland: true }),
        margin: opt<number[]>([0, 0, 0, 0]),

        ...overrideScale({
            widgetId: "bar.secondaryBar",
            defaultLocal: 12,
            exports: { scss: true },
        }),

        ...overridePattern({
            widgetId: "bar.secondaryBar",
            defaultLocal: { path: "none", size: 12 },
        }),
    },

    /** Outer wallpaper frame / corner cutout */
    corner: {
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
    },
};


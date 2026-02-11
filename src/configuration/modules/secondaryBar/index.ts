import { opt } from "src/lib/options";
import { overridePattern } from "src/lib/options/factories/overridePattern";
import { overrideScale } from "src/lib/options/factories/overrideScale";
import { BarLocation } from "src/lib/options/types";

export default {
    position: opt<BarLocation>("top", { scss: true, hyprland: true }),

    margin: opt<number[]>([0, 0, 0, 0]),

    ...overrideScale({
        widgetId: "secondaryBar",
        defaultLocal: 12,
        exports: { scss: true },
    }),

    ...overridePattern({
        widgetId: "secondaryBar",
        defaultLocal: { path: "none", size: 12 },
    })
};


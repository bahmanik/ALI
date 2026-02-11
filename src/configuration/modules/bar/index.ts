import { opt } from "src/lib/options";
import { overrideScale } from "src/lib/options/factories/overrideScale";
import { overridePattern } from "src/lib/options/factories/overridePattern";
import { BarLocation } from "src/lib/options/types";
import corner from "./corner";
import secondaryBar from "./secondaryBar";

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
    secondaryBar,
    /** Outer wallpaper frame / corner cutout */
    corner,
};

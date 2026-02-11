import { opt } from "src/lib/options";
import type { HexColor, MatugenResizeFilter, MatugenType, ThemeMode } from "src/lib/options/types";

export default {
    enableMatugen: opt(true),
    themeMode: opt<ThemeMode>("dark"),

    bg: opt<HexColor>("#111318", { scss: true }),
    fg: opt<HexColor>("#e1e2e9", { scss: true }),
    accent: opt<HexColor>("#1b93fd", { scss: true }),
    danger: opt<HexColor>("#de3730", { scss: true }),
    surface: opt<HexColor>("#1d2024", { scss: true }),
    border: opt<HexColor>("#8d9199", { scss: true }),

    matugen: {
        type: opt<MatugenType>("scheme-tonal-spot"),
        contrast: opt(0),
        resizeFilter: opt<MatugenResizeFilter>("lanczos3"), // set "none" to disable
    },

    exportColorSchema: {
        enabled: opt(true),
        file: opt(`${CONFIG_DIR}/matugen.json`),
    },
};

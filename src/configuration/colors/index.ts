import { opt } from "src/lib/options";
import type { MatugenResizeFilter, MatugenType, ThemeMode } from "src/lib/options/types";

export default {
    enableMatugen: opt(true),
    themeMode: opt<ThemeMode>("dark"),

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

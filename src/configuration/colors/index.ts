import { CONFIG_DIR } from "src/lib/session/api";
import type { HexColor } from "src/configuration/types";
import type { ColorsOptions } from "./type";
import { opt } from "src/lib/options";
import type { MatugenResizeFilterType, MatugenType, ThemeModeType } from "./enums";

const colors: ColorsOptions = {
    enableMatugen: opt(true),
    themeMode: opt<ThemeModeType>("dark"),

    bg: opt<HexColor>("#111318", { scss: true }),
    fg: opt<HexColor>("#e1e2e9", { scss: true }),
    accent: opt<HexColor>("#1b93fd", { scss: true }),
    danger: opt<HexColor>("#de3730", { scss: true }),
    surface: opt<HexColor>("#1d2024", { scss: true }),
    border: opt<HexColor>("#8d9199", { scss: true }),

    matugen: {
        type: opt<MatugenType>("scheme-tonal-spot"),
        contrast: opt(0),
        resizeFilter: opt<MatugenResizeFilterType>("lanczos3"),
    },

    exportColorSchema: {
        enabled: opt(true),
        file: opt(`${CONFIG_DIR}/matugen.json`),
    },
}

declare module "src/lib/options/root" {
    interface OptionsRoot {
        colors: ColorsOptions;
    }
}

export default colors;

import type { Opt } from "src/lib/options";
import type { HexColor } from "src/configuration/types";
import { MatugenResizeFilterType, MatugenType, ThemeModeType } from "./enums";

export interface ColorsOptions {
    enableMatugen: Opt<boolean>;
    themeMode: Opt<ThemeModeType>;

    bg: Opt<HexColor>;
    fg: Opt<HexColor>;
    accent: Opt<HexColor>;
    danger: Opt<HexColor>;
    surface: Opt<HexColor>;
    border: Opt<HexColor>;

    matugen: {
        type: Opt<MatugenType>;
        contrast: Opt<number>;
        resizeFilter: Opt<MatugenResizeFilterType>;
    };

    exportColorSchema: {
        enabled: Opt<boolean>;
        file: Opt<string>;
    };
}

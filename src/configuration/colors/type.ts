import type { Opt } from "src/lib/options";
import type {
    HexColor,
    MatugenResizeFilter,
    MatugenType,
    ThemeMode,
} from "src/configuration/types";

export interface ColorsOptions {
    enableMatugen: Opt<boolean>;
    themeMode: Opt<ThemeMode>;

    bg: Opt<HexColor>;
    fg: Opt<HexColor>;
    accent: Opt<HexColor>;
    danger: Opt<HexColor>;
    surface: Opt<HexColor>;
    border: Opt<HexColor>;

    matugen: {
        type: Opt<MatugenType>;
        contrast: Opt<number>;
        resizeFilter: Opt<MatugenResizeFilter>;
    };

    exportColorSchema: {
        enabled: Opt<boolean>;
        file: Opt<string>;
    };
}

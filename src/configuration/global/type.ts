import type { Opt } from "src/lib/options";
import type { HexColor, Pattern } from "src/configuration/types";

export interface GlobalOptions {
    scale: Opt<number>;
    stringTest: Opt<string>;
    booleanTest: Opt<boolean>;
    colorTest: Opt<HexColor>
    enumTest: Opt<"test1" | "test2" | "test3">
    floatTest: Opt<number>;
    pattern: Opt<Pattern>;
}

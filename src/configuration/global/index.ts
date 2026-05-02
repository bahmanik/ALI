import { opt } from "src/lib/options";
import type { GlobalOptions } from "./type";
import type { HexColor } from "src/configuration/types";

const global: GlobalOptions = {
    scale: opt(32),
    stringTest: opt(""),
    booleanTest: opt(false),
    enumTest: opt<"test1" | "test2" | "test3">("test1"),
    colorTest: opt<HexColor>("#8d9199", { scss: true }),
    floatTest: opt(1),
}

declare module "src/lib/options/root" {
    interface OptionsRoot {
        global: GlobalOptions;
    }
}

export default global;

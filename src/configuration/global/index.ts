import { CONFIG_DIR } from "src/lib/session";
import { opt } from "src/lib/options";
import type { GlobalOptions } from "./type";
import type { Pattern } from "src/configuration/types";

const global: GlobalOptions = {
    scale: opt(32),
    pattern: opt<Pattern>({
        path: `${CONFIG_DIR}/patter.jpg`,
        size: 12,
    }),
}

declare module "src/lib/options/root" {
    interface OptionsRoot {
        global: GlobalOptions;
    }
}

export default global;


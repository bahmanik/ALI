import { stem } from "src/configuration/helper";
import { CONFIG_DIR } from "src/lib/session";
import type { GlobalOptions } from "./type";
import type { Pattern } from "src/lib/options/types";

const global = stem((opt): GlobalOptions => ({
  scale: opt(32),
  pattern: opt<Pattern>({
    path: `${CONFIG_DIR}/patter.jpg`,
    size: 12,
  }),
}));

declare module "src/lib/options/root" {
  interface OptionsRoot {
    global: GlobalOptions;
  }
}

export default global;

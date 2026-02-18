import type { Opt } from "src/lib/options";
import type { Pattern } from "src/lib/options/types";

export interface GlobalOptions {
  scale: Opt<number>;
  pattern: Opt<Pattern>;
}

declare module "src/lib/options/root" {
  interface OptionsRoot {
    global: GlobalOptions;
  }
}

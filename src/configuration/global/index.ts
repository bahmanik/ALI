import { stem } from "src/configuration/helper";
import type { Pattern } from "src/lib/options/types";

const global = stem((opt) => ({
  scale: opt(32),
  pattern: opt<Pattern>({
    path: "/home/ali/.config/ALI/patter.jpg",
    size: 12,
  }),
}));

export type GlobalOptions = ReturnType<typeof global>;

declare module "src/lib/options/root" {
  interface OptionsRoot {
    global: GlobalOptions;
  }
}

export default global;

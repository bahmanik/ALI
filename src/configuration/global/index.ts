import { stem } from "src/configuration/helper";
import type { GlobalOptions } from "./type";
import type { Pattern } from "src/lib/options/types";

const global = stem((opt): GlobalOptions => ({
  scale: opt(32),
  pattern: opt<Pattern>({
    path: "/home/ali/.config/ALI/patter.jpg",
    size: 12,
  }),
}));

export default global;

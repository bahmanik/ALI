import type { BarLocation } from "src/lib/options/types";
import type { Opt } from "src/lib/options";

export type BarOptionGroup = {
  position: Opt<BarLocation>;
  margin: Opt<number[]>;
};

export type BarKind = "primary" | "secondary";

export type Margin = { top: number; right: number; bottom: number; left: number };

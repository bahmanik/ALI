import type { Opt } from "src/lib/options";
import type { BarOptions } from "../type";

export type SecondaryBarOptions = Omit<BarOptions, "corner" | "secondaryBar"> & {
  enable: Opt<boolean>
}

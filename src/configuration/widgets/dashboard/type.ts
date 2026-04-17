import { ModuleMapArray } from "src/configuration/types";
import type { Opt } from "src/lib/options";

export type DashboardOptions = {
  grid: {
    rows: Opt<number>,
    cols: Opt<number>,
    modulesList: Opt<ModuleMapArray>,
  }
}

import { ModuleMapArray } from "src/configuration/types";
import { DashboardOptions } from "./type";
import { opt } from "src/lib/options";

const dashboard: DashboardOptions = {
  grid: {
    rows: opt(10),
    cols: opt(10),
    modulesList: opt<ModuleMapArray>([])
  }
};

declare module "src/lib/options/root" {
  interface OptionsRoot {
    dashboard: DashboardOptions;
  }
}

export default dashboard;

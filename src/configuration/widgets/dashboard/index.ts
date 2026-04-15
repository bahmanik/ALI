import { opt } from "src/lib/options";
import type { Opt } from "src/lib/options";
import type { DashboardModules } from "src/widget/dashboard/_component";

export type GridChild = {
  module: DashboardModules;
  column: number;
  row: number;
  width: number;
  height: number
}

export type ModuleMapArray = Array<GridChild>

export type DashboardOptions = {
  rows: Opt<number>,
  cols: Opt<number>,
  modulesList: Opt<ModuleMapArray>,
}

const dashboard: DashboardOptions = {
  rows: opt(5),
  cols: opt(10),
  modulesList: opt<ModuleMapArray>([])
};

declare module "src/lib/options/root" {
  interface OptionsRoot {
    dashboard: DashboardOptions;
  }
}

export default dashboard;

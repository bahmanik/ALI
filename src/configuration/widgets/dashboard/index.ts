import { DashboardOptions } from "./type";
import { overrideContainer } from "src/lib/options/factories/overrideContainer";
import { overrideGrid } from "src/lib/options/factories/overrideGrid";

const dashboard: DashboardOptions = {
  grid: overrideGrid({}),
  style: overrideContainer({}),
};

declare module "src/lib/options/root" {
  interface OptionsRoot {
    dashboard: DashboardOptions;
  }
}

export default dashboard;

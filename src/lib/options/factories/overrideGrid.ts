import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import type { ModuleMapArray } from "src/configuration/types"

export function overrideGrid(params: {
  defaultRows?: number;
  defaultCols?: number;
  defaultModulesList?: ModuleMapArray;
  exports?: OptExports;
} = {}) {
  const {
    defaultRows = 10,
    defaultCols = 10,
    defaultModulesList = [],
    exports: e = {},
  } = params

  return {
    rows: opt<number>(defaultRows, e),
    cols: opt<number>(defaultCols, e),
    modulesList: opt<ModuleMapArray>(defaultModulesList, e),
  }
}

export type GridLayoutOptions = ReturnType<typeof overrideGrid>

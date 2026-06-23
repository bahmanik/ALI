import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import type { HexColor } from "src/configuration/types"
import { BorderLocationType } from "src/configuration/enums";
import { colorWithAlpha } from "./colorWithAlpha";

export function overrideBorder(params: {
  defaultEnable?: boolean;
  defaultLocation?: BorderLocationType;
  defaultWidth?: number;
  defaultColor?: Parameters<typeof colorWithAlpha>[0];
  exports?: OptExports;
}) {
  const {
    defaultEnable = false,
    defaultLocation = "full",
    defaultWidth = 1,
    defaultColor = { color: "#8d9199" as HexColor, alpha: 1 },
    exports = { scss: true },
  } = params

  return {
    borderEnable: opt<boolean>(defaultEnable, exports),
    borderLocation: opt<BorderLocationType>(defaultLocation, exports),
    borderWidth: opt<number>(defaultWidth, exports),
    borderColor: colorWithAlpha({ ...defaultColor, exports }),
  }
}

export type BorderOptions = ReturnType<typeof overrideBorder>

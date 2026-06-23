import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import { colorWithAlpha } from "./colorWithAlpha";

export function overrideShadow(params: {
  defaultEnable?: boolean;
  defaultX?: number;
  defaultY?: number;
  defaultBlur?: number;
  defaultSpread?: number;
  defaultColor?: Parameters<typeof colorWithAlpha>[0];
  exports?: OptExports;
}) {
  const {
    defaultEnable = false,
    defaultX = 0,
    defaultY = 4,
    defaultBlur = 12,
    defaultSpread = 0,
    defaultColor = { color: "#000000", alpha: 0.35 },
    exports = { scss: true },
  } = params

  const result = {
    shadowEnable: opt<boolean>(defaultEnable, exports),
    shadowX: opt<number>(defaultX, exports),
    shadowY: opt<number>(defaultY, exports),
    shadowBlur: opt<number>(defaultBlur, exports),
    shadowSpread: opt<number>(defaultSpread, exports),
    shadowColor: colorWithAlpha({ ...defaultColor, exports }),
  }

  return result
}

export type ShadowOptions = ReturnType<typeof overrideShadow>

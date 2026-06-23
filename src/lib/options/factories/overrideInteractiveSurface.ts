import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import { colorWithAlpha } from "./colorWithAlpha"

export function overrideInteractiveSurface(params: {
  defaultBg?: Parameters<typeof colorWithAlpha>[0];
  defaultHoverOpacity?: number;
  defaultRadius?: number;
  defaultPaddingX?: number;
  defaultPaddingY?: number;
  defaultSpacing?: number;
  exports?: OptExports;
} = {}) {
  const {
    defaultBg = { color: "#111318", alpha: 0 },
    defaultHoverOpacity = 0.55,
    defaultRadius = 14,
    defaultPaddingX = 12,
    defaultPaddingY = 10,
    defaultSpacing = 8,
    exports: e = { scss: true },
  } = params

  return {
    bg: colorWithAlpha({ exports: e, ...defaultBg }),
    hoverOpacity: opt<number>(defaultHoverOpacity, e),
    radius: opt<number>(defaultRadius, e),
    paddingX: opt<number>(defaultPaddingX, e),
    paddingY: opt<number>(defaultPaddingY, e),
    spacing: opt<number>(defaultSpacing, e),
  }
}

export type InteractiveSurfaceOptions = ReturnType<typeof overrideInteractiveSurface>

import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import { colorWithAlpha } from "./colorWithAlpha"

export function overrideInteractiveSurface(params: {
  defaultBg?: Parameters<typeof colorWithAlpha>[0];
  defaultFg?: Parameters<typeof colorWithAlpha>[0];
  defaultHoverOpacity?: number;
  defaultActiveOpacity?: number;
  defaultRadius?: number;
  defaultPadding?: number;
  defaultSpacing?: number;
  exports?: OptExports;
} = {}) {
  const {
    defaultBg = { color: "#111318", alpha: 0 },
    defaultFg = { color: "#f2f3f4", alpha: 0 },
    defaultHoverOpacity = 0.55,
    defaultActiveOpacity = 0.65,
    defaultRadius = 14,
    defaultPadding = 10,
    defaultSpacing = 8,
    exports: e = { scss: true },
  } = params

  return {
    bg: colorWithAlpha({ exports: e, ...defaultBg }),
    fg: colorWithAlpha({ exports: e, ...defaultFg }),
    hoverOpacity: opt<number>(defaultHoverOpacity, e),
    activeOpacity: opt<number>(defaultActiveOpacity, e),
    radius: opt<number>(defaultRadius, e),
    padding: opt<number>(defaultPadding, e),
    spacing: opt<number>(defaultSpacing, e),
  }
}

export type InteractiveSurfaceOptions = ReturnType<typeof overrideInteractiveSurface>

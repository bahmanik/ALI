import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import { overrideBorder } from "./overrideBorder"
import { overrideShadow } from "./overrideShadow"
import { colorWithAlpha } from "./colorWithAlpha"

export function overrideContainer(params: {
  defaultMargin?: number[];
  defaultBg?: Parameters<typeof colorWithAlpha>[0];
  defaultFg?: Parameters<typeof colorWithAlpha>[0];
  defaultRadius?: number;
  defaultPadding?: number;
  border?: Parameters<typeof overrideBorder>[0];
  shadow?: Parameters<typeof overrideShadow>[0];
  exports?: OptExports;
} = {}) {
  const {
    defaultBg = { color: "#1d2024", alpha: 0.92 },
    defaultFg = { color: "#F2F3F4", alpha: 0.92 },
    defaultMargin = [3, 3, 3, 3],
    defaultRadius = 18,
    defaultPadding = 12,
    border: b = {},
    shadow: s = {},
    exports: e = { scss: true },
  } = params

  return {
    bg: colorWithAlpha({ exports: e, ...defaultBg }),
    fg: colorWithAlpha({ exports: e, ...defaultFg }),
    radius: opt<number>(defaultRadius, e),
    padding: opt<number>(defaultPadding, e),
    margin: opt<number[]>(defaultMargin),
    ...overrideBorder({ exports: e, ...b }),
    ...overrideShadow({ exports: e, ...s }),
  }
}

export type ContainerStyleOptions = ReturnType<typeof overrideContainer>

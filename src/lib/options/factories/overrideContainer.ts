import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import { overrideBorder } from "./overrideBorder"
import { overrideShadow } from "./overrideShadow"
import { colorWithAlpha } from "./colorWithAlpha"

export function overrideContainer(params: {
  defaultBg?: Parameters<typeof colorWithAlpha>[0];
  defaultRadius?: number;
  defaultPadding?: number;
  border?: Parameters<typeof overrideBorder>[0];
  shadow?: Parameters<typeof overrideShadow>[0];
  exports?: OptExports;
} = {}) {
  const {
    defaultBg = { color: "#1d2024", alpha: 0.92 },
    defaultRadius = 18,
    defaultPadding = 12,
    border: b = {},
    shadow: s = {},
    exports: e = { scss: true },
  } = params

  return {
    bg: colorWithAlpha({ exports: e, ...defaultBg }),
    radius: opt<number>(defaultRadius, e),
    padding: opt<number>(defaultPadding, e),
    ...overrideBorder({ exports: e, ...b }),
    ...overrideShadow({ exports: e, ...s }),
  }
}

export type ContainerStyleOptions = ReturnType<typeof overrideContainer>

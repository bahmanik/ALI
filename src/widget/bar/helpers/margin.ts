import type { Opt } from "src/lib/options"
import type { Margin } from "./types"

export function marginAt(raw: unknown, idx: 0 | 1 | 2 | 3): number {
  if (!Array.isArray(raw)) return 0
  const v = raw[idx]
  return typeof v === "number" ? v : 0
}

export function readMargin(raw: unknown): Margin {
  return {
    top:    marginAt(raw, 0),
    right:  marginAt(raw, 1),
    bottom: marginAt(raw, 2),
    left:   marginAt(raw, 3),
  }
}

export function bindMarginSide(opt: Opt<number[]>, idx: 0 | 1 | 2 | 3) {
  return opt.as ? opt.as((m) => marginAt(m, idx)) : marginAt(opt.get(), idx)
}

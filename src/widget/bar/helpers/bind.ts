import type { Opt } from "src/lib/options"

function safe(fn: () => void) {
  try { fn() } catch { }
}

export function subscribeOpt(opt: Opt<any>, cb: () => void) {
  const unsub = opt.subscribe?.(cb)
  return () => safe(() => typeof unsub === "function" && unsub())
}

import { createState } from "gnim"
import type { BarLocation } from "src/lib/options/types"

export type BarRect = {
  monitor: string
  name: string
  position: BarLocation
  x: number
  y: number
  width: number
  height: number
}

export type BarsOnMonitor = {
  primary?: BarRect
  secondary?: BarRect
}

const [bars, setBars] = createState<Record<string, BarsOnMonitor>>({})

export const barsGeometry = {
  get: () => bars.peek(),
  subscribe: (cb: () => void) => bars.subscribe(cb),
}

function upsert(monitor: string, patch: Partial<BarsOnMonitor>) {
  setBars({ ...bars.peek(), [monitor]: { ...(bars.peek()[monitor] ?? {}), ...patch } })
}

export function setPrimaryRect(monitor: string, rect?: BarRect) {
  upsert(monitor, { primary: rect })
}

export function setSecondaryRect(monitor: string, rect?: BarRect) {
  upsert(monitor, { secondary: rect })
}

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

/** All bars on a single monitor, keyed by their namespace (e.g. "bar", "secondary-bar"). */
export type BarsOnMonitor = Record<string, BarRect | undefined>

const [bars, setBars] = createState<Record<string, BarsOnMonitor>>({})

export const barsGeometry = {
  get: () => bars.peek(),
  subscribe: (cb: () => void) => bars.subscribe(cb),
}

function upsert(monitor: string, namespace: string, rect: BarRect | undefined) {
  const current = bars.peek()
  setBars({
    ...current,
    [monitor]: { ...(current[monitor] ?? {}), [namespace]: rect },
  })
}

export function setBarRect(namespace: string, monitor: string, rect?: BarRect) {
  upsert(monitor, namespace, rect)
}

import { BarLocationType } from "src/configuration/enums"
import type { Opt } from "src/lib/options"

export type BarOptionGroup = {
  position: Opt<BarLocationType>
  style: { margin: Opt<number[]> }
}

export type Margin = { top: number; right: number; bottom: number; left: number }

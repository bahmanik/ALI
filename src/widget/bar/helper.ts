import { Astal } from "ags/gtk4"
import { BarLocation } from "src/lib/options/types"

export function getBarPos(pos: BarLocation) {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor

  switch (pos) {
    case "bottom": return BOTTOM | LEFT | RIGHT
    case "top": return TOP | LEFT | RIGHT
    case "left": return LEFT | TOP | BOTTOM
    case "right": return RIGHT | TOP | BOTTOM
  }
}

export function getVertical(pos: BarLocation) {
  return pos === "top" || pos === "bottom"
}

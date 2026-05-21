import { Astal } from "ags/gtk4"
import Gtk from "gi://Gtk?version=4.0"
import type { BarOptionGroup } from "./types"
import type { BarLocation } from "src/configuration/types"
import { bindMarginSide } from "./margin"
import { Opt } from "src/lib/options"

function getBarAnchor(pos: BarLocation) {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor
  switch (pos) {
    case "top": return TOP | LEFT | RIGHT
    case "bottom": return BOTTOM | LEFT | RIGHT
    case "left": return LEFT | TOP | BOTTOM
    case "right": return RIGHT | TOP | BOTTOM
  }
}

/** True for left/right bars (stacked vertically). */
export function isBarVertical(pos: BarLocation) {
  return pos === "left" || pos === "right"
}

export function createBarWindowBinds(option: BarOptionGroup) {
  return {
    anchor: option.position.as(getBarAnchor),
    marginTop: bindMarginSide(option.margin, 0),
    marginRight: bindMarginSide(option.margin, 1),
    marginBottom: bindMarginSide(option.margin, 2),
    marginLeft: bindMarginSide(option.margin, 3),
  }
}

export function getBarOrientation(position: Opt<BarLocation>) {
  const vert = (p: BarLocation) => isBarVertical(p)

  return {
    orientation: position.as((p) => vert(p) ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL),
    start: {
      halign: position.as((p) => vert(p) ? Gtk.Align.CENTER : Gtk.Align.START),
      valign: position.as((p) => vert(p) ? Gtk.Align.START : Gtk.Align.CENTER),
    },
    center: {
      halign: position.as((_) => Gtk.Align.CENTER),
      valign: position.as((_) => Gtk.Align.CENTER),
    },
    end: {
      halign: position.as((p) => vert(p) ? Gtk.Align.CENTER : Gtk.Align.END),
      valign: position.as((p) => vert(p) ? Gtk.Align.END : Gtk.Align.CENTER),
    },
  }
}

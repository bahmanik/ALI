import { Astal } from "ags/gtk4"
import Gtk from "gi://Gtk?version=4.0"
import type { BarOptionGroup } from "./types"
import { bindMarginSide } from "./margin"
import { Opt } from "src/lib/options"
import { BarLocationType } from "src/configuration/enums"

function getBarAnchor(pos: BarLocationType) {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor
  switch (pos) {
    case "top": return TOP | LEFT | RIGHT
    case "bottom": return BOTTOM | LEFT | RIGHT
    case "left": return LEFT | TOP | BOTTOM
    case "right": return RIGHT | TOP | BOTTOM
  }
}

/** True for left/right bars (stacked vertically). */
export function isBarVertical(pos: BarLocationType) {
  return pos === "left" || pos === "right"
}

export function createBarWindowBinds(option: BarOptionGroup) {
  return {
    anchor: option.position.as(getBarAnchor),
    marginTop: bindMarginSide(option.style.margin, 0),
    marginRight: bindMarginSide(option.style.margin, 1),
    marginBottom: bindMarginSide(option.style.margin, 2),
    marginLeft: bindMarginSide(option.style.margin, 3),
  }
}

export function getBarOrientation(position: Opt<BarLocationType>) {
  const vert = (p: BarLocationType) => isBarVertical(p)

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

import { Astal } from "ags/gtk4";
import Gtk from "gi://Gtk?version=4.0";
import type { BarLocation } from "src/lib/options/types";

import type { BarOptionGroup } from "./types";
import { bindMarginSide } from "./margin";
import { Opt } from "src/lib/options";

function getBarPos(pos: BarLocation) {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor;

  switch (pos) {
    case "bottom":
      return BOTTOM | LEFT | RIGHT;
    case "top":
      return TOP | LEFT | RIGHT;
    case "left":
      return LEFT | TOP | BOTTOM;
    case "right":
      return RIGHT | TOP | BOTTOM;
  }
}

/** True for left/right bars (stacked vertically). */
export function isBarVertical(pos: BarLocation) {
  return pos === "left" || pos === "right";
}

export function createBarWindowBinds(option: BarOptionGroup) {
  return {
    anchor: option.position.as((p) => getBarPos(p)),
    marginTop: bindMarginSide(option.margin, 0),
    marginRight: bindMarginSide(option.margin, 1),
    marginBottom: bindMarginSide(option.margin, 2),
    marginLeft: bindMarginSide(option.margin, 3),
  };
}

export function getBarOrientation(position: Opt<BarLocation>) {
  const orientation = position.as((p) => isBarVertical(p) ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL);

  const start = {
    halign: position.as((p) => (isBarVertical(p) ? Gtk.Align.CENTER : Gtk.Align.START)),
    valign: position.as((p) => (isBarVertical(p) ? Gtk.Align.START : Gtk.Align.CENTER)),
  };

  const end = {
    halign: position.as((p) => (isBarVertical(p) ? Gtk.Align.CENTER : Gtk.Align.END)),
    valign: position.as((p) => (isBarVertical(p) ? Gtk.Align.END : Gtk.Align.CENTER)),
  };

  return { orientation, start, end };
}

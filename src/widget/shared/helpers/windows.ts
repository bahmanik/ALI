import { Astal, Gtk } from "ags/gtk4"

export type PopupLayout =
  | "center"
  | "top"
  | "top_center"
  | "top_left"
  | "top_right"
  | "bottom"
  | "bottom_center"
  | "bottom_left"
  | "bottom_right"
  | "full"

export function layoutToAlign(layout?: PopupLayout | string) {
  const l = String(layout ?? "center").toLowerCase().replace(/-/g, "_")

  switch (l) {
    case "top":
    case "top_center":
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.START }
    case "top_left":
      return { halign: Gtk.Align.START, valign: Gtk.Align.START }
    case "top_right":
      return { halign: Gtk.Align.END, valign: Gtk.Align.START }

    case "bottom":
    case "bottom_center":
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.END }
    case "bottom_left":
      return { halign: Gtk.Align.START, valign: Gtk.Align.END }
    case "bottom_right":
      return { halign: Gtk.Align.END, valign: Gtk.Align.END }

    case "center":
    default:
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER }
  }
}

export function calculateAnchor(layout: PopupLayout | string | undefined) {
  const { TOP, RIGHT, BOTTOM, LEFT } = Astal.WindowAnchor

  // Accept "top-center" too.
  const pos = String(layout ?? "center")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")

  switch (pos) {
    case "top":
      return TOP | LEFT | RIGHT
    case "top_center":
      return TOP
    case "top_left":
      return TOP | LEFT
    case "top_right":
      return TOP | RIGHT
    case "bottom":
      return BOTTOM | LEFT | RIGHT
    case "bottom_center":
      return BOTTOM
    case "bottom_left":
      return BOTTOM | LEFT
    case "bottom_right":
      return BOTTOM | RIGHT
    case "full":
      return TOP | BOTTOM | LEFT | RIGHT
    case "center":
    default:
      return undefined
  }
}

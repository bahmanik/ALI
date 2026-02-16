import { Astal, Gtk } from "ags/gtk4";
import type { AnchorLayout } from "src/lib/options/types";

/**
 * Normalizes user-facing layout names.
 *
 * We accept both HyprPanel-style ("top-left") and internal underscore
 * variants ("top_left").
 */
export function normalizeLayoutName(layout: AnchorLayout | string): string {
  return String(layout).toLowerCase().replace(/-/g, "_");
}

export function layoutToAlign(layout: AnchorLayout | string): {
  halign: Gtk.Align;
  valign: Gtk.Align;
} {
  const l = normalizeLayoutName(layout);

  switch (l) {
    case "center":
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER };

    case "top":
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.START };
    case "bottom":
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.END };

    case "left":
      return { halign: Gtk.Align.START, valign: Gtk.Align.CENTER };
    case "right":
      return { halign: Gtk.Align.END, valign: Gtk.Align.CENTER };

    case "top_left":
      return { halign: Gtk.Align.START, valign: Gtk.Align.START };
    case "top_center":
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.START };
    case "top_right":
      return { halign: Gtk.Align.END, valign: Gtk.Align.START };

    case "bottom_left":
      return { halign: Gtk.Align.START, valign: Gtk.Align.END };
    case "bottom_center":
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.END };
    case "bottom_right":
      return { halign: Gtk.Align.END, valign: Gtk.Align.END };

    case "full":
      return { halign: Gtk.Align.FILL, valign: Gtk.Align.FILL };

    default:
      // fallback: top-center
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.START };
  }
}

export function calculateAnchor(layout: AnchorLayout | string): Astal.WindowAnchor | null {
  const l = normalizeLayoutName(layout);

  switch (l) {
    case "top":
      return Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT;
    case "bottom":
      return (
        Astal.WindowAnchor.BOTTOM |
        Astal.WindowAnchor.LEFT |
        Astal.WindowAnchor.RIGHT
      );

    case "left":
      return Astal.WindowAnchor.LEFT;
    case "right":
      return Astal.WindowAnchor.RIGHT;

    case "top_left":
      return Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT;
    case "top_center":
      return Astal.WindowAnchor.TOP;
    case "top_right":
      return Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT;

    case "bottom_left":
      return Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT;
    case "bottom_center":
      return Astal.WindowAnchor.BOTTOM;
    case "bottom_right":
      return Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.RIGHT;

    case "full":
      return (
        Astal.WindowAnchor.TOP |
        Astal.WindowAnchor.BOTTOM |
        Astal.WindowAnchor.LEFT |
        Astal.WindowAnchor.RIGHT
      );

    case "center":
      return null;

    default:
      return Astal.WindowAnchor.TOP;
  }
}

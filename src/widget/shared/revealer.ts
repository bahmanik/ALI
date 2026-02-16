import { Gtk } from "ags/gtk4";
import type { GtkRevealerTransitionName } from "src/lib/options/types";

/**
 * Map string names (used in options) to Gtk.RevealerTransitionType.
 *
 * NOTE: Gtk enum is stable; these names match GTK4's transition type names.
 */
export function toGtkRevealerTransitionType(
  name: GtkRevealerTransitionName
): Gtk.RevealerTransitionType {
  switch (name) {
    case "NONE":
      return Gtk.RevealerTransitionType.NONE;
    case "CROSSFADE":
      return Gtk.RevealerTransitionType.CROSSFADE;

    case "SLIDE_RIGHT":
      return Gtk.RevealerTransitionType.SLIDE_RIGHT;
    case "SLIDE_LEFT":
      return Gtk.RevealerTransitionType.SLIDE_LEFT;
    case "SLIDE_UP":
      return Gtk.RevealerTransitionType.SLIDE_UP;
    case "SLIDE_DOWN":
      return Gtk.RevealerTransitionType.SLIDE_DOWN;

    case "SWING_RIGHT":
      return Gtk.RevealerTransitionType.SWING_RIGHT;
    case "SWING_LEFT":
      return Gtk.RevealerTransitionType.SWING_LEFT;
    case "SWING_UP":
      return Gtk.RevealerTransitionType.SWING_UP;
    case "SWING_DOWN":
      return Gtk.RevealerTransitionType.SWING_DOWN;

    default:
      return Gtk.RevealerTransitionType.SLIDE_UP;
  }
}

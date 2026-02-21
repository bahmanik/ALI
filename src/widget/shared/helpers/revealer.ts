import { Gtk } from "ags/gtk4";
import type { AnchorLayout, GtkRevealerTransitionName } from "src/lib/options/types";

function normalizeLayout(layout: AnchorLayout | string): string {
  return String(layout).toLowerCase().replace(/_/g, "-");
}

export function autoTransitionForLocation(layout: AnchorLayout | string): GtkRevealerTransitionName {
  const l = normalizeLayout(layout);

  // Centered overlays look best with a fade.
  if (l === "center") return "CROSSFADE";

  // Prefer vertical motion for top/bottom placements.
  if (l === "top" || l.startsWith("top-")) return "SLIDE_DOWN";
  if (l === "bottom" || l.startsWith("bottom-")) return "SLIDE_UP";

  // Side placements.
  if (l === "left" || l.endsWith("-left")) return "SLIDE_RIGHT";
  if (l === "right" || l.endsWith("-right")) return "SLIDE_LEFT";

  return "SLIDE_UP";
}

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

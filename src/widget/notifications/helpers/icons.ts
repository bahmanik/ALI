import { Gdk, Gtk } from "ags/gtk4";

export function isIconName(icon?: string | null): boolean {
  const display = Gdk.Display.get_default();
  if (!display) return false;

  const theme = Gtk.IconTheme.get_for_display(display);
  return Boolean(icon && theme.has_icon(icon));
}

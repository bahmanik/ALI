import { Gdk, Gtk } from "ags/gtk4";

/**
 * Looks up an icon by name and size
 * @param name - The name of the icon to look up
 * @param size - The size of the icon to look up. Defaults to 16
 * @param scale - The scale of the icon to look up. Defaults to 1
 * @returns The Gtk.IconInfo object if the icon is found, or null if not found
 */
/**
 * Looks up an icon by name and size (GTK4)
 * @returns Gtk.IconPaintable if found, otherwise null
 */
export function lookUpIcon(
    name?: string,
    size = 16,
    scale = 1,
): Gtk.IconPaintable | null {
    if (!name) return null;

    const display = Gdk.Display.get_default();
    if (!display) return null;

    const theme = Gtk.IconTheme.get_for_display(display);

    if (!theme.has_icon(name)) return null;

    return theme.lookup_icon(name, null, size, scale, Gtk.TextDirection.NONE, Gtk.IconLookupFlags.NONE);
}

/**
 * Checks if an icon exists in the theme
 * @param name - The name of the icon to check
 * @returns True if the icon exists, false otherwise
 */
export function iconExists(name: string): boolean {
    return lookUpIcon(name) !== null;
}

/**
 * Gets an icon name with fallback
 * @param primary - The primary icon name to try
 * @param fallback - The fallback icon name if primary doesn't exist
 * @returns The primary icon if it exists, otherwise the fallback
 */
export function getIconWithFallback(primary: string, fallback: string): string {
    return iconExists(primary) ? primary : fallback;
}

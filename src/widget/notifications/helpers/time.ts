import GLib from "gi://GLib";

export function formatTime(unixSeconds: number, format = "%H:%M"): string {
  return GLib.DateTime.new_from_unix_local(unixSeconds).format(format) ?? "";
}

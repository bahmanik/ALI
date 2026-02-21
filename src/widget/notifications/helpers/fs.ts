import GLib from "gi://GLib";

export function fileExists(path: string): boolean {
  return GLib.file_test(path, GLib.FileTest.EXISTS);
}

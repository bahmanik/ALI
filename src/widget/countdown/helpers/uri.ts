import Gio from 'gi://Gio?version=2.0'

export function fileUri(path: string): string {
  try {
    return Gio.File.new_for_path(path).get_uri()
  } catch {
    return path
  }
}

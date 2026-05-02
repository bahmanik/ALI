import GLib from "gi://GLib?version=2.0"
import { CACHE, ensureDirectory } from "src/lib/session/api"
import { joinPath } from "src/lib/path/helpers"

export class AssetCacheService {
  static VERSION = 1

  static getCachePath(signature: object, extension = 'png') {
    const json = JSON.stringify({ version: this.VERSION, ...signature })

    const hash = GLib.compute_checksum_for_string(
      GLib.ChecksumType.SHA256,
      json,
      -1,
    ).slice(0, 16)

    const dir = joinPath(CACHE, 'assets')

    ensureDirectory(dir)

    return joinPath(dir, `${hash}.${extension}`)
  }
}

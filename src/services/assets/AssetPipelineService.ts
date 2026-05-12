import GLib from "gi://GLib?version=2.0"
import Gio from "gi://Gio?version=2.0"
import { monitorFile } from "ags/file"
import { execAsync } from "ags/process"
import { Timer, timeout } from "ags/time"
import { CACHE, ensureDirectory } from "src/lib/session/api"
import { joinPath, normalizeToAbsolutePath } from "src/lib/path/helpers"
import { SystemUtilities } from "src/lib/system/SystemUtilities"
import { ServiceBase } from "../ServiceBase"
import type { ImageTechnique, ResolvedAsset, VisualAsset } from "./types"

type Subscriber = (outPath: string) => void

type Stat = {
  exists: boolean
  mtime: number
  size: number
}

type Entry = {
  key: string
  asset: Extract<VisualAsset, { kind: "image" | "pattern" }>
  outDir: string
  outPath: string
  subs: Set<Subscriber>
  monitor?: Gio.FileMonitor
  debounce?: Timer
  inflight?: Promise<string>
  gen: number
}

class AssetCache {
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

export class AssetPipelineService extends ServiceBase {
  private static _default: AssetPipelineService | null = null

  public static get_default(): AssetPipelineService {
    if (!this._default) this._default = new AssetPipelineService()
    return this._default
  }

  private constructor() {
    super()
  }

  protected async _boot(): Promise<void> { }

  private readonly _entries = new Map<string, Entry>()
  private _magickBin: string | null | undefined = undefined

  public async getResolvedPath(asset: VisualAsset): Promise<string | null> {
    if (asset.kind === "solid") return null

    const entry = this._ensureEntry(asset)
    return this._ensureFresh(entry)
  }

  public watch(asset: VisualAsset, cb: Subscriber): () => void {
    if (asset.kind === "solid" || !asset.path?.trim()) {
      cb("")
      return () => { }
    }

    const entry = this._ensureEntry(asset)
    entry.subs.add(cb)
    this._ensureMonitor(entry)

    void this._ensureFresh(entry).then((out) => cb(out)).catch(() => { })

    return () => {
      entry.subs.delete(cb)

      if (entry.subs.size === 0) {
        try {
          entry.monitor?.cancel()
        } catch {
          // ignore
        }
        entry.monitor = undefined
        entry.debounce?.cancel()
        entry.debounce = undefined
      }
    }
  }

  public async resolve(asset: VisualAsset): Promise<ResolvedAsset> {
    const renderPath = await this.getResolvedPath(asset)
    return {
      asset,
      renderPath,
    }
  }

  private _normalize(path: string): string {
    const abs = normalizeToAbsolutePath(path)
    try {
      return GLib.canonicalize_filename(abs, null)
    } catch {
      return abs
    }
  }

  private _signature(asset: Extract<VisualAsset, { kind: "image" | "pattern" }>) {
    return {
      kind: asset.kind,
      path: this._normalize(asset.path),
      technique: asset.technique ?? "none",
      transformations: asset.transformations ?? [],
    }
  }

  private _entryKey(asset: Extract<VisualAsset, { kind: "image" | "pattern" }>): string {
    return JSON.stringify({
      version: AssetCache.VERSION,
      ...this._signature(asset),
    })
  }

  private _ensureEntry(asset: VisualAsset): Entry {
    if (asset.kind === "solid") {
      throw new Error("solid assets do not have cache entries")
    }

    const key = this._entryKey(asset)
    const existing = this._entries.get(key)
    if (existing) return existing

    const signature = this._signature(asset)
    const outPath = AssetCache.getCachePath(signature)
    const outDir = GLib.path_get_dirname(outPath)

    ensureDirectory(outDir)

    const entry: Entry = {
      key,
      asset,
      outDir,
      outPath,
      subs: new Set(),
      gen: 0,
    }

    this._entries.set(key, entry)
    return entry
  }

  private _ensureMonitor(entry: Entry): void {
    if (entry.monitor) return

    const path = entry.asset.path?.trim()
    if (!path) return

    const parent = GLib.path_get_dirname(path)
    if (!parent) return

    entry.monitor = monitorFile(parent, (changedPath) => {
      if (!this._samePath(changedPath, entry.asset.path)) return
      this._scheduleRebuild(entry)
    })
  }

  private _samePath(a: string, b: string): boolean {
    try {
      return GLib.canonicalize_filename(a, null) === GLib.canonicalize_filename(b, null)
    } catch {
      return a === b
    }
  }

  private _scheduleRebuild(entry: Entry): void {
    entry.debounce?.cancel()
    entry.debounce = timeout(80, () => void this._rebuildAndNotify(entry))
  }

  private async _rebuildAndNotify(entry: Entry): Promise<void> {
    const gen = ++entry.gen

    let out: string
    try {
      out = await this._ensureFresh(entry)
    } catch {
      return
    }

    if (gen !== entry.gen) return

    for (const cb of entry.subs) {
      try {
        cb(out)
      } catch {
        // ignore
      }
    }
  }

  private _stat(path: string): Stat {
    try {
      const f = Gio.File.new_for_path(path)
      if (!f.query_exists(null)) return { exists: false, mtime: 0, size: 0 }

      const info = f.query_info("time::modified,standard::size", Gio.FileQueryInfoFlags.NONE, null)
      const mtime = Number(info.get_attribute_uint64("time::modified") ?? 0)
      const size = Number(info.get_size?.() ?? info.get_attribute_uint64("standard::size") ?? 0)
      return { exists: true, mtime, size }
    } catch {
      return { exists: false, mtime: 0, size: 0 }
    }
  }

  private _isFresh(entry: Entry): boolean {
    const s = this._stat(entry.asset.path)
    if (!s.exists || s.size <= 0) return false

    const o = this._stat(entry.outPath)
    if (!o.exists || o.size <= 0) return false

    return o.mtime >= s.mtime
  }

  private _pickMagick(): string | null {
    if (this._magickBin !== undefined) return this._magickBin

    if (SystemUtilities.checkExecutable(["magick"])) this._magickBin = "magick"
    else if (SystemUtilities.checkExecutable(["convert"])) this._magickBin = "convert"
    else this._magickBin = null

    return this._magickBin
  }

  private _techniqueArgs(tech: ImageTechnique): string[] {
    switch (tech) {
      case "negative":
        return ["-negate"]
      case "grayscale":
        return ["-colorspace", "Gray"]
      case "sepia":
        return ["-sepia-tone", "80%"]
      case "none":
      default:
        return []
    }
  }

  private _transformationArgs(asset: Entry["asset"]): string[] {
    if (asset.transformations && asset.transformations.length > 0) {
      const args: string[] = []

      for (const t of asset.transformations) {
        switch (t.type) {
          case "negative":
            args.push("-negate")
            break
          case "grayscale":
            args.push("-colorspace", "Gray")
            break
          case "sepia":
            args.push("-sepia-tone", "80%")
            break
          case "blur":
            args.push("-blur", `0x${Math.max(0, t.radius)}`)
            break
          case "opacity":
          case "none":
          default:
            break
        }
      }

      return args
    }

    return this._techniqueArgs(asset.technique ?? "none")
  }

  private async _ensureFresh(entry: Entry): Promise<string> {
    if (this._isFresh(entry)) return entry.outPath
    if (entry.inflight) return entry.inflight

    entry.inflight = (async () => {
      const bin = this._pickMagick()
      const isPng = entry.asset.path.toLowerCase().endsWith(".png")
      const transforms = this._transformationArgs(entry.asset)

      if (!bin) {
        if (transforms.length === 0 && isPng) {
          return entry.asset.path
        }
        throw new Error("[AssetPipelineService] ImageMagick not found (magick/convert)")
      }

      if (transforms.length === 0 && isPng) {
        return entry.asset.path
      }

      ensureDirectory(entry.outDir)

      const argv = [
        bin,
        entry.asset.path,
        "-auto-orient",
        ...transforms,
        entry.outPath,
      ]

      await execAsync(argv)
      return entry.outPath
    })()

    try {
      return await entry.inflight
    } finally {
      entry.inflight = undefined
    }
  }
}

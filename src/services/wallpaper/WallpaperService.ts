import GLib from "gi://GLib"
import Gio from "gi://Gio"
import AstalHyprland from "gi://AstalHyprland?version=0.1"

import { monitorFile, writeFile } from "ags/file"
import { execAsync } from "ags/process"

import { SwwwDaemon } from "./SwwwDaemon"
import { createDebouncer } from "../../lib/time/debounce"
import { startOnce } from "../../services/startOnce"
import type { Opt } from "../../lib/options"
import options from "src/configuration"


type WallpaperOptions = {
  enable: Opt<boolean>
  file: Opt<string>
  transition: {
    enabled: Opt<boolean>
    type: Opt<string>
    duration: Opt<number>
    fps: Opt<number>
    invert_y: Opt<boolean>
    pos: Opt<string>
  }
  daemon: {
    namespace: Opt<string>
    layer: Opt<string>
    quiet: Opt<boolean>
  }
}

export class WallpaperService {
  private static _instance: WallpaperService | undefined

  public static getInstance(): WallpaperService {
    if (!this._instance) this._instance = new WallpaperService()
    return this._instance
  }

  private _daemon = new SwwwDaemon()
  private _blockMonitor = false
  private _monitor: Gio.FileMonitor | undefined
  private _applyDebounce = createDebouncer(80)

  private _opts: WallpaperOptions | null = null
  private _managedFile = ""

  private readonly _ensureStarted = startOnce(async () => {
    // ✅ resolve at runtime, not module scope
    const { wallpaper } = options.display
    const opts = (this._opts ??= wallpaper as unknown as WallpaperOptions)

    this._managedFile = opts.file.get()
    this._ensureManagedFile()
    this._setupMonitor()

    opts.enable.subscribe(() => void this._syncDaemon())

    opts.file.subscribe(() => {
      const next = opts.file.get()
      if (next === this._managedFile) return
      this._managedFile = next
      this._ensureManagedFile()
      this._setupMonitor()
      this.scheduleApply()
    })

    // Re-apply on transition tweaks
    opts.transition.enabled.subscribe(() => this.scheduleApply())
    opts.transition.type.subscribe(() => this.scheduleApply())
    opts.transition.duration.subscribe(() => this.scheduleApply())
    opts.transition.fps.subscribe(() => this.scheduleApply())
    opts.transition.invert_y.subscribe(() => this.scheduleApply())
    opts.transition.pos.subscribe(() => this.scheduleApply())

    await this._syncDaemon()
  })

  private constructor() {
  }
  /** Explicit runtime start. Idempotent. */
  public async ensureStarted(): Promise<void> {
    await this._ensureStarted()
  }

  public get isRunning(): boolean {
    return this._daemon.isRunning
  }

  public get managedFile(): string {
    return this._managedFile
  }

  /** Copy an image into the managed file and apply it. */
  public async setWallpaper(path: string): Promise<void> {
    this._blockMonitor = true

    try {
      this._ensureParents(this._managedFile)
      // -- prevents option injection if path starts with '-'
      await execAsync(["cp", "-f", "--", path, this._managedFile])
    } finally {
      this._blockMonitor = false
    }

    this.scheduleApply()
  }

  /** Apply current wallpaper (debounced). */
  public scheduleApply(): void {
    this._applyDebounce.schedule(() => void this.apply())
  }

  /** Apply current wallpaper immediately. */
  public async apply(): Promise<void> {
    const opts = this._opts
    if (!opts) return
    if (!opts.enable.get()) return

    const namespace = opts.daemon.namespace.get().trim() || undefined

    if (!this._daemon.isRunning) {
      const started = await this._daemon.start({
        namespace,
        layer: opts.daemon.layer.get(),
        quiet: opts.daemon.quiet.get(),
      })
      if (!started) return
    }

    if (!this._hasUsableFile(this._managedFile)) {
      console.warn("[Wallpaper] Managed file is missing/empty:", this._managedFile)
      return
    }

    const argv = await this._buildSwwwImgCmd(namespace)

    try {
      await execAsync(argv)
    } catch (err) {
      console.error("[Wallpaper] Failed to set wallpaper:", err)
    }
  }

  private async _buildSwwwImgCmd(namespace?: string): Promise<string[]> {
    const opts = this._opts
    if (!opts) return ["swww", "img", this._managedFile]

    const argv: string[] = ["swww", "img"]
    if (namespace) argv.push("--namespace", namespace)

    const transitionEnabled = opts.transition.enabled.get()

    if (transitionEnabled) {
      argv.push("--transition-type", opts.transition.type.get())
      argv.push("--transition-duration", String(opts.transition.duration.get()))
      argv.push("--transition-fps", String(opts.transition.fps.get()))
      if (opts.transition.invert_y.get()) {
        argv.push("--invert-y")
      }


      const posOpt = opts.transition.pos.get()
      const pos = await this._resolveTransitionPos(posOpt)
      if (pos) argv.push("--transition-pos", pos)
    }

    argv.push(this._managedFile)
    return argv
  }

  private async _resolveTransitionPos(pos: string): Promise<string | undefined> {
    if (pos !== "cursor") return pos

    try {
      const hyprland = AstalHyprland.get_default()

      // Hyprland cursorpos is usually "X, Y" -> swww wants "X,Y"
      const raw = String(hyprland.message("cursorpos"))
      const cleaned = raw.trim().replace(/\s+/g, "")
      return cleaned.length ? cleaned : "center"
    } catch {
      // Fallback: hyprctl (if available)
      try {
        const raw = await execAsync(["hyprctl", "cursorpos"])
        const cleaned = String(raw).trim().replace(/\s+/g, "")
        return cleaned.length ? cleaned : "center"
      } catch {
        return "center"
      }
    }
  }

  private _setupMonitor(): void {
    try {
      this._monitor?.cancel()
    } catch { }

    // Monitor parent dir so it still works if the file is replaced/temporarily missing
    const parent = GLib.path_get_dirname(this._managedFile)

    this._monitor = monitorFile(parent, (file) => {
      if (this._blockMonitor) return
      if (this._samePath(file, this._managedFile)) this.scheduleApply()
    })
  }

  private _samePath(a: string, b: string): boolean {
    try {
      const ca = GLib.canonicalize_filename(a, null)
      const cb = GLib.canonicalize_filename(b, null)
      return ca === cb
    } catch {
      return a === b
    }
  }

  private _ensureManagedFile(): void {
    this._ensureParents(this._managedFile)
    if (!GLib.file_test(this._managedFile, GLib.FileTest.EXISTS)) {
      // Create an empty placeholder so monitors work; apply() skips empty files.
      writeFile(this._managedFile, "")
    }
  }

  private _ensureParents(path: string): void {
    const dir = GLib.path_get_dirname(path)
    try {
      GLib.mkdir_with_parents(dir, 0o755)
    } catch { }
  }

  private _hasUsableFile(path: string): boolean {
    if (!GLib.file_test(path, GLib.FileTest.EXISTS | GLib.FileTest.IS_REGULAR)) return false

    try {
      const file = Gio.File.new_for_path(path)
      const info = file.query_info("standard::size", Gio.FileQueryInfoFlags.NONE, null)
      return info.get_size() > 0
    } catch {
      return false
    }
  }

  private async _syncDaemon(): Promise<void> {
    const opts = this._opts
    if (!opts) return

    const enabled = opts.enable.get()
    const namespace = opts.daemon.namespace.get().trim() || undefined

    if (!enabled) {
      await this._daemon.stop(namespace)
      return
    }

    const started = await this._daemon.start({
      namespace,
      layer: opts.daemon.layer.get(),
      quiet: opts.daemon.quiet.get(),
    })

    if (started) this.scheduleApply()
  }
}

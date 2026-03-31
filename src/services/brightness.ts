import GLib from "gi://GLib"
import Gio from "gi://Gio"
import options from "src/configuration";
import GObject, { register, getter, setter } from "gnim/gobject"
import { startOnce } from "../services/startOnce"
import { monitorFile, readFileAsync } from "ags/file"
import { execAsync } from "ags/process"
import { Timer, timeout } from "ags/time"
import { SystemUtilities } from "../lib/system/SystemUtilities"



type BrightnessServiceOptions = {
  screenDevice?: string
  kbdDevice?: string
  minScreenPercent?: number
}

@register({ GTypeName: "Brightness" })
export default class BrightnessService extends GObject.Object {
  public static instance: BrightnessService | undefined

  public static getInstance(opts: BrightnessServiceOptions = {}): BrightnessService {
    if (!this.instance) this.instance = new BrightnessService(opts)
    return this.instance
  }

  /**
   * Explicit runtime start. Idempotent.
   *
   * This wires timers/monitors/subscriptions that were previously started in the constructor.
   */
  public async ensureStarted(): Promise<void> {
    await this.#ensureStarted()
  }

  // NOTE: must be public for @register typing (private constructor breaks decorators)
  public constructor(opts: BrightnessServiceOptions = {}) {
    super()

    this.#opts = {
      screenDevice: opts.screenDevice ?? "",
      kbdDevice: opts.kbdDevice ?? "",
      minScreenPercent: opts.minScreenPercent ?? 1,
    }
  }

  // ----------------- state -----------------

  #opts!: Required<BrightnessServiceOptions>
  #available = false

  #screenDev = ""
  #kbdDev = ""

  #screenBrightnessPath = ""
  #screenMaxPath = ""
  #kbdBrightnessPath = ""
  #kbdMaxPath = ""

  #screenMax = 0
  #kbdMax = 0

  #screen = 0 // ratio 0..1
  #kbd = 0 // raw 0..kbdMax

  #blockMonitor = false

  #screenMon?: Gio.FileMonitor
  #kbdMon?: Gio.FileMonitor

  // heartbeat poll
  #hb = {
    enabled: true,
    ms: 1000,
  }
  #hbTimer?: Timer
  #hbGen = 0

  #ensureStarted = startOnce(async () => {
    this.#available = SystemUtilities.checkDependencies("brightnessctl")
    if (!this.#available) {
      console.warn("[Brightness] brightnessctl not found -> service disabled")
      return
    }

    // resolve at runtime, not module scope
    const { heartbeatPoll, heartbeatPollMs } = options.osd.brightness
    this.#hb.enabled = Boolean(heartbeatPoll.get())
    const initHbMs = Number(heartbeatPollMs.get())
    this.#hb.ms = Math.max(200, Math.round(Number.isFinite(initHbMs) ? initHbMs : 1000))

    // keep in sync with options
    heartbeatPoll.subscribe(() => {
      this.#hb.enabled = Boolean(heartbeatPoll.get())
      this.#updateHeartbeat()
    })

    heartbeatPollMs.subscribe(() => {
      const ms = Number(heartbeatPollMs.get())
      this.#hb.ms = Math.max(200, Math.round(Number.isFinite(ms) ? ms : 1000))
      this.#updateHeartbeat(true)
    })

    this.#initDevices()
    this.#initPaths()
    this.#initMaxValues()

    await this.#refreshAll()
    this.#setupMonitors()
    this.#updateHeartbeat()
  })

  // ----------------- exported GObject properties -----------------

  @getter(Boolean)
  public get available(): boolean {
    return this.#available
  }

  /** screen ratio (0..1) */
  @getter(Number)
  public get screen(): number {
    return this.#screen
  }

  @setter(Number)
  public set screen(v: number) {
    void this.setScreen(v)
  }

  @getter(Number)
  public get screenMax(): number {
    return this.#screenMax
  }

  @getter(Number)
  public get screenPercent(): number {
    return Math.round(this.#screen * 100)
  }

  /** keyboard raw (0..kbdMax) */
  @getter(Number)
  public get kbd(): number {
    return this.#kbd
  }

  @setter(Number)
  public set kbd(v: number) {
    void this.setKbd(v)
  }

  @getter(Number)
  public get kbdMax(): number {
    return this.#kbdMax
  }

  @getter(Number)
  public get kbdPercent(): number {
    return this.#kbdMax ? this.#kbd / this.#kbdMax : 0
  }

  // ----------------- public API -----------------

  public async refreshAll(): Promise<void> {
    await this.#refreshAll()
  }

  public async setScreen(ratio: number): Promise<void> {
    if (!this.#screenDev) return

    const clamped = this.#clamp01(ratio)
    const pct100 = this.#clamp(Math.round(clamped * 100), this.#opts.minScreenPercent, 100)

    this.#blockMonitor = true
    try {
      await execAsync(["brightnessctl", "-d", this.#screenDev, "set", `${pct100}%`, "-q"])
      // optimistic update
      this.#setScreenRatio(pct100 / 100)
    } catch (err) {
      console.error("[Brightness] Failed to set screen brightness:", err)
    } finally {
      this.#blockMonitor = false
    }

    void this.#refreshScreen()
  }

  public async setKbd(raw: number): Promise<void> {
    if (!this.#kbdDev || !this.#kbdMax) return

    const v = this.#clamp(Math.round(raw), 0, this.#kbdMax)

    this.#blockMonitor = true
    try {
      await execAsync(["brightnessctl", "-d", this.#kbdDev, "set", `${v}`, "-q"])
      this.#setKbdRaw(v)
    } catch (err) {
      console.error("[Brightness] Failed to set keyboard brightness:", err)
    } finally {
      this.#blockMonitor = false
    }

    void this.#refreshKbd()
  }

  public async incScreen(stepPercent = 5): Promise<void> {
    await this.setScreen((this.#screen * 100 + stepPercent) / 100)
  }

  public async decScreen(stepPercent = 5): Promise<void> {
    await this.setScreen((this.#screen * 100 - stepPercent) / 100)
  }

  public async incKbd(step = 1): Promise<void> {
    await this.setKbd(this.#kbd + step)
  }

  public async decKbd(step = 1): Promise<void> {
    await this.setKbd(this.#kbd - step)
  }

  public destroy(): void {
    this.#stopHeartbeat()
    this.#teardownMonitors()
  }

  // ----------------- init -----------------

  #initDevices(): void {
    this.#screenDev = this.#opts.screenDevice.trim() || this.#pickBacklightDevice()
    this.#kbdDev = this.#opts.kbdDevice.trim() || this.#pickKbdDevice()
  }

  #initPaths(): void {
    if (this.#screenDev) {
      this.#screenBrightnessPath = `/sys/class/backlight/${this.#screenDev}/brightness`
      this.#screenMaxPath = `/sys/class/backlight/${this.#screenDev}/max_brightness`
    }

    if (this.#kbdDev) {
      this.#kbdBrightnessPath = `/sys/class/leds/${this.#kbdDev}/brightness`
      this.#kbdMaxPath = `/sys/class/leds/${this.#kbdDev}/max_brightness`
    }
  }

  #initMaxValues(): void {
    if (this.#screenMaxPath && GLib.file_test(this.#screenMaxPath, GLib.FileTest.EXISTS))
      this.#screenMax = this.#readSysfsNumberSync(this.#screenMaxPath)

    if (this.#kbdMaxPath && GLib.file_test(this.#kbdMaxPath, GLib.FileTest.EXISTS))
      this.#kbdMax = this.#readSysfsNumberSync(this.#kbdMaxPath)

    void this.#fallbackMaxFromBrightnessctl()
  }

  async #fallbackMaxFromBrightnessctl(): Promise<void> {
    try {
      if (this.#screenDev && !this.#screenMax) {
        const out = await execAsync(["brightnessctl", "-d", this.#screenDev, "max"])
        const n = this.#parseNumber(out)
        if (n > 0) this.#screenMax = n
        this.notify("screen-max")
      }

      if (this.#kbdDev && !this.#kbdMax) {
        const out = await execAsync(["brightnessctl", "-d", this.#kbdDev, "max"])
        const n = this.#parseNumber(out)
        if (n > 0) this.#kbdMax = n
        this.notify("kbd-max")
      }
    } catch { }
  }

  // ----------------- sysfs monitors -----------------

  #setupMonitors(): void {
    this.#teardownMonitors()

    if (this.#screenBrightnessPath && GLib.file_test(this.#screenBrightnessPath, GLib.FileTest.EXISTS)) {
      try {
        this.#screenMon = monitorFile(this.#screenBrightnessPath, () => {
          if (this.#blockMonitor) return
          void this.#refreshScreen()
        })
      } catch (err) {
        console.warn("[Brightness] screen monitor attach failed:", err)
      }
    }

    if (this.#kbdBrightnessPath && GLib.file_test(this.#kbdBrightnessPath, GLib.FileTest.EXISTS)) {
      try {
        this.#kbdMon = monitorFile(this.#kbdBrightnessPath, () => {
          if (this.#blockMonitor) return
          void this.#refreshKbd()
        })
      } catch (err) {
        console.warn("[Brightness] kbd monitor attach failed:", err)
      }
    }
  }

  #teardownMonitors(): void {
    try { this.#screenMon?.cancel() } catch { }
    try { this.#kbdMon?.cancel() } catch { }
    this.#screenMon = undefined
    this.#kbdMon = undefined
  }

  // ----------------- heartbeat poll -----------------

  #shouldHeartbeat(): boolean {
    if (!this.#hb.enabled) return false
    if (!this.#available) return false
    return !!this.#screenDev || !!this.#kbdDev
  }

  #updateHeartbeat(reschedule = false): void {
    if (!this.#shouldHeartbeat()) {
      this.#stopHeartbeat()
      return
    }

    if (!this.#hbTimer) this.#scheduleHeartbeat()
    else if (reschedule) this.#scheduleHeartbeat()
  }

  #stopHeartbeat(): void {
    this.#hbGen++
    this.#hbTimer?.cancel()
    this.#hbTimer = undefined
  }

  #scheduleHeartbeat(): void {
    this.#hbTimer?.cancel()
    const gen = ++this.#hbGen

    this.#hbTimer = timeout(this.#hb.ms, async () => {
      if (gen !== this.#hbGen) return
      if (!this.#shouldHeartbeat()) {
        this.#stopHeartbeat()
        return
      }

      await Promise.allSettled([this.#refreshScreen(), this.#refreshKbd()])

      if (gen !== this.#hbGen) return
      this.#scheduleHeartbeat()
    })
  }

  // ----------------- refresh -----------------

  async #refreshAll(): Promise<void> {
    await Promise.allSettled([this.#refreshScreen(), this.#refreshKbd()])
  }

  async #refreshScreen(): Promise<void> {
    if (!this.#screenBrightnessPath) return
    if (!GLib.file_test(this.#screenBrightnessPath, GLib.FileTest.EXISTS)) return

    try {
      const raw = await readFileAsync(this.#screenBrightnessPath)
      const cur = this.#parseNumber(raw)

      if (!this.#screenMax && this.#screenMaxPath && GLib.file_test(this.#screenMaxPath, GLib.FileTest.EXISTS)) {
        this.#screenMax = this.#readSysfsNumberSync(this.#screenMaxPath)
        this.notify("screen-max")
      }
      if (!this.#screenMax) return

      this.#setScreenRatio(this.#clamp01(cur / this.#screenMax))
    } catch (err) {
      // fallback: brightnessctl get/max
      try {
        if (!this.#screenDev) return
        const [curOut, maxOut] = await Promise.all([
          execAsync(["brightnessctl", "-d", this.#screenDev, "get"]),
          execAsync(["brightnessctl", "-d", this.#screenDev, "max"]),
        ])
        const cur = this.#parseNumber(curOut)
        const max = this.#parseNumber(maxOut) || 1
        this.#screenMax = max
        this.notify("screen-max")
        this.#setScreenRatio(this.#clamp01(cur / max))
      } catch {
        console.error("[Brightness] Failed to refresh screen:", err)
      }
    }
  }

  async #refreshKbd(): Promise<void> {
    if (!this.#kbdBrightnessPath) return
    if (!GLib.file_test(this.#kbdBrightnessPath, GLib.FileTest.EXISTS)) return

    try {
      const raw = await readFileAsync(this.#kbdBrightnessPath)
      const cur = this.#parseNumber(raw)

      if (!this.#kbdMax && this.#kbdMaxPath && GLib.file_test(this.#kbdMaxPath, GLib.FileTest.EXISTS)) {
        this.#kbdMax = this.#readSysfsNumberSync(this.#kbdMaxPath)
        this.notify("kbd-max")
      }
      if (!this.#kbdMax) return

      this.#setKbdRaw(this.#clamp(cur, 0, this.#kbdMax))
    } catch (err) {
      // fallback: brightnessctl get/max
      try {
        if (!this.#kbdDev) return
        const [curOut, maxOut] = await Promise.all([
          execAsync(["brightnessctl", "-d", this.#kbdDev, "get"]),
          execAsync(["brightnessctl", "-d", this.#kbdDev, "max"]),
        ])
        const cur = this.#parseNumber(curOut)
        const max = this.#parseNumber(maxOut) || 1
        this.#kbdMax = max
        this.notify("kbd-max")
        this.#setKbdRaw(this.#clamp(cur, 0, max))
      } catch {
        console.error("[Brightness] Failed to refresh kbd:", err)
      }
    }
  }

  // ----------------- state setters -----------------

  #setScreenRatio(ratio: number): void {
    if (ratio === this.#screen) return
    this.#screen = ratio
    this.notify("screen")
    this.notify("screen-percent")
  }

  #setKbdRaw(v: number): void {
    if (v === this.#kbd) return
    this.#kbd = v
    this.notify("kbd")
    this.notify("kbd-percent")
  }

  // ----------------- device discovery -----------------

  #pickBacklightDevice(): string {
    const list = this.#listDirNames("/sys/class/backlight")
    if (!list.length) return ""

    const pref = ["intel_backlight", "amdgpu_bl0", "acpi_video0", "nvidia_0"]
    for (const p of pref) {
      const hit = list.find((x) => x === p)
      if (hit) return hit
    }
    return list[0]
  }

  #pickKbdDevice(): string {
    const list = this.#listDirNames("/sys/class/leds")
    return list.find((x) => x.endsWith("::kbd_backlight")) ?? ""
  }

  #listDirNames(path: string): string[] {
    try {
      const dir = Gio.File.new_for_path(path)
      const e = dir.enumerate_children("standard::name,standard::type", Gio.FileQueryInfoFlags.NONE, null)

      const names: string[] = []
      while (true) {
        const info = e.next_file(null)
        if (!info) break
        if (info.get_file_type() === Gio.FileType.DIRECTORY) names.push(info.get_name())
      }

      e.close(null)
      return names
    } catch {
      return []
    }
  }

  // ----------------- helpers -----------------

  #clamp01(v: number): number {
    if (!Number.isFinite(v)) return 0
    return Math.max(0, Math.min(1, v))
  }

  #clamp(v: number, min: number, max: number): number {
    if (!Number.isFinite(v)) return min
    return Math.max(min, Math.min(max, v))
  }

  #parseNumber(out: unknown): number {
    const s = String(out).trim()
    const token = s.match(/-?\d+(\.\d+)?/)?.[0] ?? ""
    const n = Number(token)
    return Number.isFinite(n) ? n : 0
  }

  #readSysfsNumberSync(path: string): number {
    try {
      const [, bytes] = GLib.file_get_contents(path)
      if (!bytes) return 0
      const text = new TextDecoder().decode(bytes)
      return this.#parseNumber(text)
    } catch {
      return 0
    }
  }
}

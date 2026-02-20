import GLib from "gi://GLib?version=2.0";
import Gio from "gi://Gio?version=2.0";

import options from "src/configuration";

import { monitorFile, writeFile } from "ags/file";

import { isHexColor } from "src/lib/valisation/colors";
import { ensureDirectory } from "src/lib/session/api";
import { createDebouncer } from "src/lib/time/debounce";
import { SystemUtilities } from "src/lib/system/SystemUtilities";
import { startOnce } from "src/services/startOnce";

type MatugenJson = Record<string, unknown>;

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function extractJson(maybeJson: string): string {
  const s = String(maybeJson ?? "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) return s.slice(first, last + 1);
  return s;
}

function tryParseMatugenJson(output: string): { ok: true; value: MatugenJson } | { ok: false; error: unknown; jsonText: string } {
  const jsonText = extractJson(output);
  try {
    const parsed = JSON.parse(jsonText) as MatugenJson;
    // minimal sanity: must be an object
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: new Error("Parsed JSON is not an object"), jsonText };
    }
    return { ok: true, value: parsed };
  } catch (error) {
    return { ok: false, error, jsonText };
  }
}

function hasUsableFile(path: string): boolean {
  if (!GLib.file_test(path, GLib.FileTest.EXISTS | GLib.FileTest.IS_REGULAR)) return false;
  try {
    const f = Gio.File.new_for_path(path);
    const info = f.query_info("standard::size", Gio.FileQueryInfoFlags.NONE, null);
    return info.get_size() > 0;
  } catch {
    return false;
  }
}

export class MatugenPaletteService {
  private static _instance: MatugenPaletteService;

  public static getInstance(): MatugenPaletteService {
    if (!this._instance) this._instance = new MatugenPaletteService();
    return this._instance;
  }

  private _debounce = createDebouncer(150);
  private _monitor?: Gio.FileMonitor;

  private _managedFile = "";
  private _lastPalette: MatugenJson | null = null;
  private _enabled = false;

  private readonly _ensureStarted = startOnce(async () => {
    // ✅ resolve at runtime, not module scope
    const { wallpaper } = options.display;
    const colors = options.colors;

    // Track managed wallpaper path.
    this._managedFile = wallpaper.file.get();

    // Toggle-driven monitoring: only watch when enabled.
    const syncEnabled = () => {
      const enabled = Boolean(colors.enableMatugen.get());
      if (enabled === this._enabled) return;

      this._enabled = enabled;
      if (!enabled) {
        // Stop heavy runtime when disabled.
        this._debounce.cancel();
        try {
          this._monitor?.cancel();
        } catch {
          // ignore
        }
        this._monitor = undefined;
        return;
      }

      // Enabled now.
      this._setupMonitor();
      this.scheduleGenerate(200);
    };

    // Rebind monitor if the managed wallpaper file path changes
    wallpaper.file.subscribe(() => {
      this._managedFile = wallpaper.file.get();
      if (this._enabled) {
        this._setupMonitor();
        this.scheduleGenerate(150);
      }
    });

    // Options that affect palette generation.
    const regen = () => {
      if (!this._enabled) return;
      this.scheduleGenerate(150);
    };

    colors.enableMatugen.subscribe(syncEnabled);
    colors.themeMode.subscribe(regen);

    colors.matugen.type.subscribe(regen);
    colors.matugen.contrast.subscribe(regen);
    colors.matugen.resizeFilter.subscribe(regen);

    colors.exportColorSchema.enabled.subscribe(regen);
    colors.exportColorSchema.file.subscribe(regen);

    // Initial state
    syncEnabled();
    if (this._enabled) this.scheduleGenerate(200);
  });

  private constructor() {
    // cheap constructor: no IO/monitors/timers/subprocess
  }

  /** Explicit runtime start. Idempotent. */
  public async ensureStarted(): Promise<void> {
    await this._ensureStarted();
  }

  public get lastPalette(): MatugenJson | null {
    return this._lastPalette;
  }

  private _setupMonitor(): void {
    try {
      this._monitor?.cancel();
    } catch {
      // ignore
    }
    this._monitor = undefined;

    if (!this._managedFile) return;

    const parent = GLib.path_get_dirname(this._managedFile);

    this._monitor = monitorFile(parent, (file) => {
      if (!this._enabled) return;
      if (this._samePath(file, this._managedFile)) this.scheduleGenerate(120);
    });
  }

  private _samePath(a: string, b: string): boolean {
    try {
      const ca = GLib.canonicalize_filename(a, null);
      const cb = GLib.canonicalize_filename(b, null);
      return ca === cb;
    } catch {
      return a === b;
    }
  }

  private scheduleGenerate(ms = 150): void {
    this._debounce.schedule(() => this.generate().catch(() => { }), ms);
  }

  private buildMatugenCommand(imagePath: string): string[] {
    const mode = options.colors.themeMode.get();
    const type = options.colors.matugen.type.get();
    const contrast = clamp(options.colors.matugen.contrast.get(), -1, 1);

    const argv: string[] = [
      "matugen",
      "image",
      imagePath,
      "-m",
      mode,
      "-t",
      type,
      "--contrast",
      String(contrast),
      "--json",
      "hex",
    ];

    const resizeFilter = options.colors.matugen.resizeFilter.get();
    if (resizeFilter && resizeFilter !== "none") argv.push("--resize-filter", resizeFilter);

    return argv;
  }

  private validateHexOutput(obj: MatugenJson): void {
    const colors = (obj as any)?.colors;
    const sample = colors?.dark?.primary ?? colors?.light?.primary;
    if (typeof sample === "string" && !isHexColor(sample)) {
      console.warn("[Matugen] Output primary color is not hex:", sample);
    }
  }

  public async generate(): Promise<void> {
    if (!options.colors.enableMatugen.get()) return;
    if (!SystemUtilities.checkDependencies("matugen")) return;

    const managed = options.display.wallpaper.file.get();
    if (!hasUsableFile(managed)) return;

    const argv = this.buildMatugenCommand(managed);

    let out: string;
    try {
      out = await SystemUtilities.sh(argv);
    } catch (e) {
      console.error("[Matugen] matugen execution failed:", e);
      console.error("[Matugen] argv:", argv.join(" "));
      return;
    }

    if (!out.trim()) {
      console.error("[Matugen] matugen returned empty stdout");
      console.error("[Matugen] argv:", argv.join(" "));
      return;
    }

    const parsed = tryParseMatugenJson(out);

    if (!parsed.ok) {
      console.error("[Matugen] failed to extract/parse JSON:", parsed.error);
      console.error("[Matugen] extracted json candidate:", parsed.jsonText);
      console.error("[Matugen] raw output:", out);
      return;
    }

    this._lastPalette = parsed.value;
    this.validateHexOutput(parsed.value);

    const pretty = JSON.stringify(parsed.value, null, 2);

    if (options.colors.exportColorSchema.enabled.get()) {
      const outFile = options.colors.exportColorSchema.file.get();
      const dir = GLib.path_get_dirname(outFile);

      try {
        ensureDirectory(dir);
        writeFile(outFile, pretty);
        console.log("[Matugen] wrote:", outFile);
      } catch (e) {
        console.error("[Matugen] export failed:", e);
      }
    }
  }
}

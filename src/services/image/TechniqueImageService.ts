import GLib from "gi://GLib?version=2.0";
import Gio from "gi://Gio?version=2.0";
import { monitorFile } from "ags/file";
import { execAsync } from "ags/process";
import { Timer, timeout } from "ags/time";
import { ensureDirectory } from "src/lib/session/api";
import { joinPath, normalizeToAbsolutePath } from "src/lib/path/helpers";
import { SystemUtilities } from "src/lib/system/SystemUtilities";
import type { ImageTechnique } from "src/lib/options/types";
import { CACHE } from "src/lib/session/api";

type Subscriber = (outPath: string) => void;

type Stat = {
  exists: boolean;
  mtime: number; // seconds
  size: number;
};

type Entry = {
  key: string;
  src: string;
  technique: ImageTechnique; // effective (already gated by enable)
  group: string;

  outDir: string;
  outPath: string;

  subs: Set<Subscriber>;
  monitor?: Gio.FileMonitor;

  debounce?: Timer;
  inflight?: Promise<string>;
  gen: number;
};

export class TechniqueImageService {
  private static _instance: TechniqueImageService | undefined;
  public static getInstance(): TechniqueImageService {
    if (!this._instance) this._instance = new TechniqueImageService();
    return this._instance;
  }

  private constructor() { }

  private _entries = new Map<string, Entry>();
  private _magickBin: string | null | undefined = undefined;

  // ---------- public API (corner-focused helpers) ----------

  public async getCornerOuterImage(
    src: string,
    enableTechnique: boolean,
    technique: ImageTechnique,
  ): Promise<string> {
    return this.getPng(src, enableTechnique, technique, "corner-outer-image");
  }

  public watchCornerOuterImage(
    src: string,
    enableTechnique: boolean,
    technique: ImageTechnique,
    cb: Subscriber,
  ): () => void {
    return this.watch(src, enableTechnique, technique, "corner-outer-image", cb);
  }

  // ---------- generic API ----------

  public async getPng(
    src: string,
    enableTechnique: boolean,
    technique: ImageTechnique,
    group: string,
  ): Promise<string> {
    const s = this._normalize(src);
    const eff = this._effectiveTechnique(enableTechnique, technique);
    const entry = this._ensureEntry(s, eff, group);
    return this._ensureFresh(entry);
  }

  public watch(
    src: string,
    enableTechnique: boolean,
    technique: ImageTechnique,
    group: string,
    cb: Subscriber,
  ): () => void {
    const s = this._normalize(src);
    const eff = this._effectiveTechnique(enableTechnique, technique);
    const entry = this._ensureEntry(s, eff, group);

    entry.subs.add(cb);
    this._ensureMonitor(entry);

    // fire once immediately with current (fresh) output
    void this._ensureFresh(entry).then((out) => cb(out)).catch(() => { });

    return () => {
      entry.subs.delete(cb);

      // optional cleanup: tear down monitor if nobody cares anymore
      if (entry.subs.size === 0) {
        try { entry.monitor?.cancel(); } catch { }
        entry.monitor = undefined;
        entry.debounce?.cancel();
        entry.debounce = undefined;
      }
    };
  }

  // ---------- internals ----------

  private _normalize(path: string): string {
    // expand '~' etc
    const abs = normalizeToAbsolutePath(path);
    try {
      return GLib.canonicalize_filename(abs, null);
    } catch {
      return abs;
    }
  }

  private _effectiveTechnique(enable: boolean, technique: ImageTechnique): ImageTechnique {
    if (!enable) return "none";
    return technique ?? "none";
  }

  private _entryKey(src: string, eff: ImageTechnique, group: string): string {
    return `${group}|${src}|${eff}`;
  }

  private _ensureEntry(src: string, eff: ImageTechnique, group: string): Entry {
    const key = this._entryKey(src, eff, group);
    const existing = this._entries.get(key);
    if (existing) return existing;

    // folder isolates collisions; filename keeps “same name + technique”
    const pathHash = GLib.compute_checksum_for_string(GLib.ChecksumType.SHA256, src, -1)?.slice(0, 10) ?? "basic"

    const base = GLib.path_get_basename(src);
    const stem = base.replace(/\.[^.]+$/, "");
    const outDir = joinPath(CACHE, group, pathHash);
    ensureDirectory(outDir);

    const outName = `${stem}--${eff}.png`;
    const outPath = joinPath(outDir, outName);

    const entry: Entry = {
      key,
      src,
      technique: eff,
      group,
      outDir,
      outPath,
      subs: new Set(),
      gen: 0,
    };

    this._entries.set(key, entry);
    return entry;
  }

  private _ensureMonitor(entry: Entry): void {
    if (entry.monitor) return;

    const parent = GLib.path_get_dirname(entry.src);
    entry.monitor = monitorFile(parent, (changedPath) => {
      if (!this._samePath(changedPath, entry.src)) return;
      this._scheduleRebuild(entry);
    });
  }

  private _samePath(a: string, b: string): boolean {
    try {
      return GLib.canonicalize_filename(a, null) === GLib.canonicalize_filename(b, null);
    } catch {
      return a === b;
    }
  }

  private _scheduleRebuild(entry: Entry): void {
    entry.debounce?.cancel();
    entry.debounce = timeout(80, () => void this._rebuildAndNotify(entry));
  }

  private async _rebuildAndNotify(entry: Entry): Promise<void> {
    const gen = ++entry.gen;

    let out: string;
    try {
      out = await this._ensureFresh(entry);
    } catch {
      return;
    }
    if (gen !== entry.gen) return;

    for (const cb of entry.subs) {
      try { cb(out); } catch { }
    }
  }

  private _stat(path: string): Stat {
    try {
      const f = Gio.File.new_for_path(path);
      if (!f.query_exists(null)) return { exists: false, mtime: 0, size: 0 };

      const info = f.query_info("time::modified,standard::size", Gio.FileQueryInfoFlags.NONE, null);
      const mtime = Number(info.get_attribute_uint64("time::modified") ?? 0);
      const size = Number(info.get_size?.() ?? info.get_attribute_uint64("standard::size") ?? 0);

      return { exists: true, mtime, size };
    } catch {
      return { exists: false, mtime: 0, size: 0 };
    }
  }

  private _isFresh(entry: Entry): boolean {
    const s = this._stat(entry.src);
    if (!s.exists || s.size <= 0) return false;

    const o = this._stat(entry.outPath);
    if (!o.exists || o.size <= 0) return false;

    // if src was modified after output, output is stale
    return o.mtime >= s.mtime;
  }

  private _pickMagick(): string | null {
    if (this._magickBin !== undefined) return this._magickBin;

    if (SystemUtilities.checkExecutable(["magick"])) this._magickBin = "magick";
    else if (SystemUtilities.checkExecutable(["convert"])) this._magickBin = "convert";
    else this._magickBin = null;

    return this._magickBin;
  }

  private _techniqueArgs(tech: ImageTechnique): string[] {
    switch (tech) {
      case "negative":
        return ["-negate"];
      case "grayscale":
        return ["-colorspace", "Gray"];
      case "sepia":
        return ["-sepia-tone", "80%"];
      case "none":
      default:
        return [];
    }
  }

  private async _ensureFresh(entry: Entry): Promise<string> {
    if (this._isFresh(entry)) return entry.outPath;
    if (entry.inflight) return entry.inflight;

    entry.inflight = (async () => {
      const bin = this._pickMagick();

      // fallback: allow direct PNG if no magick and no transformation
      if (!bin) {
        if (entry.technique === "none" && entry.src.toLowerCase().endsWith(".png")) {
          return entry.src;
        }
        throw new Error("[TechniqueImageService] ImageMagick not found (magick/convert)");
      }

      ensureDirectory(entry.outDir);

      const argv = [
        bin,
        entry.src,
        "-auto-orient",
        ...this._techniqueArgs(entry.technique),
        entry.outPath,
      ];

      await execAsync(argv);
      return entry.outPath;
    })();

    try {
      return await entry.inflight;
    } finally {
      entry.inflight = undefined;
    }
  }
}
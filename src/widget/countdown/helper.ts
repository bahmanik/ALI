import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { writeFile } from "ags/file";

import { ensureDirectory, copyFile, deleteFile } from "src/lib/session";
import { joinPath, normalizeToAbsolutePath, extFromPath } from "src/lib/path/helpers";

type IsoInstant = string;        // "...Z"
type IsoLocalDateTime = string;  // "YYYY-MM-DDTHH:mm:ss"

export type Countdown = {
  id: string;
  groupId?: string;

  titleTemplate: string;
  description?: string;

  // Stored path is always the CACHED path after store/edit (or undefined)
  imagePath?: string;

  tzid: string;

  schedule:
  | { kind: "once"; at: IsoInstant }
  | {
    kind: "rrule";
    dtstart: IsoLocalDateTime;
    rrule: string;
    exdate?: IsoLocalDateTime[];
    rdate?: IsoLocalDateTime[];
  };

  naming?: { counterStart?: number; counterStep?: number };

  notifyOnReach: boolean;
  actionCommand?: { label: string; command: string };

  // Occurrence key:
  // - for "once": use schedule.at (IsoInstant)
  // - for "rrule": use occurrence local datetime (IsoLocalDateTime in tzid)
  occurrenceState?: Record<
    string,
    { notifiedAt?: IsoInstant; deletedAt?: IsoInstant; reachedAt?: IsoInstant }
  >;

  // Per-occurrence edits (title/desc/action/notify/image)
  occurrenceOverrides?: Record<
    string,
    {
      titleTemplate?: string;
      description?: string;
      notifyOnReach?: boolean;
      actionCommand?: { label: string; command: string };
      imagePath?: string; // optional: cached override image path
    }
  >;

  createdAt: IsoInstant;
  updatedAt?: IsoInstant;
  disabled?: boolean;
};

export type StoreCountdownResult = {
  jsonPath: string;
  storedCountdown: Countdown;
  storedImagePath?: string;
};

export type EditCountdownPatch = Partial<Omit<Countdown, "id" | "createdAt">> & {
  /**
   * imagePath semantics:
   *  - undefined: keep current image
   *  - null / "": remove current image
   *  - string: replace image from that source path (copied into cache as `${id}${ext}`)
   */
  imagePath?: string | null;
};

export type EditCountdownResult = {
  jsonPath: string;
  storedCountdown: Countdown;
  storedImagePath?: string;
  deletedImagePath?: string;
};

export type DeleteCountdownResult = {
  deletedJsonPath: string;
  deletedImagePath?: string;
};

export type DeleteOccurrenceMode = "soft" | "exdate";

export type EditOccurrencePatch = {
  titleTemplate?: string;
  description?: string;
  notifyOnReach?: boolean;
  actionCommand?: { label: string; command: string };

  /**
   * Per-occurrence image override:
   *  - undefined: keep
   *  - null / "": remove override image
   *  - string: set override image (cached as `images/${id}__occ_${hash(key)}${ext}`)
   */
  imagePath?: string | null;
};

function nowIsoUtc(): IsoInstant {
  return new Date().toISOString();
}

function countdownDirs() {
  const baseDir = joinPath(CACHE, "countdown");
  const dataDir = joinPath(baseDir, "data");
  const imagesDir = joinPath(baseDir, "images");
  ensureDirectory(dataDir);
  ensureDirectory(imagesDir);
  return { baseDir, dataDir, imagesDir };
}

function jsonPathForId(id: string) {
  const { dataDir } = countdownDirs();
  return joinPath(dataDir, `${id}.json`);
}

function readJsonFile<T>(path: string): T {
  const file = Gio.File.new_for_path(path);
  const [, raw] = file.load_contents(null);
  const text = new TextDecoder().decode(raw);
  return JSON.parse(text) as T;
}

function isInside(dir: string, path: string) {
  const prefix = joinPath(dir, "");
  return path.startsWith(prefix);
}

function pushUnique<T>(arr: T[] | undefined, v: T): T[] {
  const a = arr ? [...arr] : [];
  if (!a.includes(v)) a.push(v);
  return a;
}

function hash12(input: string): string {
  const c = new GLib.Checksum(GLib.ChecksumType.SHA256);
  c.update(input);
  return (c.get_string() ?? "").slice(0, 12);
}

function seriesImageDst(id: string, srcPath: string) {
  const { imagesDir } = countdownDirs();
  const ext = extFromPath(srcPath);
  return joinPath(imagesDir, `${id}${ext}`); // ext may be ""
}

function occImageDst(id: string, occurrenceKey: string, srcPath: string) {
  const { imagesDir } = countdownDirs();
  const ext = extFromPath(srcPath);
  return joinPath(imagesDir, `${id}__occ_${hash12(occurrenceKey)}${ext}`);
}

/**
 * Store new countdown (series-level)
 * - JSON: data/<id>.json
 * - Image: images/<id><ext>
 */
export function storeCountdownToCache(countdown: Countdown, sourceImagePath?: string): StoreCountdownResult {
  const { imagesDir } = countdownDirs();
  void imagesDir;

  let stored = { ...countdown };
  let storedImagePath: string | undefined;

  if (sourceImagePath && sourceImagePath.trim()) {
    const src = normalizeToAbsolutePath(sourceImagePath.trim());
    const dst = seriesImageDst(countdown.id, src);
    copyFile(src, dst, true);
    storedImagePath = dst;
    stored.imagePath = dst;
  }

  const jsonPath = jsonPathForId(countdown.id);
  writeFile(jsonPath, JSON.stringify(stored, null, 2));
  return { jsonPath, storedCountdown: stored, storedImagePath };
}

/**
 * Edit countdown (series-level):
 * - edits fields on the definition
 * - optionally remove/replace series image at images/<id><ext>
 */
export function editCountdownInCache(id: string, patch: EditCountdownPatch): EditCountdownResult {
  const { imagesDir } = countdownDirs();

  const path = jsonPathForId(id);
  const old = readJsonFile<Countdown>(path);

  const { imagePath: patchImagePath, ...rest } = patch;

  let next: Countdown = {
    ...old,
    ...rest,
    id: old.id,
    createdAt: old.createdAt,
    updatedAt: nowIsoUtc(),
  };

  let storedImagePath: string | undefined;
  let deletedImagePath: string | undefined;

  if (patchImagePath !== undefined) {
    const oldImg = old.imagePath?.trim() ? old.imagePath.trim() : undefined;

    // Remove series image
    if (patchImagePath === null || String(patchImagePath).trim() === "") {
      if (oldImg && isInside(imagesDir, oldImg)) {
        deleteFile(oldImg);
        deletedImagePath = oldImg;
      }
      next.imagePath = undefined;
    } else {
      // Replace series image
      const src = normalizeToAbsolutePath(String(patchImagePath).trim());
      const dst = seriesImageDst(id, src);

      // If extension changed, delete old cached series image first
      if (oldImg && oldImg !== dst && isInside(imagesDir, oldImg)) {
        deleteFile(oldImg);
        deletedImagePath = oldImg;
      }

      if (src !== dst) copyFile(src, dst, true);

      storedImagePath = dst;
      next.imagePath = dst;
    }
  }

  writeFile(path, JSON.stringify(next, null, 2));
  return { jsonPath: path, storedCountdown: next, storedImagePath, deletedImagePath };
}

/**
 * Delete countdown entirely (series-level):
 * - deletes JSON
 * - deletes cached series image (if any)
 */
export function deleteCountdownInCache(id: string): DeleteCountdownResult {
  const { imagesDir } = countdownDirs();

  const path = jsonPathForId(id);
  const old = readJsonFile<Countdown>(path);

  // delete cached series image (stable path stored in JSON)
  const oldImg = old.imagePath?.trim() ? old.imagePath.trim() : undefined;
  let deletedImagePath: string | undefined;

  if (oldImg && isInside(imagesDir, oldImg)) {
    deleteFile(oldImg);
    deletedImagePath = oldImg;
  }

  deleteFile(path);
  return { deletedJsonPath: path, deletedImagePath };
}

/**
 * Delete ONE occurrence in a series/group (e.g. "episode 9")
 *
 * mode:
 * - "soft": sets occurrenceState[key].deletedAt (undoable, doesn’t change RRULE)
 * - "exdate": adds to schedule.exdate if RRULE (calendar-correct cancellation)
 */
export function deleteOccurrenceInCache(
  id: string,
  occurrenceKey: string,
  mode: DeleteOccurrenceMode = "soft",
): EditCountdownResult {
  const path = jsonPathForId(id);
  const old = readJsonFile<Countdown>(path);
  const now = nowIsoUtc();

  let next = { ...old, updatedAt: now };

  if (mode === "exdate" && next.schedule.kind === "rrule") {
    next.schedule = {
      ...next.schedule,
      exdate: pushUnique(next.schedule.exdate, occurrenceKey as IsoLocalDateTime),
    };
  } else {
    const state = { ...(next.occurrenceState ?? {}) };
    state[occurrenceKey] = { ...(state[occurrenceKey] ?? {}), deletedAt: now };
    next.occurrenceState = state;
  }

  writeFile(path, JSON.stringify(next, null, 2));
  return { jsonPath: path, storedCountdown: next };
}

/**
 * Edit ONE occurrence (title/desc/action/notify/image override).
 * Does NOT change the whole series.
 */
export function editOccurrenceInCache(
  id: string,
  occurrenceKey: string,
  patch: EditOccurrencePatch,
): EditCountdownResult {
  const { imagesDir } = countdownDirs();
  const path = jsonPathForId(id);
  const old = readJsonFile<Countdown>(path);

  const overrides = { ...(old.occurrenceOverrides ?? {}) };
  const current = { ...(overrides[occurrenceKey] ?? {}) };

  const { imagePath: patchImagePath, ...rest } = patch;

  let deletedImagePath: string | undefined;
  let storedImagePath: string | undefined;

  // Apply non-image override fields
  const merged = { ...current, ...rest };

  // Handle per-occurrence image override
  if (patchImagePath !== undefined) {
    const oldOverrideImg = current.imagePath?.trim() ? current.imagePath.trim() : undefined;

    if (patchImagePath === null || String(patchImagePath).trim() === "") {
      // remove override image
      if (oldOverrideImg && isInside(imagesDir, oldOverrideImg)) {
        deleteFile(oldOverrideImg);
        deletedImagePath = oldOverrideImg;
      }
      delete merged.imagePath;
    } else {
      const src = normalizeToAbsolutePath(String(patchImagePath).trim());
      const dst = occImageDst(id, occurrenceKey, src);

      if (oldOverrideImg && oldOverrideImg !== dst && isInside(imagesDir, oldOverrideImg)) {
        deleteFile(oldOverrideImg);
        deletedImagePath = oldOverrideImg;
      }

      if (src !== dst) copyFile(src, dst, true);
      merged.imagePath = dst;
      storedImagePath = dst;
    }
  }

  overrides[occurrenceKey] = merged;

  const next: Countdown = {
    ...old,
    occurrenceOverrides: overrides,
    updatedAt: nowIsoUtc(),
  };

  writeFile(path, JSON.stringify(next, null, 2));
  return { jsonPath: path, storedCountdown: next, storedImagePath, deletedImagePath };
}

/**
 * Reschedule ONE occurrence in an RRULE series:
 * - EXDATE oldKey
 * - RDATE newKey
 * - migrates occurrenceState + occurrenceOverrides from oldKey -> newKey
 */
export function moveOccurrenceInCache(
  id: string,
  fromKey: IsoLocalDateTime,
  toKey: IsoLocalDateTime,
): EditCountdownResult {
  const path = jsonPathForId(id);
  const old = readJsonFile<Countdown>(path);

  if (old.schedule.kind !== "rrule") {
    // no-op for one-off
    return { jsonPath: path, storedCountdown: old };
  }

  const schedule = {
    ...old.schedule,
    exdate: pushUnique(old.schedule.exdate, fromKey),
    rdate: pushUnique(old.schedule.rdate, toKey),
  };

  const state = { ...(old.occurrenceState ?? {}) };
  if (state[fromKey]) {
    state[toKey] = { ...(state[toKey] ?? {}), ...state[fromKey] };
    delete state[fromKey];
  }

  const overrides = { ...(old.occurrenceOverrides ?? {}) };
  if (overrides[fromKey]) {
    overrides[toKey] = { ...(overrides[toKey] ?? {}), ...overrides[fromKey] };
    delete overrides[fromKey];
  }

  const next: Countdown = {
    ...old,
    schedule,
    occurrenceState: state,
    occurrenceOverrides: overrides,
    updatedAt: nowIsoUtc(),
  };

  writeFile(path, JSON.stringify(next, null, 2));
  return { jsonPath: path, storedCountdown: next };
}

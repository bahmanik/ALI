import 'src/lib/session';

import Gio from 'gi://Gio?version=2.0';
import GLib from 'gi://GLib?version=2.0';
import AstalNotifd from 'gi://AstalNotifd?version=0.1';

import { readFile, writeFile } from 'ags/file';
import { execAsync } from 'ags/process';
import { timeout } from 'ags/time';
import type { Timer } from 'ags/time';

import icons from 'src/lib/icons/icons';
import { notify, type NotificationAction } from 'src/lib/notiofication';
import { ensureDirectory, ensureParentDir } from 'src/lib/session';
import { extFromPath, joinPath } from 'src/lib/path/helpers';
import { SystemUtilities } from 'src/lib/system/SystemUtilities';

// ---------------------------------
// Types
// ---------------------------------

export type IsoInstant = string; // e.g. 2026-12-25T00:00:00.000Z
export type IsoLocalDateTime = string; // e.g. 2026-03-01T21:00:00 (in tzid)

export type CountdownActionCommand = {
  label: string;
  command: string;
};

export type CountdownScheduleOnce = {
  kind: 'once';
  at: IsoInstant | IsoLocalDateTime;
};

export type CountdownScheduleRrule = {
  kind: 'rrule';
  dtstart: IsoLocalDateTime;
  rrule: string; // RFC5545 RRULE string (subset supported)
  exdate: IsoLocalDateTime[];
  rdate: IsoLocalDateTime[];
};

export type CountdownSchedule = CountdownScheduleOnce | CountdownScheduleRrule;

export type CountdownOccurrenceState = {
  deletedAt?: IsoInstant;
  notifiedAt?: IsoInstant;
};

export type CountdownOccurrenceOverride = {
  titleTemplate?: string;
  description?: string;
  // Cached image path (stable)
  imagePath?: string;
  actionCommand?: CountdownActionCommand;
};

export type Countdown = {
  id: string;
  tzid: string; // e.g. 'Europe/Zurich'

  // Display template (you can implement {n} expansion in UI later)
  titleTemplate: string;
  description?: string;

  // Cached image path (stable per-id)
  imagePath?: string;

  actionCommand?: CountdownActionCommand;
  disabled?: boolean;

  schedule: CountdownSchedule;

  // Per-occurrence bookkeeping
  occurrenceState?: Record<string, CountdownOccurrenceState>;
  occurrenceOverrides?: Record<string, CountdownOccurrenceOverride>;

  createdAt: IsoInstant;
  updatedAt?: IsoInstant;
};

export type EditCountdownPatch = Partial<Omit<Countdown, 'id' | 'createdAt'>> & {
  // string: treat as source path and cache it
  // null: remove cached image
  // undefined: keep
  imagePath?: string | null;
};

export type EditOccurrencePatch = Partial<CountdownOccurrenceOverride> & {
  imagePath?: string | null;
};

export type DeleteOccurrenceMode = 'soft' | 'exdate';

export type CountdownUiSlide = {
  countdownId: string;
  occKey: string;
  whenMs: number;
  isPast: boolean;
  title: string;
  description?: string;
  imagePath?: string;
  actionCommand?: CountdownActionCommand;
};

// ---------------------------------
// Cache layout
// ---------------------------------

const CACHE_ROOT = joinPath(CACHE, 'countdown');
const DATA_DIR = joinPath(CACHE_ROOT, 'data');
const IMAGES_DIR = joinPath(CACHE_ROOT, 'images');

function ensureCacheDirs(): void {
  ensureDirectory(DATA_DIR);
  ensureDirectory(IMAGES_DIR);
}

function dataPath(id: string): string {
  return joinPath(DATA_DIR, `${id}.json`);
}

function fileExists(path: string): boolean {
  return GLib.file_test(path, GLib.FileTest.EXISTS);
}

function nowIso(): IsoInstant {
  return new Date().toISOString();
}

function hashKey(key: string): string {
  return GLib.compute_checksum_for_string(GLib.ChecksumType.SHA1, key, -1);
}

function deleteFile(path: string): void {
  if (!fileExists(path)) return;
  try {
    Gio.File.new_for_path(path).delete(null);
  } catch (e) {
    console.debug('[Countdown] deleteFile failed:', path, e);
  }
}

function deleteIdImages(id: string): void {
  // Remove any cached image matching `${id}*` (id image + occurrence override images).
  try {
    const dir = Gio.File.new_for_path(IMAGES_DIR);
    const it = dir.enumerate_children('standard::name', Gio.FileQueryInfoFlags.NONE, null);

    while (true) {
      const info = it.next_file(null);
      if (!info) break;
      const name = info.get_name();
      if (!name) continue;
      if (!name.startsWith(id)) continue;
      deleteFile(joinPath(IMAGES_DIR, name));
    }
  } catch (e) {
    console.debug('[Countdown] deleteIdImages failed:', id, e);
  }
}

async function copyImageStable(dstPath: string, srcPath: string): Promise<void> {
  ensureParentDir(dstPath);
  // '--' prevents option injection if srcPath starts with '-'
  await execAsync(['cp', '-f', '--', srcPath, dstPath]);
}

function ensureOccMaps(c: Countdown): Required<Pick<Countdown, 'occurrenceState' | 'occurrenceOverrides'>> {
  return {
    occurrenceState: c.occurrenceState ?? {},
    occurrenceOverrides: c.occurrenceOverrides ?? {},
  };
}

function occurrenceImagePath(id: string, occKey: string, srcPath: string): string {
  const ext = extFromPath(srcPath);
  const h = hashKey(occKey);
  return joinPath(IMAGES_DIR, `${id}__${h}${ext}`);
}

function deleteOccurrenceImages(id: string, occKey: string): void {
  const h = hashKey(occKey);
  try {
    const dir = Gio.File.new_for_path(IMAGES_DIR);
    const it = dir.enumerate_children('standard::name', Gio.FileQueryInfoFlags.NONE, null);

    while (true) {
      const info = it.next_file(null);
      if (!info) break;
      const name = info.get_name();
      if (!name) continue;
      if (!name.startsWith(`${id}__${h}`)) continue;
      deleteFile(joinPath(IMAGES_DIR, name));
    }
  } catch (e) {
    console.debug('[Countdown] deleteOccurrenceImages failed:', id, occKey, e);
  }
}

// ---------------------------------
// RRULE subset engine (good enough for countdowns)
// ---------------------------------

type RRuleFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type ParsedRRule = {
  freq: RRuleFreq;
  interval: number;
  count?: number;
  untilMs?: number;
};

function parseRrule(rrule: string, tzid: string): ParsedRRule {
  const parts = rrule
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  const kv: Record<string, string> = {};
  for (const p of parts) {
    const i = p.indexOf('=');
    if (i <= 0) continue;
    kv[p.slice(0, i).toUpperCase()] = p.slice(i + 1);
  }

  const freq = (kv['FREQ']?.toUpperCase() ?? '') as RRuleFreq;
  if (!freq || !['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) {
    throw new Error(`Unsupported RRULE FREQ: ${kv['FREQ'] ?? ''}`);
  }

  const interval = Math.max(1, Number.parseInt(kv['INTERVAL'] ?? '1', 10) || 1);

  const countRaw = kv['COUNT'];
  const count = countRaw ? Math.max(0, Number.parseInt(countRaw, 10) || 0) : undefined;

  const untilRaw = kv['UNTIL'];
  const untilMs = untilRaw ? parseUntilToMs(untilRaw, tzid) : undefined;

  return { freq, interval, count: count && count > 0 ? count : undefined, untilMs };
}

function parseUntilToMs(until: string, tzid: string): number {
  const s = until.trim();
  if (!s) return Number.NaN;

  // Fast path: ISO parsable.
  const isoTry = Date.parse(s);
  if (Number.isFinite(isoTry)) return isoTry;

  // iCal basic form: YYYYMMDDTHHMMSS(Z?)
  const m = /^([0-9]{4})([0-9]{2})([0-9]{2})T([0-9]{2})([0-9]{2})([0-9]{2})(Z?)$/.exec(s);
  if (!m) return Number.NaN;

  const y = Number.parseInt(m[1]!, 10);
  const mo = Number.parseInt(m[2]!, 10);
  const d = Number.parseInt(m[3]!, 10);
  const hh = Number.parseInt(m[4]!, 10);
  const mm = Number.parseInt(m[5]!, 10);
  const ss = Number.parseInt(m[6]!, 10);
  const isUtc = m[7] === 'Z';

  if (isUtc) return Date.UTC(y, mo - 1, d, hh, mm, ss);
  return localDateTimeToMs(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`, tzid);
}

function localDateTimeToMs(local: IsoLocalDateTime, tzid: string): number {
  const tz = GLib.TimeZone.new(tzid);

  const m =
    /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$/.exec(local);
  if (!m) return Number.NaN;

  const y = Number.parseInt(m[1]!, 10);
  const mo = Number.parseInt(m[2]!, 10);
  const d = Number.parseInt(m[3]!, 10);
  const hh = Number.parseInt(m[4]!, 10);
  const mm = Number.parseInt(m[5]!, 10);
  const ss = Number.parseInt(m[6] ?? '0', 10);

  const dt = GLib.DateTime.new(tz, y, mo, d, hh, mm, ss);
  return dt.to_unix() * 1000;
}

type Occurrence = { key: string; whenMs: number };

function resolveOccurrence(c: Countdown, occKey: string): {
  title: string;
  description?: string;
  imagePath?: string;
  actionCommand?: CountdownActionCommand;
} {
  const ov = c.occurrenceOverrides?.[occKey];
  return {
    title: ov?.titleTemplate ?? c.titleTemplate,
    description: ov?.description ?? c.description,
    imagePath: ov?.imagePath ?? c.imagePath,
    actionCommand: ov?.actionCommand ?? c.actionCommand,
  };
}

function collectDueAndNext(c: Countdown, nowMs: number): { due: Occurrence[]; next?: Occurrence } {
  if (c.disabled) return { due: [] };

  const state = c.occurrenceState ?? {};
  const due: Occurrence[] = [];
  let next: Occurrence | undefined;

  if (c.schedule.kind === 'once') {
    const atMs = Date.parse(c.schedule.at);
    const whenMs = Number.isFinite(atMs) ? atMs : localDateTimeToMs(c.schedule.at, c.tzid);
    if (!Number.isFinite(whenMs)) return { due: [] };

    const key = String(c.schedule.at);
    const st = state[key];
    if (st?.deletedAt) return { due: [] };
    if (whenMs <= nowMs) {
      if (!st?.notifiedAt) due.push({ key, whenMs });
    } else {
      if (!st?.notifiedAt) next = { key, whenMs };
    }

    return { due, next };
  }

  // RRULE
  const { dtstart, rrule, exdate, rdate } = c.schedule;
  const parsed = parseRrule(rrule, c.tzid);
  const ex = new Set<string>((exdate ?? []).map(String));

  const addOcc = (key: string, whenMs: number) => {
    if (!Number.isFinite(whenMs)) return;
    if (ex.has(key)) return;
    const st = state[key];
    if (st?.deletedAt) return;
    if (whenMs <= nowMs) {
      if (!st?.notifiedAt) due.push({ key, whenMs });
    } else {
      if (st?.notifiedAt) return;
      if (!next || whenMs < next.whenMs) next = { key, whenMs };
    }
  };

  // RDATEs
  for (const k of rdate ?? []) {
    addOcc(k, localDateTimeToMs(k, c.tzid));
  }

  const startMs = localDateTimeToMs(dtstart, c.tzid);
  if (!Number.isFinite(startMs)) return { due: [], next };

  const tz = GLib.TimeZone.new(c.tzid);
  let dt = GLib.DateTime.new_from_unix_utc(Math.floor(startMs / 1000))?.to_timezone(tz);
  if (!dt) return { due: [], next };

  const maxIter = 10_000;
  let produced = 0;

  while (produced < maxIter) {
    produced++;
    const whenMs = dt.to_unix() * 1000;
    const key = dt.format('%Y-%m-%dT%H:%M:%S');

    if (parsed.untilMs !== undefined && whenMs > parsed.untilMs) break;
    if (parsed.count !== undefined && produced > parsed.count) break;

    addOcc(key, whenMs);

    // If we found the next one and we stepped beyond it, bail.
    if (next && whenMs > next.whenMs && whenMs > nowMs) break;

    // step
    if (parsed.freq === 'DAILY') dt = dt.add_days(parsed.interval) ?? dt;
    if (parsed.freq === 'WEEKLY') dt = dt.add_weeks(parsed.interval) ?? dt;
    if (parsed.freq === 'MONTHLY') dt = dt.add_months(parsed.interval) ?? dt;
    if (parsed.freq === 'YEARLY') dt = dt.add_years(parsed.interval) ?? dt;
  }

  due.sort((a, b) => a.whenMs - b.whenMs);
  return { due, next };
}

function collectVisibleForUi(c: Countdown, nowMs: number, pastLimit: number): Occurrence[] {
  if (c.disabled) return [];
  const state = c.occurrenceState ?? {};

  if (c.schedule.kind === 'once') {
    const atMs = Date.parse(c.schedule.at);
    const whenMs = Number.isFinite(atMs) ? atMs : localDateTimeToMs(c.schedule.at, c.tzid);
    if (!Number.isFinite(whenMs)) return [];
    const key = String(c.schedule.at);
    if (state[key]?.deletedAt) return [];
    return [{ key, whenMs }];
  }

  const { dtstart, rrule, exdate, rdate } = c.schedule;
  const parsed = parseRrule(rrule, c.tzid);
  const ex = new Set<string>((exdate ?? []).map(String));

  const past: Occurrence[] = [];
  let next: Occurrence | undefined;

  const addUi = (key: string, whenMs: number) => {
    if (!Number.isFinite(whenMs)) return;
    if (ex.has(key)) return;
    if (state[key]?.deletedAt) return;
    if (whenMs <= nowMs) {
      past.push({ key, whenMs });
    } else {
      if (!next || whenMs < next.whenMs) next = { key, whenMs };
    }
  };

  // RDATEs
  for (const k of rdate ?? []) {
    addUi(k, localDateTimeToMs(k, c.tzid));
  }

  const startMs = localDateTimeToMs(dtstart, c.tzid);
  if (!Number.isFinite(startMs)) {
    const out = past.sort((a, b) => b.whenMs - a.whenMs).slice(0, Math.max(0, pastLimit));
    return next ? [...out, next] : out;
  }

  const tz = GLib.TimeZone.new(c.tzid);
  let dt = GLib.DateTime.new_from_unix_utc(Math.floor(startMs / 1000))?.to_timezone(tz);
  if (!dt) return [];

  const maxIter = 10_000;
  let produced = 0;

  while (produced < maxIter) {
    produced++;
    const whenMs = dt.to_unix() * 1000;
    const key = dt.format('%Y-%m-%dT%H:%M:%S');

    if (parsed.untilMs !== undefined && whenMs > parsed.untilMs) break;
    if (parsed.count !== undefined && produced > parsed.count) break;

    addUi(key, whenMs);

    // If we already found the next one and we're now past it, stop.
    if (next && whenMs > next.whenMs && whenMs > nowMs) break;

    if (parsed.freq === 'DAILY') dt = dt.add_days(parsed.interval) ?? dt;
    if (parsed.freq === 'WEEKLY') dt = dt.add_weeks(parsed.interval) ?? dt;
    if (parsed.freq === 'MONTHLY') dt = dt.add_months(parsed.interval) ?? dt;
    if (parsed.freq === 'YEARLY') dt = dt.add_years(parsed.interval) ?? dt;
  }

  past.sort((a, b) => b.whenMs - a.whenMs);
  const trimmedPast = pastLimit > 0 ? past.slice(0, pastLimit) : [];
  return next ? [...trimmedPast, next] : trimmedPast;
}

// ---------------------------------
// Service
// ---------------------------------

const CATEGORY = 'ALI.countdown';
const ACTION_PREFIX = 'cd';

function encodeKey(s: string): string {
  return encodeURIComponent(s);
}

function decodeKey(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

type ParsedAction =
  | { kind: 'run'; id: string; key: string }
  | { kind: 'delete'; id: string; key: string }
  | { kind: 'unknown' };

function parseActionId(actionId: string): ParsedAction {
  const parts = actionId.split(':');
  if (parts.length < 4) return { kind: 'unknown' };
  if (parts[0] !== ACTION_PREFIX) return { kind: 'unknown' };
  const kind = parts[1];
  const id = parts[2];
  const key = decodeKey(parts.slice(3).join(':'));
  if (kind === 'run') return { kind: 'run', id, key };
  if (kind === 'del') return { kind: 'delete', id, key };
  return { kind: 'unknown' };
}

export default class CountdownService {
  private static _instance: CountdownService | null = null;

  public static getInstance(): CountdownService {
    if (!CountdownService._instance) CountdownService._instance = new CountdownService();
    return CountdownService._instance;
  }

  private _timer: Timer | undefined;
  private _notifd = AstalNotifd.get_default();
  private _notifInvokedHandler = new Map<number, number>();
  private _notifResolvedHandler = new Map<number, number>();
  private _dataMonitor: Gio.FileMonitor | null = null;
  private _rescanScheduled = false;

  private constructor() {
    ensureCacheDirs();
    this._bindNotificationActions();
    this._watchCache();
    this.refresh();
  }

  // -----------------------------
  // Public: cache CRUD
  // -----------------------------

  public list(): Countdown[] {
    ensureCacheDirs();
    const out: Countdown[] = [];

    try {
      const dir = Gio.File.new_for_path(DATA_DIR);
      const it = dir.enumerate_children('standard::name', Gio.FileQueryInfoFlags.NONE, null);

      while (true) {
        const info = it.next_file(null);
        if (!info) break;
        const name = info.get_name();
        if (!name) continue;
        if (!name.endsWith('.json')) continue;
        const id = name.slice(0, -'.json'.length);
        const c = this.read(id);
        if (c) out.push(c);
      }
    } catch (e) {
      console.debug('[Countdown] list failed:', e);
    }

    out.sort((a, b) => a.id.localeCompare(b.id));
    return out;
  }

  public read(id: string): Countdown | null {
    ensureCacheDirs();
    const p = dataPath(id);
    if (!fileExists(p)) return null;
    const raw = readFile(p);
    if (!raw?.trim()) return null;
    try {
      return JSON.parse(raw) as Countdown;
    } catch {
      return null;
    }
  }

  public async add(input: Countdown, sourceImagePath?: string): Promise<Countdown> {
    ensureCacheDirs();

    const id = input.id.trim();
    if (!id) throw new Error('Countdown.id is required');

    const created = nowIso();
    const out: Countdown = {
      ...input,
      id,
      createdAt: input.createdAt || created,
      updatedAt: nowIso(),
      occurrenceState: input.occurrenceState ?? {},
      occurrenceOverrides: input.occurrenceOverrides ?? {},
    };

    const src = (sourceImagePath ?? input.imagePath)?.trim();
    if (src) {
      const ext = extFromPath(src);
      const dst = joinPath(IMAGES_DIR, `${id}${ext}`);
      deleteIdImages(id);
      await copyImageStable(dst, src);
      out.imagePath = dst;
    } else {
      out.imagePath = undefined;
    }

    writeFile(dataPath(id), JSON.stringify(out, null, 2));
    this.refresh();
    return out;
  }

  public async edit(id: string, patch: EditCountdownPatch): Promise<Countdown> {
    const cur = this.read(id);
    if (!cur) throw new Error(`Countdown not found: ${id}`);

    const out: Countdown = {
      ...cur,
      ...patch,
      id: cur.id,
      createdAt: cur.createdAt,
      updatedAt: nowIso(),
      occurrenceState: patch.occurrenceState ?? cur.occurrenceState ?? {},
      occurrenceOverrides: patch.occurrenceOverrides ?? cur.occurrenceOverrides ?? {},
    };

    if (patch.imagePath === null) {
      deleteIdImages(id);
      out.imagePath = undefined;
    } else if (typeof patch.imagePath === 'string') {
      const src = patch.imagePath.trim();
      const ext = extFromPath(src);
      const dst = joinPath(IMAGES_DIR, `${id}${ext}`);
      deleteIdImages(id);
      await copyImageStable(dst, src);
      out.imagePath = dst;
    }

    writeFile(dataPath(id), JSON.stringify(out, null, 2));
    this.refresh();
    return out;
  }

  public delete(id: string): void {
    deleteFile(dataPath(id));
    deleteIdImages(id);
    this.refresh();
  }

  public async editOccurrence(id: string, occKey: string, patch: EditOccurrencePatch): Promise<Countdown> {
    const cur = this.read(id);
    if (!cur) throw new Error(`Countdown not found: ${id}`);
    if (cur.schedule.kind !== 'rrule') throw new Error('editOccurrence only applies to RRULE countdowns');

    const { occurrenceOverrides, occurrenceState } = ensureOccMaps(cur);
    const prev = occurrenceOverrides[occKey] ?? {};

    const next: CountdownOccurrenceOverride = {
      ...prev,
      ...patch,
    };

    if (patch.imagePath === null) {
      deleteOccurrenceImages(id, occKey);
      delete next.imagePath;
    } else if (typeof patch.imagePath === 'string') {
      const src = patch.imagePath.trim();
      const dst = occurrenceImagePath(id, occKey, src);
      deleteOccurrenceImages(id, occKey);
      await copyImageStable(dst, src);
      next.imagePath = dst;
    }

    occurrenceOverrides[occKey] = next;

    // If it was soft-deleted, editing brings it back.
    if (occurrenceState[occKey]?.deletedAt) {
      delete occurrenceState[occKey].deletedAt;
    }

    const out: Countdown = {
      ...cur,
      occurrenceOverrides,
      occurrenceState,
      updatedAt: nowIso(),
    };

    writeFile(dataPath(id), JSON.stringify(out, null, 2));
    this.refresh();
    return out;
  }

  public deleteOccurrence(id: string, occKey: string, mode: DeleteOccurrenceMode = 'soft'): void {
    const cur = this.read(id);
    if (!cur) return;
    if (cur.schedule.kind !== 'rrule') return;

    const { occurrenceOverrides, occurrenceState } = ensureOccMaps(cur);

    if (mode === 'soft') {
      occurrenceState[occKey] = { ...(occurrenceState[occKey] ?? {}), deletedAt: nowIso() };
    } else {
      const ex = new Set(cur.schedule.exdate ?? []);
      ex.add(occKey);
      cur.schedule.exdate = Array.from(ex);

      delete occurrenceState[occKey];
      delete occurrenceOverrides[occKey];
      deleteOccurrenceImages(id, occKey);
    }

    const out: Countdown = {
      ...cur,
      occurrenceOverrides,
      occurrenceState,
      updatedAt: nowIso(),
    };

    writeFile(dataPath(id), JSON.stringify(out, null, 2));
    this.refresh();
  }

  public getUiSlides(nowMs: number, pastLimit: number): CountdownUiSlide[] {
    const out: CountdownUiSlide[] = [];

    const all = this.list();
    for (const c of all) {
      const occs = collectVisibleForUi(c, nowMs, Math.max(0, pastLimit));
      for (const occ of occs) {
        const r = resolveOccurrence(c, occ.key);
        out.push({
          countdownId: c.id,
          occKey: occ.key,
          whenMs: occ.whenMs,
          isPast: occ.whenMs <= nowMs,
          title: r.title,
          description: r.description,
          imagePath: r.imagePath,
          actionCommand: r.actionCommand,
        });
      }
    }

    // Upcoming first (closest), then past (most recent)
    out.sort((a, b) => {
      const aPast = a.whenMs <= nowMs;
      const bPast = b.whenMs <= nowMs;
      if (aPast !== bPast) return aPast ? 1 : -1;
      if (!aPast) return a.whenMs - b.whenMs;
      return b.whenMs - a.whenMs;
    });

    return out;
  }

  // -----------------------------
  // Public: scheduler
  // -----------------------------

  public refresh(): void {
    this._timer?.cancel();
    this._timer = undefined;
    this._tick();
  }

  // -----------------------------
  // Internal: cache watching
  // -----------------------------

  private _watchCache(): void {
    try {
      this._dataMonitor?.cancel();
    } catch {
      // ignore
    }
    this._dataMonitor = null;

    try {
      const dir = Gio.File.new_for_path(DATA_DIR);
      this._dataMonitor = dir.monitor_directory(Gio.FileMonitorFlags.NONE, null);
      this._dataMonitor.connect('changed', () => this._scheduleRescan());
    } catch (e) {
      console.debug('[Countdown] monitor_directory(DATA_DIR) failed:', e);
    }
  }

  private _scheduleRescan(): void {
    if (this._rescanScheduled) return;
    this._rescanScheduled = true;
    timeout(80, () => {
      this._rescanScheduled = false;
      this.refresh();
    });
  }

  // -----------------------------
  // Internal: notification engine
  // -----------------------------

  private _tick(): void {
    const all = this.list();
    const nowMs = Date.now();

    const due: Array<{ c: Countdown; occ: Occurrence }> = [];
    let next: { c: Countdown; occ: Occurrence } | undefined;

    for (const c of all) {
      const { due: d, next: n } = collectDueAndNext(c, nowMs);
      for (const occ of d) due.push({ c, occ });
      if (n) {
        if (!next || n.whenMs < next.occ.whenMs) next = { c, occ: n };
      }
    }

    due.sort((a, b) => a.occ.whenMs - b.occ.whenMs);

    const MAX_CATCHUP = 8;
    if (due.length > 0) {
      const slice = due.slice(0, MAX_CATCHUP);
      this._sendBatch(slice);

      // More due? run again quickly.
      this._timer = timeout(250, () => this._tick());
      return;
    }

    if (!next) return;

    const waitMs = Math.max(250, Math.min(24 * 60 * 60 * 1000, next.occ.whenMs - nowMs));
    this._timer = timeout(waitMs, () => this._tick());
  }

  private _sendBatch(items: Array<{ c: Countdown; occ: Occurrence }>): void {
    for (const { c, occ } of items) {
      try {
        this._sendReachedNotification(c, occ.key, occ.whenMs);
        this._markOccurrenceNotified(c.id, occ.key);
      } catch (e) {
        console.error('[Countdown] notify failed:', e);
      }
    }
  }

  private _markOccurrenceNotified(id: string, occKey: string): void {
    const cur = this.read(id);
    if (!cur) return;
    const { occurrenceState } = ensureOccMaps(cur);
    occurrenceState[occKey] = { ...(occurrenceState[occKey] ?? {}), notifiedAt: nowIso() };
    const out: Countdown = {
      ...cur,
      occurrenceState,
      updatedAt: nowIso(),
    };
    writeFile(dataPath(id), JSON.stringify(out, null, 2));
  }

  private _sendReachedNotification(c: Countdown, occKey: string, whenMs: number): void {
    const r = resolveOccurrence(c, occKey);

    const actions: NotificationAction[] = [];
    if (r.actionCommand?.command) {
      actions.push({
        id: `${ACTION_PREFIX}:run:${c.id}:${encodeKey(occKey)}`,
        label: r.actionCommand.label || 'Run',
      });
    }
    actions.push({
      id: `${ACTION_PREFIX}:del:${c.id}:${encodeKey(occKey)}`,
      label: 'Delete',
    });

    const body = r.description?.trim() || '';
    const reachedLine = `Reached: ${new Date(whenMs).toLocaleString()}`;
    const fullBody = body ? `${body}\n\n${reachedLine}` : reachedLine;

    notify({
      appName: 'ALI',
      iconName: icons.ui.time,
      summary: r.title,
      body: fullBody,
      imagePath: r.imagePath,
      category: CATEGORY,
      actions,
      // Keep it around so action clicks still work.
      resident: true,
    });
  }

  private _bindNotificationActions(): void {
    this._notifd.connect('notified', (_d: unknown, id: number) => {
      const n = this._notifd.get_notification(id);
      if (!n) return;
      if ((n.category ?? '') !== CATEGORY) return;

      if (!this._notifInvokedHandler.has(id)) {
        const hid = n.connect('invoked', (_n: unknown, actionId: string) => this._handleAction(String(actionId)));
        this._notifInvokedHandler.set(id, hid);
      }

      if (!this._notifResolvedHandler.has(id)) {
        const hid = n.connect('resolved', () => this._cleanupNotifHandlers(id));
        this._notifResolvedHandler.set(id, hid);
      }
    });
  }

  private _cleanupNotifHandlers(id: number): void {
    try {
      const n = this._notifd.get_notification(id);
      if (!n) return;
      const inv = this._notifInvokedHandler.get(id);
      if (inv) n.disconnect(inv);
      const res = this._notifResolvedHandler.get(id);
      if (res) n.disconnect(res);
    } catch {
      // ignore
    } finally {
      this._notifInvokedHandler.delete(id);
      this._notifResolvedHandler.delete(id);
    }
  }

  private _handleAction(actionId: string): void {
    const parsed = parseActionId(actionId);
    if (parsed.kind === 'unknown') return;

    const c = this.read(parsed.id);
    if (!c) return;

    if (parsed.kind === 'run') {
      const r = resolveOccurrence(c, parsed.key);
      const cmd = r.actionCommand?.command?.trim();
      if (cmd) void SystemUtilities.sh(['bash', '-lc', cmd]);
      return;
    }

    if (parsed.kind === 'delete') {
      if (c.schedule.kind === 'once') {
        this.delete(c.id);
      } else {
        this.deleteOccurrence(c.id, parsed.key, 'soft');
      }
    }
  }
}

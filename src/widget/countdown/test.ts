// src/widget/countdown/tests.ts
//
// Simple smoke test that matches what you asked:
//
// 1) Add a few countdowns
// 2) Check CACHE contents (data + images) + JSON fields
// 3) Edit some of them
// 4) Check CACHE again
// 5) Delete them
// 6) Check CACHE is clean (no leftovers for this test run)
//
// Usage:
//   import { runCountdownCacheSmokeTest } from "src/widget/countdown/tests";
//   runCountdownCacheSmokeTest();
//
// It throws on failure and prints what it’s doing.


/**
 * Support both signatures:
 * - storeCountdownToCache(countdown)
 * - storeCountdownToCache(countdown, sourceImagePath)
 *
 * If only 1 arg is supported, we pass the image as countdown.imagePath.
 */

function expectedJsonPath(id: string) {
  return joinPath(CACHE, "countdown", "data", `${id}.json`);
}

function sha256File(path: string): string {
  const f = Gio.File.new_for_path(path);
  const [, raw] = f.load_contents(null); // Uint8Array
  const c = new GLib.Checksum(GLib.ChecksumType.SHA256);
  c.update(raw); // ✅ one arg in GJS
  return c.get_string() ?? "";
}

function pickTwoDifferentImagesSameExt(ext: ".jpg" | ".png" | ".jpeg"): [string, string] | null {
  const dir = "/home/ali/.config/bg";
  const candidates = [
    "batman.jpg", "wallpaper.jpg", "dark.jpg", "win.jpg",
    "black-hole.png", "image.png", "colors.png",
    "harmony.jpeg",
  ].map((n) => joinPath(dir, n));

  const found = candidates.filter((p) => p.endsWith(ext) && exists(p));
  if (found.length < 2) return null;

  // pick first two distinct paths
  const a = found[0];
  const b = found.find((x) => x !== a);
  return b ? [a, b] : null;
}

function printCacheSnapshot(prefix: string) {
  const dataDir = joinPath(CACHE, "countdown", "data");
  const imagesDir = joinPath(CACHE, "countdown", "images");

  const data = filterByPrefix(listDir(dataDir), prefix);
  const imgs = filterByPrefix(listDir(imagesDir), prefix);

  console.log(`  CACHE snapshot for prefix "${prefix}"`);
  console.log(`   data:   ${data.length ? data.join(", ") : "(none)"}`);
  console.log(`   images: ${imgs.length ? imgs.join(", ") : "(none)"}`);

  return { dataDir, imagesDir, data, imgs };
}

export function runCountdownCacheSmokeTest(): void {
  const prefix = `itest-${Date.now().toString(36)}-${uuid().slice(0, 6)}-`;
  joinPath(CACHE, "countdown", "data");
  const imagesDir = joinPath(CACHE, "countdown", "images");

  console.log("===== COUNTDOWN CACHE SMOKE TEST START =====");
  console.log(`CACHE=${CACHE}`);
  console.log(`prefix=${prefix}`);

  // ---- Pick images from your bg folder
  const jpg = pickImageByExt(".jpg");
  const png = pickImageByExt(".png");

  // ---- Create 4 countdowns
  const id1 = `${prefix}once-img`;
  const id2 = `${prefix}once-noimg`;
  const id3 = `${prefix}series-img`;
  const id4 = `${prefix}series-noimg`;

  const c1 = mkOnce(id1, "Christmas (once+img)");
  const c2 = mkOnce(id2, "No Image Once");
  const c3 = mkSeries(id3, "Rick & Morty — Season 7 Episode {n:02}");
  const c4 = mkSeries(id4, "Another Series {n}");

  // ---- ADD
  console.log("== ADD ==");
  storeWithImageMaybe(c1, jpg);
  storeWithImageMaybe(c2, undefined);
  storeWithImageMaybe(c3, png);
  storeWithImageMaybe(c4, undefined);

  // Check cache after add
  printCacheSnapshot(prefix);

  // JSON existence
  for (const id of [id1, id2, id3, id4]) {
    const jp = expectedJsonPath(id);
    assert(exists(jp), `missing json after add: ${jp}`);
  }

  // Image existence for those with images
  const img1 = expectedImagePath(id1, jpg);
  const img3 = expectedImagePath(id3, png);

  assert(exists(img1), `missing cached image for id1: ${img1}`);
  assert(exists(img3), `missing cached image for id3: ${img3}`);

  // Ensure those without images don't accidentally have one
  const noImg2Prefix = `${id2}`;
  const noImg4Prefix = `${id4}`;
  const imgsNow = listDir(imagesDir);
  assert(!imgsNow.some((n) => n.startsWith(noImg2Prefix)), "id2 should not have an image file");
  assert(!imgsNow.some((n) => n.startsWith(noImg4Prefix)), "id4 should not have an image file");

  // JSON imagePath correctness
  const j1 = readJson<Countdown>(expectedJsonPath(id1));
  const j3 = readJson<Countdown>(expectedJsonPath(id3));
  assert(j1.imagePath === img1, "stored json imagePath for id1 should point to cached image");
  assert(j3.imagePath === img3, "stored json imagePath for id3 should point to cached image");

  console.log("  ✓ add + cache check ok");

  // ---- EDIT
  console.log("== EDIT ==");
  // 1) title-only edit for id1 (image must not change)
  editCountdownInCache(id1, { titleTemplate: "Christmas (edited title)" } as any);
  const j1b = readJson<Countdown>(expectedJsonPath(id1));
  assert(j1b.titleTemplate === "Christmas (edited title)", "id1 title should be edited");
  assert(j1b.imagePath === img1, "id1 imagePath should not change on title-only edit");
  assert(exists(img1), "id1 cached image should still exist after title-only edit");

  // 2) replace image for id1 (jpg -> png) -> old removed, new exists
  editCountdownInCache(id1, { imagePath: png } as any);
  const img1new = expectedImagePath(id1, png);
  const j1c = readJson<Countdown>(expectedJsonPath(id1));
  assert(j1c.imagePath === img1new, "id1 imagePath should point to new cached image");
  assert(exists(img1new), "id1 new cached image should exist");
  if (img1new !== img1) {
    assert(!exists(img1), "id1 old cached image should be removed when ext changes");
  }

  // 3) add image to id2 (previously none)
  editCountdownInCache(id2, { imagePath: jpg } as any);
  const img2 = expectedImagePath(id2, jpg);
  const j2b = readJson<Countdown>(expectedJsonPath(id2));
  assert(j2b.imagePath === img2, "id2 should now have cached image path in json");
  assert(exists(img2), "id2 cached image should exist after adding");

  // 4) remove image from id3
  editCountdownInCache(id3, { imagePath: null } as any);
  const j3b = readJson<Countdown>(expectedJsonPath(id3));
  assert(!j3b.imagePath, "id3 imagePath should be removed after removal");
  assert(!exists(img3), "id3 cached image should be deleted after removal");

  printCacheSnapshot(prefix);
  console.log("  ✓ edit + cache check ok");

  // ---- DELETE
  console.log("== DELETE ==");
  for (const id of [id1, id2, id3, id4]) {
    deleteCountdownInCache(id);
  }

  // Check cache after delete (no leftover json/images with our prefix)
  const sDel = printCacheSnapshot(prefix);

  assert(sDel.data.length === 0, "data dir should have no leftover test jsons");
  assert(sDel.imgs.length === 0, "images dir should have no leftover test images");

  // Also verify individual expected paths are gone
  for (const id of [id1, id2, id3, id4]) {
    assert(!exists(expectedJsonPath(id)), `json should be deleted: ${id}`);
  }

  // id1 ended with png after replace, id2 has jpg, id3 removed, id4 none
  assert(!exists(expectedImagePath(id1, png)), "id1 cached image should be deleted");
  assert(!exists(expectedImagePath(id2, jpg)), "id2 cached image should be deleted");

  console.log("===== COUNTDOWN CACHE SMOKE TEST PASS ✅ =====");
}

// src/widget/countdown/edge-tests.ts
//
// Advanced edge-case tests for countdown cache (add/edit/delete).
//
// Usage:
//   import { runCountdownCacheEdgeTests } from "src/widget/countdown/edge-tests";
//   runCountdownCacheEdgeTests();
//
// It throws on failure and prints progress.
// This file is self-contained (no dependency on your other tests).

import "src/lib/session";

import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";

import {
  storeCountdownToCache,
  editCountdownInCache,
  deleteCountdownInCache,
} from "src/widget/countdown/helper";

import type { Countdown } from "src/widget/countdown/helper";

declare const CACHE: string;

function assert(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT FAIL: ${msg}`);
}

function joinPath(...parts: string[]) {
  return parts.join("/").replace(/\/+/g, "/");
}

function exists(path: string) {
  return GLib.file_test(path, GLib.FileTest.EXISTS);
}

function readJson<T>(path: string): T {
  const f = Gio.File.new_for_path(path);
  const [, raw] = f.load_contents(null);
  const txt = new TextDecoder().decode(raw);
  return JSON.parse(txt) as T;
}

function extFromPath(p: string): string {
  const base = GLib.path_get_basename(p);
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot) : "";
}

function mtime(path: string): number {
  const f = Gio.File.new_for_path(path);
  const info = f.query_info("time::modified", Gio.FileQueryInfoFlags.NONE, null);
  return info.get_attribute_uint64("time::modified") as unknown as number;
}

function listDir(dirPath: string): string[] {
  const dir = Gio.File.new_for_path(dirPath);
  if (!dir.query_exists(null)) return [];
  const e = dir.enumerate_children("standard::name", Gio.FileQueryInfoFlags.NONE, null);
  const out: string[] = [];
  for (; ;) {
    const info = e.next_file(null);
    if (!info) break;
    out.push(info.get_name());
  }
  try { e.close(null); } catch { }
  return out.sort();
}

function filterByPrefix(names: string[], prefix: string) {
  return names.filter((n) => n.startsWith(prefix)).sort();
}

function isoPlusMinutes(m: number) {
  return new Date(Date.now() + m * 60_000).toISOString();
}

function uuid() {
  return (GLib as any).uuid_string_random?.() ?? `${Date.now()}-${Math.random()}`;
}

function pickImageByExt(ext: ".jpg" | ".png" | ".jpeg"): string {
  const dir = "/home/ali/.config/bg";
  const candidates = [
    "batman.jpg",
    "wallpaper.jpg",
    "dark.jpg",
    "win.jpg",
    "black-hole.png",
    "image.png",
    "colors.png",
    "harmony.jpeg",
  ].map((n) => joinPath(dir, n));
  for (const p of candidates) {
    if (p.endsWith(ext) && exists(p)) return p;
  }
  throw new Error(`No ${ext} image found in ${dir} among known candidates.`);
}

function writeBytes(path: string, bytes: Uint8Array) {
  const f = Gio.File.new_for_path(path);
  f.replace_contents(bytes, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
}

function deletePath(path: string) {
  const f = Gio.File.new_for_path(path);
  try { if (f.query_exists(null)) f.delete(null); } catch { }
}

function mkOnce(id: string, titleTemplate: string): Countdown {
  return {
    id,
    groupId: undefined,
    titleTemplate,
    description: "edge test",
    imagePath: undefined,
    tzid: "Europe/Zurich",
    schedule: { kind: "once", at: isoPlusMinutes(60) },
    naming: undefined,
    notifyOnReach: true,
    actionCommand: { label: "Echo", command: "echo once" },
    occurrenceState: {},
    occurrenceOverrides: {},
    createdAt: new Date().toISOString(),
    updatedAt: undefined,
    disabled: false,
  };
}

function mkSeries(id: string, titleTemplate: string): Countdown {
  return {
    id,
    groupId: "grp_edge",
    titleTemplate,
    description: "edge series",
    imagePath: undefined,
    tzid: "Europe/Zurich",
    schedule: {
      kind: "rrule",
      dtstart: "2026-03-01T20:00:00",
      rrule: "FREQ=WEEKLY;INTERVAL=1;COUNT=4",
      exdate: [],
      rdate: [],
    },
    naming: { counterStart: 1, counterStep: 1 },
    notifyOnReach: true,
    actionCommand: { label: "Echo", command: "echo series" },
    occurrenceState: {},
    occurrenceOverrides: {},
    createdAt: new Date().toISOString(),
    updatedAt: undefined,
    disabled: false,
  };
}

// Support both signatures:
// - storeCountdownToCache(countdown)
// - storeCountdownToCache(countdown, sourceImagePath)
function storeWithImageMaybe(cd: Countdown, srcImagePath?: string) {
  const fn: any = storeCountdownToCache as any;
  if (fn.length >= 2) return fn(cd, srcImagePath);
  const withImg = srcImagePath ? { ...cd, imagePath: srcImagePath } : cd;
  return fn(withImg);
}

function jsonPath(id: string) {
  return joinPath(CACHE, "countdown", "data", `${id}.json`);
}
function imagesDir() {
  return joinPath(CACHE, "countdown", "images");
}
function dataDir() {
  return joinPath(CACHE, "countdown", "data");
}
function expectedImagePath(id: string, src: string) {
  return joinPath(imagesDir(), `${id}${extFromPath(src)}`);
}

function snapshot(prefix: string) {
  const data = filterByPrefix(listDir(dataDir()), prefix);
  const imgs = filterByPrefix(listDir(imagesDir()), prefix);
  console.log(`  snapshot("${prefix}") data=${data.length} images=${imgs.length}`);
  return { data, imgs };
}

export function runCountdownCacheEdgeTests(): void {
  const prefix = `edge-${Date.now().toString(36)}-${uuid().slice(0, 6)}-`;
  console.log("===== COUNTDOWN CACHE EDGE TESTS START =====");
  console.log(`CACHE=${CACHE}`);
  console.log(`prefix=${prefix}`);

  const jpg = pickImageByExt(".jpg");
  const png = pickImageByExt(".png");

  // ---------------------------------------------------------------------------
  // 1) Weird title characters (should not affect filenames because filenames use id)
  // ---------------------------------------------------------------------------
  console.log("== 1) weird title chars ==");
  const idWeird = `${prefix}weird-title`;
  const weirdTitle = `Weird: 😈 / \\ : * ? " < > |  {n:02}  —  日本語  —  spaces   `;
  storeWithImageMaybe(mkOnce(idWeird, weirdTitle), jpg);

  assert(exists(jsonPath(idWeird)), "weird-title json must exist");
  const cachedWeird = expectedImagePath(idWeird, jpg);
  assert(exists(cachedWeird), "weird-title cached image must exist");
  const jWeird = readJson<Countdown>(jsonPath(idWeird));
  assert(jWeird.titleTemplate === weirdTitle, "titleTemplate must preserve exact weird string");
  assert(jWeird.imagePath === cachedWeird, "imagePath must point to id-based cached image");
  console.log("  ✓ ok");
  // ---------------------------------------------------------------------------
  // 2) Replace image with SAME extension overwrites (content hash must change)
  // ---------------------------------------------------------------------------
  console.log("== 2) replace image same ext overwrite ==");

  const pairJpg = pickTwoDifferentImagesSameExt(".jpg");
  const pairPng = pairJpg ? null : pickTwoDifferentImagesSameExt(".png");

  const pair = pairJpg ?? pairPng;
  if (!pair) {
    console.log("  (skipped) need two different images with same extension (.jpg or .png)");
  } else {
    const [imgA, imgB] = pair;

    // At this point, idWeird already exists and has an image from step (1).
    // We want to force it to a known same-extension baseline (imgA),
    // then overwrite with imgB and ensure the cached file's CONTENT changes.

    // Force baseline to imgA (same ext)
    editCountdownInCache(idWeird, { imagePath: imgA } as any);
    const cachedPathA = expectedImagePath(idWeird, imgA);
    assert(exists(cachedPathA), "cached baseline image must exist");

    const h1 = sha256File(cachedPathA);

    // Overwrite with imgB (same ext => same cached path)
    editCountdownInCache(idWeird, { imagePath: imgB } as any);
    const cachedPathB = expectedImagePath(idWeird, imgB);

    // Must be the same filename because ext is same
    assert(cachedPathB === cachedPathA, "cached path should be identical when ext is same");

    const h2 = sha256File(cachedPathB);

    // If these hashes match, either the two files are identical (rare) or overwrite didn't happen.
    // We verify source hashes are different to make the test meaningful.
    const s1 = sha256File(imgA);
    const s2 = sha256File(imgB);

    assert(s1 !== s2, "test images unexpectedly identical; pick different files");
    assert(h1 !== h2, "cached content hash should change when overwriting with different same-ext image");

    console.log("  ✓ ok");
  }

  // ---------------------------------------------------------------------------
  // 3) Replace series image with EXTENSIONLESS source => cached becomes `${id}` and old `${id}.ext` removed
  // ---------------------------------------------------------------------------
  console.log("== 3) extensionless source replace ==");
  const tmpNoExt = joinPath(GLib.get_tmp_dir(), `${prefix}noext-src`);
  {
    const srcFile = Gio.File.new_for_path(png);
    const [, raw] = srcFile.load_contents(null);
    writeBytes(tmpNoExt, raw);
  }
  assert(exists(tmpNoExt), "temp no-ext source must exist");

  // replace image with no-ext source
  editCountdownInCache(idWeird, { imagePath: tmpNoExt } as any);

  const cachedNoExt = joinPath(imagesDir(), `${idWeird}`); // no extension
  assert(exists(cachedNoExt), "cached image without extension must exist");
  assert(!exists(cachedWeird), "old cached image with extension should be removed when ext changes");
  {
    const j = readJson<Countdown>(jsonPath(idWeird));
    assert(j.imagePath === cachedNoExt, "json imagePath should now point to no-ext cached image");
  }

  deletePath(tmpNoExt);
  console.log("  ✓ ok");

  // ---------------------------------------------------------------------------
  // 4) Switch schedule kind: once -> rrule -> once (should persist)
  // ---------------------------------------------------------------------------
  console.log("== 4) schedule kind switch ==");
  editCountdownInCache(idWeird, {
    schedule: {
      kind: "rrule",
      dtstart: "2026-03-01T20:00:00",
      rrule: "FREQ=WEEKLY;INTERVAL=2;COUNT=3",
      exdate: [],
      rdate: [],
    },
  } as any);

  {
    const j = readJson<Countdown>(jsonPath(idWeird));
    assert(j.schedule.kind === "rrule", "schedule must become rrule");
    assert((j.schedule as any).rrule.includes("INTERVAL=2"), "rrule must persist");
  }

  editCountdownInCache(idWeird, { schedule: { kind: "once", at: isoPlusMinutes(120) } } as any);

  {
    const j = readJson<Countdown>(jsonPath(idWeird));
    assert(j.schedule.kind === "once", "schedule must become once again");
  }
  console.log("  ✓ ok");

  // ---------------------------------------------------------------------------
  // 5) Remove image when already missing should not create files or crash
  // ---------------------------------------------------------------------------
  console.log("== 5) remove image when missing ==");
  const idNoImg = `${prefix}noimg-remove`;
  storeWithImageMaybe(mkOnce(idNoImg, "No image countdown"), undefined);
  assert(exists(jsonPath(idNoImg)), "noimg json must exist");
  // remove image even though it has none
  editCountdownInCache(idNoImg, { imagePath: null } as any);
  {
    const j = readJson<Countdown>(jsonPath(idNoImg));
    assert(!j.imagePath, "imagePath should remain undefined after remove");
  }
  assert(
    !filterByPrefix(listDir(imagesDir()), idNoImg).length,
    "noimg should not produce any image file",
  );
  console.log("  ✓ ok");

  // ---------------------------------------------------------------------------
  // 6) Self-copy path: set imagePath to already cached path (src === dst) must not crash and must keep file
  // ---------------------------------------------------------------------------
  console.log("== 6) self-copy cached path ==");
  // give idNoImg an image first
  editCountdownInCache(idNoImg, { imagePath: jpg } as any);
  const cachedNoImg = expectedImagePath(idNoImg, jpg);
  assert(exists(cachedNoImg), "cached image must exist after adding");
  // now set imagePath = cached path itself
  editCountdownInCache(idNoImg, { imagePath: cachedNoImg } as any);
  assert(exists(cachedNoImg), "cached image must still exist after self-copy edit");
  {
    const j = readJson<Countdown>(jsonPath(idNoImg));
    assert(j.imagePath === cachedNoImg, "json imagePath must remain the cached path");
  }
  console.log("  ✓ ok");

  // ---------------------------------------------------------------------------
  // 7) Non-existent edit/delete should throw (confirm it actually errors)
  // ---------------------------------------------------------------------------
  console.log("== 7) non-existent id should throw ==");
  const missingId = `${prefix}missing-${uuid().slice(0, 6)}`;
  let editThrew = false;
  try {
    editCountdownInCache(missingId, { titleTemplate: "nope" } as any);
  } catch {
    editThrew = true;
  }
  assert(editThrew, "editing a missing countdown should throw");

  let deleteThrew = false;
  try {
    deleteCountdownInCache(missingId);
  } catch {
    deleteThrew = true;
  }
  assert(deleteThrew, "deleting a missing countdown should throw (current behavior)");

  console.log("  ✓ ok");

  // ---------------------------------------------------------------------------
  // 8) Multi-add/multi-delete integrity: add a series + once, ensure cache has expected, then delete all
  // ---------------------------------------------------------------------------
  console.log("== 8) multi add/delete integrity ==");
  const idSeries = `${prefix}series`;
  storeWithImageMaybe(mkSeries(idSeries, "Series {n}"), png);

  snapshot(prefix);
  assert(exists(jsonPath(idSeries)), "series json must exist");
  assert(exists(expectedImagePath(idSeries, png)), "series cached image must exist");

  // Cleanup: delete everything from this run
  console.log("== CLEANUP ==");
  for (const id of [idWeird, idNoImg, idSeries]) {
    if (exists(jsonPath(id))) deleteCountdownInCache(id);
  }

  const after = snapshot(prefix);
  assert(after.data.length === 0, "no leftover JSON files after cleanup");
  assert(after.imgs.length === 0, "no leftover image files after cleanup");

  console.log("===== COUNTDOWN CACHE EDGE TESTS PASS ✅ =====");
}
runCountdownCacheEdgeTests()

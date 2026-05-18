import GLib from "gi://GLib"
import Gio from "gi://Gio"
import { exec } from "ags/process"
import { iconExists } from "src/lib/icons/helpers"
import type { DesktopEntry } from "../types"

// ─── Constants ────────────────────────────────────────────────────────────────

const DESKTOP_DIRS = [
  "/usr/share/applications",
  "/usr/local/share/applications",
  GLib.build_filenamev([GLib.get_home_dir(), ".local", "share", "applications"]),
  "/var/lib/snapd/desktop/applications",
]

const APPIMAGE_DIR = GLib.build_filenamev([GLib.get_home_dir(), "Applications"])

// ─── Module-level state ───────────────────────────────────────────────────────
// This module is imported once and acts as a singleton — no class needed.

let entries: DesktopEntry[] = []
const appImageCache = new Map<string, DesktopEntry>()

const hasFlatpak = ((): boolean => {
  try { return exec("command -v flatpak").trim().length > 0 } catch { return false }
})()

// ─── Desktop file parsing ─────────────────────────────────────────────────────

function parseDesktopFile(filePath: string): DesktopEntry | null {
  try {
    const kf = new GLib.KeyFile()
    kf.load_from_file(filePath, GLib.KeyFileFlags.NONE)
    if (!kf.has_group("Desktop Entry")) return null

    try { if (kf.get_boolean("Desktop Entry", "Hidden")) return null } catch { /* not set */ }
    try { if (kf.get_boolean("Desktop Entry", "NoDisplay")) return null } catch { /* not set */ }

    const name = kf.get_locale_string("Desktop Entry", "Name", null)
    const execStr = kf.get_string("Desktop Entry", "Exec")
    if (!name || !execStr) return null

    const getStr    = (key: string): string => { try { return kf.get_string("Desktop Entry", key) } catch { return "" } }
    const getLocale = (key: string): string => { try { return kf.get_locale_string("Desktop Entry", key, null) } catch { return "" } }
    const getList   = (key: string): string[] => getStr(key).split(";").filter(Boolean)

    return {
      name,
      exec: execStr,
      icon: getStr("Icon"),
      description: getLocale("Comment") || getLocale("GenericName") || undefined,
      categories: getList("Categories"),
      keywords: getLocale("Keywords").split(";").filter(Boolean),
      path: filePath,
    }
  } catch {
    return null
  }
}

// ─── Desktop file scanning ────────────────────────────────────────────────────

function scanDesktopFiles(): DesktopEntry[] {
  const dirs = [...DESKTOP_DIRS]
  if (hasFlatpak) {
    dirs.push(
      "/var/lib/flatpak/exports/share/applications",
      GLib.build_filenamev([GLib.get_home_dir(), ".local", "share", "flatpak", "exports", "share", "applications"]),
    )
  }

  const results: DesktopEntry[] = []
  const seen = new Set<string>()

  for (const dirPath of dirs) {
    try {
      const dir = Gio.File.new_for_path(dirPath)
      if (!dir.query_exists(null)) continue

      const enumerator = dir.enumerate_children(
        "standard::name,standard::type",
        Gio.FileQueryInfoFlags.NONE,
        null,
      )

      let info: Gio.FileInfo | null
      while ((info = enumerator.next_file(null)) !== null) {
        const name = info.get_name()
        if (!name || !name.endsWith(".desktop") || seen.has(name)) continue
        seen.add(name)

        const entry = parseDesktopFile(GLib.build_filenamev([dirPath, name]))
        if (entry) results.push(entry)
      }
    } catch {
      // Directory not accessible — skip silently
    }
  }

  return results
}

// ─── AppImage scanning ────────────────────────────────────────────────────────

function scanAppImages(): DesktopEntry[] {
  const results: DesktopEntry[] = []
  try {
    const dir = Gio.File.new_for_path(APPIMAGE_DIR)
    if (!dir.query_exists(null)) return results

    const enumerator = dir.enumerate_children(
      "standard::name,standard::type,access::can-execute",
      Gio.FileQueryInfoFlags.NONE,
      null,
    )

    let info: Gio.FileInfo | null
    while ((info = enumerator.next_file(null)) !== null) {
      const name = info.get_name()
      if (!name || !name.toLowerCase().endsWith(".appimage")) continue
      if (!info.get_attribute_boolean("access::can-execute")) continue

      const filePath = GLib.build_filenamev([APPIMAGE_DIR, name])

      const cached = appImageCache.get(filePath)
      if (cached) { results.push(cached); continue }

      const baseName = name.slice(0, -9)
      const cleanName = baseName
        .replace(/[-_]/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (l: string) => l.toUpperCase())

      const iconCandidates = [
        baseName.toLowerCase(),
        baseName.toLowerCase().replace(/[-_]/g, ""),
        baseName.split(/[-_]/)[0].toLowerCase(),
      ]
      const icon = iconCandidates.find((n) => iconExists(n)) ?? "application-x-executable"

      const entry: DesktopEntry = {
        name: cleanName,
        exec: filePath,
        icon,
        description: `AppImage: ${baseName}`,
        categories: ["AppImage"],
        keywords: [baseName.toLowerCase(), "appimage"],
        path: filePath,
        isAppImage: true,
      }

      appImageCache.set(filePath, entry)
      results.push(entry)
    }
  } catch {
    // Directory not accessible — skip silently
  }

  return results
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreEntry(entry: DesktopEntry, q: string): number {
  if (!q) return 0
  const name = entry.name.toLowerCase()
  const bin  = entry.exec.split("/").pop()?.toLowerCase() ?? ""

  if (name === q)                                                        return 100
  if (name.startsWith(q))                                                return 80
  if (name.includes(q))                                                  return 60
  if (entry.keywords?.some((k: string) => k.toLowerCase().includes(q))) return 40
  if (bin.includes(q))                                                   return 30
  if (entry.description?.toLowerCase().includes(q))                     return 20
  return 0
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function scan(): void {
  entries = [...scanDesktopFiles(), ...scanAppImages()].sort((a, b) =>
    a.name.localeCompare(b.name),
  )
}

export function fuzzySearch(query: string): DesktopEntry[] {
  const q = query.toLowerCase()
  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.entry)
}

// Run initial scan at import time
scan()

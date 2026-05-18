import { execAsync } from "ags/process"
import GLib from "gi://GLib"
import { fileExists } from "src/lib/session"
import type { DirectoryResult as DirectoryResultType } from "../types"

export type DirectoryResult = DirectoryResultType

// ─── Fuzzy scoring ────────────────────────────────────────────────────────────

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (t === q) return 1000
  if (t.startsWith(q)) return 900
  if (t.includes(q)) return 800

  let score = 0
  let qi = 0
  let prevMatch = -1
  let streak = 0

  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += 10
      if (prevMatch === i - 1) { streak++; score += streak * 5 } else { streak = 1 }
      if (i === 0 || !/\w/.test(t[i - 1])) score += 15
      prevMatch = i
      qi++
    }
  }

  if (qi < q.length) return 0
  return Math.max(0, score - (t.length - q.length) * 0.5)
}

// ─── Command helpers ──────────────────────────────────────────────────────────

async function commandExists(cmd: string): Promise<boolean> {
  try { await execAsync(["which", cmd]); return true } catch { return false }
}

async function execWithTimeout(cmd: string[], ms = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    let done = false
    const timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
      if (!done) { done = true; reject(new Error(`Timed out after ${ms}ms`)) }
      return GLib.SOURCE_REMOVE
    })
    execAsync(cmd)
      .then((r) => { if (!done) { done = true; GLib.Source.remove(timer); resolve(r) } })
      .catch((e) => { if (!done) { done = true; GLib.Source.remove(timer); reject(e) } })
  })
}

// ─── Search backends ──────────────────────────────────────────────────────────

async function searchWithFd(query: string, paths: string[], maxDepth: number): Promise<DirectoryResult[]> {
  const pattern = query.split("").join(".*")
  const cmd = [
    "fd", "--regex", pattern,
    "--type", "f", "--type", "d",
    "--max-depth", maxDepth.toString(),
    "--exclude", ".git", "--exclude", "node_modules",
    ...paths,
  ]

  const output = await execWithTimeout(cmd, 3000)
  const lines = output.trim().split("\n").filter(Boolean).slice(0, 200)

  return lines.map((filePath) => {
    const name = filePath.split("/").pop() ?? ""
    return { path: filePath, name, isDirectory: !name.includes("."), score: 0 }
  })
}

async function searchWithFind(query: string, paths: string[], maxDepth: number): Promise<DirectoryResult[]> {
  const results: DirectoryResult[] = []

  for (const searchPath of paths) {
    try {
      const output = await execWithTimeout(
        ["find", searchPath, "-maxdepth", maxDepth.toString()],
        2000,
      )
      const lines = output.trim().split("\n").filter((l) => l && l !== searchPath).slice(0, 100)

      for (const filePath of lines) {
        const name = filePath.split("/").pop() ?? ""
        if (name.startsWith(".")) continue
        results.push({ path: filePath, name, isDirectory: !name.includes("."), score: 0 })
        if (results.length >= 50) break
      }
    } catch {}
    if (results.length >= 50) break
  }

  return results
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default async function getDirectoryResults(query: string): Promise<DirectoryResult[]> {
  if (!query) return []

  const home = GLib.get_home_dir()
  const hasFd = await commandExists("fd")

  const searchPaths = (
    hasFd
      ? [home, `${home}/Documents`, `${home}/Downloads`, `${home}/Pictures`, `${home}/Videos`, `${home}/Music`, `${home}/Desktop`, `${home}/Projects`, `${home}/.config`]
      : [`${home}/Documents`, `${home}/Downloads`, `${home}/.config/ags`]
  ).filter(fileExists)

  if (!searchPaths.length) return []

  const maxDepth = hasFd ? 4 : 2

  try {
    const raw = hasFd
      ? await searchWithFd(query, searchPaths, maxDepth)
      : await searchWithFind(query, searchPaths, maxDepth)

    return raw
      .map((r) => ({
        ...r,
        score: Math.max(fuzzyScore(query, r.name), fuzzyScore(query, r.path) * 0.7),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      .slice(0, 20)
  } catch {
    return []
  }
}

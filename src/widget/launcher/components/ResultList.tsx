import { Gtk } from "ags/gtk4"
import { createState, createEffect, onCleanup, type Accessor } from "gnim"
import { For } from "ags"
import { timeout } from "ags/time"
import options from "src/configuration"
import type AstalApps from "gi://AstalApps?version=0.1"
import { search, type SearchResult } from "../providers"
import type { SearchMode } from "../providers/prefixes"
import { ResultRow } from "./ResultRow"

export function ResultList({
  list,
  query,
  activeMode,
  hideWindow,
}: {
  list: Accessor<AstalApps.Application[]>
  query: Accessor<string>
  activeMode: Accessor<SearchMode>
  hideWindow: () => void
}) {
  const spacing = options.launcher.list.spacing.get()
  const [results, setResults] = createState<SearchResult[]>([])
  const [loading, setLoading] = createState(false)

  let debounce: ReturnType<typeof timeout> | null = null

  const runSearch = (mode: SearchMode, q: string) => {
    debounce?.cancel?.()

    debounce = timeout(80, async () => {
      if (mode === "app") {
        // App results come from the already-reactive `list` accessor
        setResults(list.peek().map((app) => ({ kind: "app" as const, data: { app } })))
        return
      }

      setLoading(true)
      try {
        setResults(await search(mode, q, true))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    })
  }

  // Re-run whenever mode, query, or (for app mode) the fuzzy list changes
  createEffect(() => {
    const mode = activeMode()
    const q    = query()
    void list() // track for app mode reactivity
    runSearch(mode, q)
  })

  onCleanup(() => debounce?.cancel?.())

  return (
    <box class="launcher-list" spacing={spacing} vexpand orientation={Gtk.Orientation.VERTICAL}>
      <box visible={loading.as((l) => l)}>
        <label class="description" label="Searching…" cssClasses={["launcher-loading"]} />
      </box>

      <box visible={results.as((rs) => rs.length === 0 && !loading.peek())}>
        <label class="description" label="No results" cssClasses={["launcher-empty"]} />
      </box>

      <For each={results}>
        {(result: SearchResult) => (
          <ResultRow result={result} query={query} hideWindow={hideWindow} />
        )}
      </For>
    </box>
  )
}

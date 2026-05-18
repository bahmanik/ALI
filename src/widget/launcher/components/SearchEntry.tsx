import app from "ags/gtk4/app"
import { Gtk } from "ags/gtk4"
import { onCleanup, type Accessor } from "gnim"
import options from "src/configuration"
import type AstalApps from "gi://AstalApps?version=0.1"
import { numMin } from "../helpers"
import { PREFIXES, getPrefixByChar, type PrefixEntry, type SearchMode } from "../providers/prefixes"

export function SearchEntry({
  apps,
  list,
  setQuery,
  hideWindow,
  activeMode,
  setMode,
}: {
  apps: AstalApps.Apps
  list: Accessor<AstalApps.Application[]>
  setQuery: (s: string) => void
  hideWindow: () => void
  activeMode: Accessor<SearchMode>
  setMode: (m: SearchMode) => void
}) {
  let entryRef: Gtk.Entry | null = null
  let appConnection = 0

  onCleanup(() => { if (appConnection) app.disconnect(appConnection) })

  // Launch the top result on Enter
  const onEnter = () => {
    const top = list.peek()?.[0]
    if (top) top.launch()
    hideWindow()
  }

  // Parse the prefix from the raw input and route accordingly
  const handleTextChange = (raw: string) => {
    if (raw.length >= 2 && raw[1] === " ") {
      const found = getPrefixByChar(raw[0])
      if (found) {
        setMode(found.mode)
        setQuery(raw.slice(2))
        return
      }
    }

    // Reset to app mode if the active prefix has been deleted
    if (activeMode.peek() !== "app") {
      const current = PREFIXES.find((p) => p.mode === activeMode.peek())
      if (current?.prefix && !raw.startsWith(current.prefix + " ")) {
        setMode("app")
      }
    }

    setQuery(raw)
  }

  const prefixPicker = (
    <menubutton cssClasses={["launcher-prefix-btn"]} tooltipText="Select search mode">
      <image
        iconName={activeMode.as((m) => PREFIXES.find((p) => p.mode === m)?.icon ?? "application-x-executable-symbolic")}
        pixelSize={18}
      />
      <popover>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={2} cssClasses={["launcher-prefix-popover"]}>
          {PREFIXES.map((entry: PrefixEntry) => (
            <button
              cssClasses={["launcher-prefix-item"]}
              onClicked={() => {
                setMode(entry.mode)
                if (entryRef) {
                  const stripped = entryRef.get_text().replace(/^.\s/, "")
                  const newText  = entry.prefix ? `${entry.prefix} ${stripped}` : stripped
                  entryRef.set_text(newText)
                  entryRef.set_position(-1)
                  entryRef.grab_focus()
                }
              }}
            >
              <box spacing={8} cssClasses={["launcher-prefix-item-inner"]}>
                <image iconName={entry.icon} pixelSize={16} />
                <box orientation={Gtk.Orientation.VERTICAL}>
                  <label label={entry.label}       cssClasses={["launcher-prefix-label"]} xalign={0} />
                  <label label={entry.description} cssClasses={["launcher-prefix-desc"]}  xalign={0} />
                </box>
                {entry.prefix ? (
                  <label label={`${entry.prefix} ·`} cssClasses={["launcher-prefix-key"]} marginStart={4} />
                ) : (
                  <box />
                )}
              </box>
            </button>
          ))}
        </box>
      </popover>
    </menubutton>
  )

  const input = (
    <entry
      hexpand
      heightRequest={numMin(0, options.launcher.entry.height.get(), 44)}
      cssClasses={["launcher-entry"]}
      placeholderText={activeMode.as((m) => {
        const p = PREFIXES.find((e) => e.mode === m)
        return p ? `${p.label}…` : "Search…"
      })}
      onActivate={onEnter}
      onNotifyText={(self) => handleTextChange(self.text)}
      $={(self) => {
        entryRef = self
        appConnection = app.connect("window-toggled", async (_, win) => {
          if (win.name === "applauncher" && win.visible) {
            await apps.reload()
            setQuery("")
            setMode("app")
            self.set_text("")
            self.grab_focus()
          }
        })
      }}
    />
  )

  return (
    <box cssClasses={["launcher-entry-row"]} spacing={6} orientation={Gtk.Orientation.HORIZONTAL}>
      {prefixPicker}
      {input}
    </box>
  )
}

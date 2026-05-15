import { Gdk, Gtk } from "ags/gtk4"
import { createState, onCleanup, With } from "gnim"
import icons from "src/lib/icons/icons"
import type { StringInputterProps } from "../types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type KeybindInputterProps = StringInputterProps

// ─── Modifier mapping ─────────────────────────────────────────────────────────
//
// Hyprland uses its own modifier names in bind = <mods>, <key>, <dispatcher>, <arg>
// We map Gdk.ModifierType bits → the exact strings Hyprland expects.

const MOD_MAP: { mask: Gdk.ModifierType; name: string }[] = [
  { mask: Gdk.ModifierType.SUPER_MASK, name: "SUPER" },
  { mask: Gdk.ModifierType.CONTROL_MASK, name: "CTRL" },
  { mask: Gdk.ModifierType.SHIFT_MASK, name: "SHIFT" },
  { mask: Gdk.ModifierType.ALT_MASK, name: "ALT" },
  { mask: Gdk.ModifierType.META_MASK, name: "META" },
]

// Keys that are modifiers themselves — we don't record these as the key,
// we only record them as part of the modifier prefix.
const MODIFIER_KEYVALS = new Set([
  "Shift_L", "Shift_R",
  "Control_L", "Control_R",
  "Alt_L", "Alt_R", "Meta_L", "Meta_R",
  "Super_L", "Super_R",
  "Hyper_L", "Hyper_R",
  "ISO_Level3_Shift",   // AltGr
  "Caps_Lock", "Num_Lock", "Scroll_Lock",
])

// ─── Formatting ───────────────────────────────────────────────────────────────

function formatKeybind(keyval: number, modifiers: Gdk.ModifierType): string {
  const keyName = Gdk.keyval_name(keyval) ?? "unknown"

  // Collect active modifier names in a stable order
  const mods = MOD_MAP
    .filter(({ mask }) => (modifiers & mask) !== 0)
    .map(({ name }) => name)

  if (mods.length === 0) return keyName
  return `${mods.join(" ")}, ${keyName}`
}

// ─── Component ────────────────────────────────────────────────────────────────

function KeybindInputter({ opt }: KeybindInputterProps): JSX.Element {
  const [recording, setRecording] = createState(false)
  const [currentVal, setCurrentVal] = createState(opt.get())

  // Keep local display in sync when opt changes externally (e.g. reset)
  const unsub = opt.subscribe(() => setCurrentVal(opt.get()))
  onCleanup(() => unsub())

  return (
    <box class="keybind-inputter" spacing={4}>

      {/* Display pill — shows current value or "recording" state */}
      <button
        class={recording.as((r) => `keybind-display${r ? " recording" : ""}`)}
        tooltipText="Click to record a new keybind"
        onClicked={() => setRecording(true)}
        hexpand
      >
        <With value={recording}>
          {(r) =>
            r
              ? <label label="Press a key combination…" />
              : <label label={currentVal} />
          }
        </With>
      </button>

      {/* Invisible focus target that captures key events while recording */}
      <With value={recording}>
        {(r) =>
          r
            ? <box
              class="keybind-capture-target"
              $={(self) => {
                // Focus the box immediately so it receives key events
                self.grab_focus()

                const controller = new Gtk.EventControllerKey()

                controller.connect("key-pressed", (
                  _ctrl: Gtk.EventControllerKey,
                  keyval: number,
                  _keycode: number,
                  modifiers: Gdk.ModifierType,
                ): boolean => {
                  const keyName = Gdk.keyval_name(keyval)

                  // Ignore bare modifier keypresses — wait for a real key
                  if (keyName && MODIFIER_KEYVALS.has(keyName)) return true

                  // Escape cancels recording without saving
                  if (keyval === Gdk.KEY_Escape) {
                    setRecording(false)
                    return true
                  }

                  // Strip irrelevant lock-key modifiers from the recorded combo
                  const cleanMods = modifiers &
                    ~Gdk.ModifierType.LOCK_MASK &    // Caps Lock
                    ~(1 << 4)                         // Num Lock (MOD2)

                  const keybind = formatKeybind(keyval, cleanMods)
                  opt.set(keybind)
                  setCurrentVal(keybind)
                  setRecording(false)

                  return true  // consume the event
                })

                self.add_controller(controller)
              }}
            />
            : null
        }
      </With>

      {/* Clear button */}
      <button
        class="keybind-clear-button"
        tooltipText="Clear keybind"
        onClicked={() => {
          opt.set("")
          setCurrentVal("")
          setRecording(false)
        }}
      >
        <image iconName={icons.ui.close} />
      </button>

    </box>
  )
}

export default KeybindInputter

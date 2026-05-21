import { Gtk } from "ags/gtk4"
import { For, With } from "ags"
import { createState } from "gnim"
import { barModules } from "src/widget/bar/modules"
import type { BarModule } from "src/widget/bar/modules"
import type { BarSlotLayout } from "src/configuration/widgets/bar/type"

type Slot = "start" | "center" | "end"

type Selection = { module: BarModule; fromSlot: Slot; fromIdx: number } | null

// ─── helpers ──────────────────────────────────────────────────────────────────

function without(arr: BarModule[], idx: number): BarModule[] {
  return arr.filter((_, i) => i !== idx)
}

function inserted(arr: BarModule[], idx: number, mod: BarModule): BarModule[] {
  const next = [...arr]
  next.splice(idx, 0, mod)
  return next
}

function slotLabel(s: Slot) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── BarPreview ───────────────────────────────────────────────────────────────

function BarPreview({ layout }: { layout: BarSlotLayout }) {
  return (
    <box class="bar-preview" hexpand>
      <box class="bar-preview-slot" spacing={4} hexpand halign={Gtk.Align.START}>
        {layout.start.map((m) => (
          <box class="bar-preview-chip" valign={Gtk.Align.CENTER}>
            <label label={m} />
          </box>
        ))}
      </box>
      <box class="bar-preview-slot bar-preview-center" spacing={4} hexpand halign={Gtk.Align.CENTER}>
        {layout.center.map((m) => (
          <box class="bar-preview-chip accent" valign={Gtk.Align.CENTER}>
            <label label={m} />
          </box>
        ))}
      </box>
      <box class="bar-preview-slot" spacing={4} hexpand halign={Gtk.Align.END}>
        {layout.end.map((m) => (
          <box class="bar-preview-chip" valign={Gtk.Align.CENTER}>
            <label label={m} />
          </box>
        ))}
      </box>
    </box>
  )
}

// ─── SlotEditor ───────────────────────────────────────────────────────────────

function SlotEditor({
  slot,
  modules,
  hasSel,
  isSelSource,
  onPickUp,
  onDropAt,
}: {
  slot: Slot
  modules: BarModule[]
  /** Whether anything is currently selected */
  hasSel: ReturnType<typeof createState<boolean>>[0]
  /** Whether the selection originated from this slot */
  isSelSource: (idx: number) => boolean
  onPickUp: (mod: BarModule, idx: number) => void
  onDropAt: (slot: Slot, idx: number) => void
}) {
  return (
    <box class={`bar-slot-zone bar-slot-${slot}`} orientation={Gtk.Orientation.VERTICAL} spacing={2}>
      <label class="bar-slot-label" label={slotLabel(slot)} xalign={0} />
      <box class="bar-slot-chips" orientation={Gtk.Orientation.VERTICAL} spacing={2}>
        {modules.map((mod, idx) => (
          <button
            class={isSelSource(idx) ? "bar-module-chip picked" : "bar-module-chip"}
            onClicked={() => {
              if (hasSel.peek()) {
                onDropAt(slot, idx)
              } else {
                onPickUp(mod, idx)
              }
            }}
          >
            <box spacing={4}>
              <label label={mod} hexpand halign={Gtk.Align.START} />
              <label
                label={isSelSource(idx) ? "✕" : "↕"}
                class="bar-chip-action"
              />
            </box>
          </button>
        ))}
        <With value={hasSel}>
          {(sel) => sel && (
            <button class="bar-slot-drop-target" onClicked={() => onDropAt(slot, modules.length)}>
              <label label={`＋ ${slotLabel(slot)}`} halign={Gtk.Align.CENTER} />
            </button>
          )}
        </With>
      </box>
    </box>
  )
}

// ─── ModulePool ───────────────────────────────────────────────────────────────

function ModulePool({
  layout,
  hasSel,
  onAdd,
  onCancel,
}: {
  layout: BarSlotLayout
  hasSel: ReturnType<typeof createState<boolean>>[0]
  onAdd: (mod: BarModule) => void
  onCancel: () => void
}) {
  const inLayout = (mod: string) =>
    layout.start.includes(mod as BarModule) ||
    layout.center.includes(mod as BarModule) ||
    layout.end.includes(mod as BarModule)

  return (
    <box class="bar-module-pool" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
      <box spacing={6}>
        <label class="bar-slot-label" label="All modules" xalign={0} hexpand />
        <With value={hasSel}>
          {(sel) => sel && (
            <button class="bar-cancel-btn" onClicked={onCancel}>
              <label label="Cancel" />
            </button>
          )}
        </With>
      </box>
      <box spacing={4}>
        {barModules.map((mod) => {
          const used = inLayout(mod)
          return (
            <button
              class={used ? "bar-pool-chip used" : "bar-pool-chip"}
              sensitive={!used}
              onClicked={() => onAdd(mod as BarModule)}
            >
              <label label={mod} />
            </button>
          )
        })}
      </box>
    </box>
  )
}

// ─── LayoutEditor (public) ────────────────────────────────────────────────────

export function LayoutEditor({
  label,
  layout,
  onChange,
}: {
  label: string
  layout: BarSlotLayout
  onChange: (l: BarSlotLayout) => void
}) {
  const [selection, setSelection] = createState<Selection>(null)
  const [hasSel, setHasSel] = createState(false)

  const setSelFull = (s: Selection) => {
    setSelection(s)
    setHasSel(s !== null)
  }

  const cancel = () => setSelFull(null)

  const handlePickUp = (mod: BarModule, fromSlot: Slot, fromIdx: number) => {
    const cur = selection.peek()
    // clicking the already-selected chip cancels
    if (cur?.fromSlot === fromSlot && cur?.fromIdx === fromIdx) {
      setSelFull(null)
    } else {
      setSelFull({ module: mod, fromSlot, fromIdx })
    }
  }

  const handleDropAt = (toSlot: Slot, toIdx: number) => {
    const sel = selection.peek()
    if (!sel) return

    const isSameSlot = sel.fromSlot === toSlot
    const adjustedIdx = isSameSlot && sel.fromIdx < toIdx ? toIdx - 1 : toIdx

    let next = { ...layout, [sel.fromSlot]: without(layout[sel.fromSlot], sel.fromIdx) }
    next = { ...next, [toSlot]: inserted(next[toSlot], adjustedIdx, sel.module) }

    onChange(next)
    setSelFull(null)
  }

  const handleAdd = (mod: BarModule) => {
    onChange({ ...layout, end: [...layout.end, mod] })
  }

  const slots: Slot[] = ["start", "center", "end"]

  return (
    <box class="bar-layout-editor" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
      <label class="bar-layout-editor-label" label={label} xalign={0} />

      <BarPreview layout={layout} />

      <box spacing={6} homogeneous>
        {slots.map((slot) => (
          <SlotEditor
            slot={slot}
            modules={layout[slot]}
            hasSel={hasSel}
            isSelSource={(idx) => {
              const s = selection.peek()
              return s?.fromSlot === slot && s?.fromIdx === idx
            }}
            onPickUp={(mod, idx) => handlePickUp(mod, slot, idx)}
            onDropAt={handleDropAt}
          />
        ))}
      </box>

      <ModulePool
        layout={layout}
        hasSel={hasSel}
        onAdd={handleAdd}
        onCancel={cancel}
      />
    </box>
  )
}

import { Gtk } from "ags/gtk4"
import { With } from "ags"
import { createState } from "gnim"
import { barTriggerMap, barMenuMap, type BarTriggerKey, type BarMenuKey } from "src/widget/bar/triggers"
import type { BarSlotLayout, BarNode, BarTriggerNode, MenuNode, NodeId } from "src/configuration/widgets/bar/type"

type Slot = "start" | "center" | "end"

type Selection = { node: BarTriggerNode; fromSlot: Slot; fromIdx: number } | null

// ─── helpers ──────────────────────────────────────────────────────────────────

function generateId(): NodeId {
  return "n_" + Math.random().toString(36).slice(2, 8)
}

function slotLabel(s: Slot) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── BarPreview ───────────────────────────────────────────────────────────────

function BarPreview({ layout }: { layout: BarSlotLayout }) {
  const triggerName = (node: BarNode) =>
    node.kind === "trigger" ? node.triggerWidget : node.kind

  return (
    <box class="bar-preview" hexpand>
      <box class="bar-preview-slot" spacing={4} hexpand halign={Gtk.Align.START}>
        {layout.start.map((n) => (
          <box class="bar-preview-chip" valign={Gtk.Align.CENTER}>
            <label label={triggerName(n)} />
          </box>
        ))}
      </box>
      <box class="bar-preview-slot bar-preview-center" spacing={4} hexpand halign={Gtk.Align.CENTER}>
        {layout.center.map((n) => (
          <box class="bar-preview-chip accent" valign={Gtk.Align.CENTER}>
            <label label={triggerName(n)} />
          </box>
        ))}
      </box>
      <box class="bar-preview-slot" spacing={4} hexpand halign={Gtk.Align.END}>
        {layout.end.map((n) => (
          <box class="bar-preview-chip" valign={Gtk.Align.CENTER}>
            <label label={triggerName(n)} />
          </box>
        ))}
      </box>
    </box>
  )
}

// ─── MenuNodeEditor ───────────────────────────────────────────────────────────

const MENU_WIDGET_OPTIONS: BarMenuKey[] = [
  "Volume", "Wireless", "Battery", "Media", "Clipboard", "Hyprsunset",
]

const MENU_NODE_TYPE_LABELS: Record<MenuNode["kind"], string> = {
  "menu-widget": "Widget",
  "menu-container": "Container",
  "menu-divider": "Divider",
  "menu-spacer": "Spacer",
}

/**
 * Inline dropdown for selecting a BarMenuKey.
 */
function WidgetKeyDropdown({
  current,
  onChange,
}: {
  current: BarMenuKey
  onChange: (key: BarMenuKey) => void
}) {
  const keys = Object.keys(barMenuMap) as BarMenuKey[]
  const [open, setOpen] = createState(false)

  return (
    <box spacing={2}>
      <button
        cssClasses={["menu-key-selector"]}
        onClicked={() => setOpen((v) => !v)}
      >
        <label label={current} />
      </button>
      <With value={open}>
        {(o) =>
          o && (
            <box cssClasses={["menu-key-dropdown"]} orientation={Gtk.Orientation.VERTICAL}>
              {keys.map((k) => (
                <button
                  cssClasses={k === current ? ["menu-key-option", "active"] : ["menu-key-option"]}
                  onClicked={() => {
                    onChange(k)
                    setOpen(false)
                  }}
                >
                  <label label={k} />
                </button>
              ))}
            </box>
          )
        }
      </With>
    </box>
  )
}

/**
 * Renders an editable list of MenuNodes — the composable content inside a
 * trigger's popover, or the children of a menu-container node.
 *
 * Analog of OkShell's MenuWidgetListModel.
 */
function MenuNodeEditor({
  nodes,
  onChange,
  depth = 0,
}: {
  nodes: MenuNode[]
  onChange: (next: MenuNode[]) => void
  depth?: number
}) {
  const [expanded, setExpanded] = createState<Record<NodeId, boolean>>({})

  const toggleExpand = (id: NodeId) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...nodes]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
      ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  const remove = (idx: number) => {
    onChange(nodes.filter((_, i) => i !== idx))
  }

  const addWidget = (key: BarMenuKey) => {
    onChange([...nodes, { kind: "menu-widget", id: generateId(), widget: key }])
  }

  const addContainer = () => {
    onChange([
      ...nodes,
      {
        kind: "menu-container",
        id: generateId(),
        direction: "horizontal" as const,
        spacing: 0,
        minimumWidth: 0,
        children: [],
      },
    ])
  }

  const addDivider = () => {
    onChange([...nodes, { kind: "menu-divider", id: generateId() }])
  }

  const addSpacer = () => {
    onChange([...nodes, { kind: "menu-spacer", id: generateId(), size: 16 }])
  }

  const updateNode = (idx: number, next: MenuNode) => {
    const arr = [...nodes]
    arr[idx] = next
    onChange(arr)
  }

  const indentPx = depth * 12

  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      spacing={2}
      marginStart={indentPx}
    >
      {nodes.map((node, idx) => (
        <box
          cssClasses={["menu-node-row"]}
          orientation={Gtk.Orientation.VERTICAL}
          spacing={2}
        >
          {/* Row header */}
          <box spacing={4}>
            <button
              cssClasses={["menu-node-move"]}
              onClicked={() => move(idx, -1)}
              sensitive={idx > 0}
            >
              <label label="↑" />
            </button>
            <button
              cssClasses={["menu-node-move"]}
              onClicked={() => move(idx, 1)}
              sensitive={idx < nodes.length - 1}
            >
              <label label="↓" />
            </button>

            <label
              cssClasses={["menu-node-type"]}
              label={MENU_NODE_TYPE_LABELS[node.kind]}
            />

            {node.kind === "menu-widget" && (
              <WidgetKeyDropdown
                current={node.widget}
                onChange={(key) => updateNode(idx, { ...node, widget: key })}
              />
            )}

            {node.kind === "menu-spacer" && (
              <box spacing={4}>
                <label label="size:" />
                <entry
                  text={String(node.size)}
                  widthChars={5}
                  onActivate={(self) => {
                    const val = parseInt(self.text, 10)
                    if (!isNaN(val)) updateNode(idx, { ...node, size: val })
                  }}
                />
              </box>
            )}

            {node.kind === "menu-container" && (
              <box spacing={4}>
                <button
                  cssClasses={["menu-container-dir"]}
                  onClicked={() =>
                    updateNode(idx, {
                      ...node,
                      direction: node.direction === "horizontal" ? "vertical" : "horizontal",
                    })
                  }
                >
                  <label label={node.direction === "horizontal" ? "H" : "V"} />
                </button>
                <button
                  cssClasses={["menu-node-expand"]}
                  onClicked={() => toggleExpand(node.id)}
                >
                  <label label={expanded.peek()[node.id] ? "▾" : "▸"} />
                </button>
              </box>
            )}

            {node.kind === "menu-divider" && (
              <label cssClasses={["menu-node-desc"]} label="──────" />
            )}

            <box hexpand />

            <button
              cssClasses={["menu-node-remove"]}
              onClicked={() => remove(idx)}
            >
              <label label="✕" />
            </button>
          </box>

          {/* Container children — recursive */}
          {node.kind === "menu-container" && expanded.peek()[node.id] && (
            <MenuNodeEditor
              nodes={node.children}
              onChange={(children) => updateNode(idx, { ...node, children })}
              depth={depth + 1}
            />
          )}
        </box>
      ))}

      {/* Add row */}
      <box cssClasses={["menu-node-add-row"]} spacing={4}>
        {MENU_WIDGET_OPTIONS.map((key) => (
          <button
            cssClasses={["menu-node-add-chip"]}
            onClicked={() => addWidget(key)}
          >
            <label label={`+ ${key}`} />
          </button>
        ))}
        <button cssClasses={["menu-node-add-chip"]} onClicked={addContainer}>
          <label label="+ Container" />
        </button>
        <button cssClasses={["menu-node-add-chip"]} onClicked={addDivider}>
          <label label="+ Divider" />
        </button>
        <button cssClasses={["menu-node-add-chip"]} onClicked={addSpacer}>
          <label label="+ Spacer" />
        </button>
      </box>
    </box>
  )
}

// ─── SlotEditor ───────────────────────────────────────────────────────────────

function SlotEditor({
  slot,
  nodes,
  hasSel,
  isSelSource,
  onPickUp,
  onDropAt,
  onUpdateNode,
}: {
  slot: Slot
  nodes: BarNode[]
  hasSel: ReturnType<typeof createState<boolean>>[0]
  isSelSource: (id: NodeId) => boolean
  onPickUp: (node: BarTriggerNode, idx: number) => void
  onDropAt: (slot: Slot, idx: number) => void
  onUpdateNode: (idx: number, next: BarNode) => void
}) {
  const [menuOpen, setMenuOpen] = createState<Record<NodeId, boolean>>({})
  const toggleMenu = (id: NodeId) =>
    setMenuOpen((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <box class={`bar-slot-zone bar-slot-${slot}`} orientation={Gtk.Orientation.VERTICAL} spacing={2}>
      <label class="bar-slot-label" label={slotLabel(slot)} xalign={0} />
      <box class="bar-slot-chips" orientation={Gtk.Orientation.VERTICAL} spacing={2}>
        {nodes.map((node, idx) => {
          if (node.kind !== "trigger") return <box />

          const isSource = isSelSource(node.id)
          const isOpen = menuOpen.peek()[node.id] ?? false

          return (
            <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
              {/* Trigger row */}
              <box spacing={4}>
                <button
                  cssClasses={isSource ? ["bar-module-chip", "picked"] : ["bar-module-chip"]}
                  onClicked={() => {
                    if (hasSel.peek()) {
                      onDropAt(slot, idx)
                    } else {
                      onPickUp(node, idx)
                    }
                  }}
                >
                  <box spacing={4}>
                    <label label={node.triggerWidget} hexpand halign={Gtk.Align.START} />
                    <label label={isSource ? "✕" : "↕"} cssClasses={["bar-chip-action"]} />
                  </box>
                </button>

                {/* Toggle inline menu editor */}
                <button
                  cssClasses={isOpen ? ["bar-menu-toggle", "open"] : ["bar-menu-toggle"]}
                  onClicked={() => toggleMenu(node.id)}
                  tooltipText="Edit menu content"
                >
                  <label label={`☰ ${node.children.length}`} />
                </button>
              </box>

              {/* Inline menu node editor */}
              {isOpen && (
                <box
                  cssClasses={["bar-menu-editor-panel"]}
                  orientation={Gtk.Orientation.VERTICAL}
                  marginStart={8}
                >
                  <MenuNodeEditor
                    nodes={node.children}
                    onChange={(children) =>
                      onUpdateNode(idx, { ...node, children })
                    }
                  />
                </box>
              )}
            </box>
          )
        })}

        <With value={hasSel}>
          {(sel) =>
            sel && (
              <button class="bar-slot-drop-target" onClicked={() => onDropAt(slot, nodes.length)}>
                <label label={`＋ ${slotLabel(slot)}`} halign={Gtk.Align.CENTER} />
              </button>
            )
          }
        </With>
      </box>
    </box>
  )
}

// ─── TriggerPool ──────────────────────────────────────────────────────────────

function TriggerPool({
  layout,
  hasSel,
  onAdd,
  onCancel,
}: {
  layout: BarSlotLayout
  hasSel: ReturnType<typeof createState<boolean>>[0]
  onAdd: (key: BarTriggerKey) => void
  onCancel: () => void
}) {
  const inLayout = (key: BarTriggerKey) => {
    const check = (nodes: BarNode[]) =>
      nodes.some((n) => n.kind === "trigger" && n.triggerWidget === key)
    return check(layout.start) || check(layout.center) || check(layout.end)
  }

  const allKeys = Object.keys(barTriggerMap) as BarTriggerKey[]

  return (
    <box class="bar-module-pool" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
      <box spacing={6}>
        <label class="bar-slot-label" label="All triggers" xalign={0} hexpand />
        <With value={hasSel}>
          {(sel) =>
            sel && (
              <button class="bar-cancel-btn" onClicked={onCancel}>
                <label label="Cancel" />
              </button>
            )
          }
        </With>
      </box>
      <box spacing={4}>
        {allKeys.filter((k) => !inLayout(k)).map((key) => (
          <button class="bar-module-chip" onClicked={() => onAdd(key)}>
            <label label={key} />
          </button>
        ))}
      </box>
    </box>
  )
}

// ─── LayoutEditor (public) ────────────────────────────────────────────────────

/**
 * Layout editor for the bar slot system.
 *
 * Each slot (start/center/end) shows its BarTriggerNodes. Clicking a trigger
 * picks it up for reordering; clicking another slot position drops it there.
 *
 * Each trigger row has a ☰ button that expands an inline MenuNodeEditor —
 * the composable menu content (inspired by OkShell's MenuWidgetListModel).
 */
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

  const handlePickUp = (node: BarTriggerNode, fromSlot: Slot, fromIdx: number) => {
    const cur = selection.peek()
    if (cur?.fromSlot === fromSlot && cur?.fromIdx === fromIdx) {
      setSelFull(null)
    } else {
      setSelFull({ node, fromSlot, fromIdx })
    }
  }

  const handleDropAt = (toSlot: Slot, toIdx: number) => {
    const sel = selection.peek()
    if (!sel) return

    const isSameSlot = sel.fromSlot === toSlot
    const adjustedIdx = isSameSlot && sel.fromIdx < toIdx ? toIdx - 1 : toIdx

    const removeFrom = (nodes: BarNode[], idx: number) =>
      nodes.filter((_, i) => i !== idx)

    const insertAt = (nodes: BarNode[], idx: number, node: BarNode) => {
      const next = [...nodes]
      next.splice(idx, 0, node)
      return next
    }

    const fromNodes = layout[sel.fromSlot]
    const toNodes = layout[toSlot]

    const nextFrom = removeFrom(fromNodes, sel.fromIdx)
    const nextTo = isSameSlot
      ? insertAt(removeFrom(fromNodes, sel.fromIdx), adjustedIdx, sel.node)
      : insertAt(toNodes, adjustedIdx, sel.node)

    const next: BarSlotLayout = {
      ...layout,
      [sel.fromSlot]: isSameSlot ? nextTo : nextFrom,
      ...(isSameSlot ? {} : { [toSlot]: nextTo }),
    }

    onChange(next)
    setSelFull(null)
  }

  const handleAdd = (key: BarTriggerKey) => {
    const newNode: BarTriggerNode = {
      kind: "trigger",
      id: generateId(),
      triggerWidget: key,
      children: [],
      menuMinimumWidth: 410,
    }
    onChange({ ...layout, end: [...layout.end, newNode] })
  }

  const handleUpdateNode = (slot: Slot, idx: number, next: BarNode) => {
    const nodes = [...layout[slot]]
    nodes[idx] = next
    onChange({ ...layout, [slot]: nodes })
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
            nodes={layout[slot]}
            hasSel={hasSel}
            isSelSource={(id) => {
              const s = selection.peek()
              return s?.node.id === id && s?.fromSlot === slot
            }}
            onPickUp={(node, idx) => handlePickUp(node, slot, idx)}
            onDropAt={handleDropAt}
            onUpdateNode={(idx, next) => handleUpdateNode(slot, idx, next)}
          />
        ))}
      </box>

      <TriggerPool
        layout={layout}
        hasSel={hasSel}
        onAdd={handleAdd}
        onCancel={cancel}
      />
    </box>
  )
}

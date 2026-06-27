import { Gtk } from "ags/gtk4"
import { barTriggerMap } from "../triggers"
import { MenuRenderer } from "src/widget/shared/menus"
import type { BarNode } from "src/configuration/widgets/bar/type"
import type { Accessor } from "gnim"

/** Self-contained triggers that manage their own interactivity. Never wrap these. */
const SELF_CONTAINED: (keyof typeof barTriggerMap)[] = ["Workspaces", "Tray"]

export function BarNodeRenderer({
  node,
  vertical,
}: {
  node: BarNode
  vertical: Accessor<boolean>
}) {
  // ── Group node ─────────────────────────────────────────────────────────────
  if (node.kind === "group") {
    const orientation = node.direction === "horizontal"
      ? Gtk.Orientation.HORIZONTAL
      : Gtk.Orientation.VERTICAL

    return (
      <box
        orientation={orientation}
        spacing={node.spacing}
        cssClasses={node.cssClass ? ["bar-group", node.cssClass] : ["bar-group"]}
      >
        {node.children.map((child) => (
          <BarNodeRenderer node={child} vertical={vertical} />
        ))}
      </box>
    )
  }

  // ── Trigger node ───────────────────────────────────────────────────────────
  if (node.kind === "trigger") {
    const Trigger = barTriggerMap[node.triggerWidget]
    if (!Trigger) return <box />

    const selfContained = SELF_CONTAINED.includes(node.triggerWidget as any)
    const hasMenu       = node.children.length > 0

    // Self-contained triggers (Workspaces, Tray) always render directly.
    if (selfContained) {
      return <Trigger vertical={vertical} />
    }

    // Trigger with menu → wrap in menubutton + popover.
    // MenuRenderer is orientation-agnostic: it renders the MenuNode tree
    // without needing to know about bar orientation.
    if (hasMenu) {
      return (
        <menubutton hexpand={false} halign={Gtk.Align.CENTER}>
          <Trigger vertical={vertical} />
          <popover>
            <box
              orientation={Gtk.Orientation.VERTICAL}
              widthRequest={node.menuMinimumWidth > 0 ? node.menuMinimumWidth : -1}
            >
              <MenuRenderer
                nodes={node.children}
                parentDirection="vertical"
              />
            </box>
          </popover>
        </menubutton>
      )
    }

    // Trigger with no menu → render content directly, no wrapper.
    return <Trigger vertical={vertical} />
  }

  return <box />
}

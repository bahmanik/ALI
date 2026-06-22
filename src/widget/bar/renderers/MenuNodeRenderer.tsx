import { Gtk } from "ags/gtk4"
import { barMenuMap } from "../triggers"
import type { MenuNode } from "src/configuration/widgets/bar/type"
import type { Accessor } from "gnim"

/**
 * Renders a MenuNode tree inside a trigger's popover.
 *
 * - kind:"menu-widget"    → looks up barMenuMap[node.widget] and calls it
 * - kind:"menu-container" → gtk Box containing recursive children
 *   (horizontal layout = multiple menus side-by-side, like OkShell's ContainerConfig)
 * - kind:"menu-divider"   → gtk Separator
 * - kind:"menu-spacer"    → empty box with fixed size request
 */
export function MenuNodeRenderer({
  nodes,
  vertical,
  parentDirection = "vertical",
}: {
  nodes: MenuNode[]
  vertical: Accessor<boolean>
  parentDirection?: "horizontal" | "vertical"
}) {
  return (
    <box
      orientation={
        parentDirection === "horizontal"
          ? Gtk.Orientation.HORIZONTAL
          : Gtk.Orientation.VERTICAL
      }
    >
      {nodes.map((node) => renderNode(node, vertical))}
    </box>
  )
}

function renderNode(node: MenuNode, vertical: Accessor<boolean>): JSX.Element {
  switch (node.kind) {
    case "menu-widget": {
      const Menu = barMenuMap[node.widget]
      if (!Menu) return <box />
      return <Menu />
    }

    case "menu-container": {
      const orientation = node.direction === "horizontal"
        ? Gtk.Orientation.HORIZONTAL
        : Gtk.Orientation.VERTICAL

      return (
        <box
          cssClasses={["menu-container-node"]}
          orientation={orientation}
          spacing={node.spacing}
          widthRequest={node.minimumWidth > 0 ? node.minimumWidth : -1}
          hexpand
        >
          {node.children.map((child) => renderNode(child, vertical))}
        </box>
      )
    }

    case "menu-divider": {
      return (
        <Gtk.Separator
          cssClasses={["menu-divider-node"]}
          orientation={Gtk.Orientation.HORIZONTAL}
          hexpand
        />
      )
    }

    case "menu-spacer": {
      return (
        <box
          cssClasses={["menu-spacer-node"]}
          heightRequest={node.size}
          widthRequest={node.size}
        />
      )
    }
  }
}

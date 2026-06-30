import { Gtk } from "ags/gtk4"
import { menuMap } from "./menuMap"
import type { MenuNode } from "./types"

/**
 * Shared menu tree renderer.
 *
 * Renders a `MenuNode[]` tree into a GTK box. Works in any context — bar
 * trigger popovers, dashboard grid cells, or any future widget.
 *
 * Each MenuWidgetNode's `id` (its NodeId) is passed to the menu component
 * so it can look up its own per-instance config via getMenuOpt().
 */
export function MenuRenderer({
  nodes,
  parentDirection = "vertical",
}: {
  nodes: MenuNode[]
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
      {nodes.map((node) => renderMenuNode(node))}
    </box>
  )
}

/**
 * Renders a single `MenuNode`. Exported so callers that need to render one
 * node at a time (e.g. inside a `Gtk.Grid.$` callback) can do so without
 * wrapping everything in an extra box.
 */
export function renderMenuNode(node: MenuNode): JSX.Element {
  switch (node.kind) {
    case "menu-widget": {
      const entry = menuMap[node.widget]
      if (!entry) return <box />
      const Menu = entry.component
      return <Menu nodeId={node.id} />
    }

    case "menu-container": {
      const orientation =
        node.direction === "horizontal"
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
          {node.children.map((child) => renderMenuNode(child))}
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

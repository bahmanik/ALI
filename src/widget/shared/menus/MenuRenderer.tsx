import { Gtk } from "ags/gtk4"
import { menuMap } from "./menuMap"
import type { MenuNode } from "./types"

/**
 * Shared menu tree renderer.
 *
 * Renders a `MenuNode[]` tree into a GTK box. Works in any context — bar
 * trigger popovers, dashboard grid cells, or any future widget.
 *
 * Previously `MenuNodeRenderer` lived in `src/widget/bar/renderers/` and was
 * bar-only. Elevated here so any widget can `import { MenuRenderer }` and
 * render a tree without coupling to the bar.
 *
 * The renderer is intentionally free of bar concerns (`vertical`, triggers,
 * etc.) — it only knows about menu content.
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
      const Menu = menuMap[node.widget]
      if (!Menu) return <box />
      return <Menu />
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

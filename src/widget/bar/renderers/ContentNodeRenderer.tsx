import { Gtk } from "ags/gtk4"
import { barContentMap } from "../modules"
import type { ContentNode } from "src/configuration/widgets/bar/type"
import type { Accessor } from "gnim"

export function ContentNodeRenderer({
  node,
  vertical,
  shared = false,
}: {
  node: ContentNode
  vertical: Accessor<boolean>
  shared?: boolean
}) {
  if (node.kind === "module") {
    const Content = barContentMap[node.module]
    if (!Content) return <box />
    return <Content vertical={vertical} shared={shared} />
  }

  if (node.kind === "box") {
    const orientation = node.direction === "horizontal"
      ? Gtk.Orientation.HORIZONTAL
      : Gtk.Orientation.VERTICAL

    return (
      <box
        orientation={orientation}
        spacing={node.spacing}
        widthRequest={node.width > 0 ? node.width : -1}
        heightRequest={node.height > 0 ? node.height : -1}
      >
        {node.children.map((child) => (
          <ContentNodeRenderer
            node={child}
            vertical={vertical}
            shared={node.children.length > 1}
          />
        ))}
      </box>
    )
  }

  return <box />
}

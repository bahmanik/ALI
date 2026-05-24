import { Gtk } from "ags/gtk4"
import { barModuleMap } from "../modules"
import { ContentNodeRenderer } from "./ContentNodeRenderer"
import type { BarNode } from "src/configuration/widgets/bar/type"
import type { Accessor } from "gnim"

export function BarNodeRenderer({
  node,
  vertical,
}: {
  node: BarNode
  vertical: Accessor<boolean>
}) {
  if (node.kind === "module") {
    const Component = barModuleMap[node.module]
    if (!Component) return <box />
    return <Component vertical={vertical} />
  }

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

  if (node.kind === "popover") {
    const icon = node.triggerIcon || ""
    const label = node.triggerLabel || ""

    return (
      <menubutton hexpand={false} halign={Gtk.Align.CENTER}>
        <box spacing={4}>
          {icon && <image iconName={icon} />}
          {label && <label label={label} />}
        </box>
        <popover>
          <ContentNodeRenderer node={node.content} vertical={vertical} />
        </popover>
      </menubutton>
    )
  }

  return <box />
}

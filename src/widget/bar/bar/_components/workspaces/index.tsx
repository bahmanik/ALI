import AstalHyprland from "gi://AstalHyprland"
import { createBinding, createEffect, createState } from "ags"
import { Gtk } from "ags/gtk4"
import type { Opt } from "src/lib/options"

export function range(max: number) {
  return Array.from({ length: max + 1 }, (_, i) => i)
}

type WsButtonProps = JSX.IntrinsicElements["button"] & {
  ws: AstalHyprland.Workspace
}

function WorkspaceButton({ ws, ...props }: WsButtonProps) {
  let button: Gtk.Button
  const hyprland = AstalHyprland.get_default()
  const fws = createBinding(hyprland, "focusedWorkspace")
  const clients = createBinding(hyprland, "clients")
  const [classes, setClasses] = createState(["workspace-button"])
  if (fws.peek().id == ws.id) {
    const newClasses = classes.peek()
    newClasses.push("active")
    setClasses(newClasses)
  }

  const updateClasses = (
    focusedWorkspace: AstalHyprland.Workspace,
    clients: AstalHyprland.Client[],
  ) => {
    const active = focusedWorkspace.id == ws.id
    if (active) {
      button.add_css_class("active")
    } else {
      button.remove_css_class("active")
    }

    const occupied = clients.some((c) => c.workspace.id == ws.id)
    if (occupied && !active) {
      button.add_css_class("occupied")
    } else {
      button.remove_css_class("occupied")
    }
  }

  createEffect(() => {
    updateClasses(fws(), clients())
  })

  return (
    <button
      $={(self) => {
        button = self
      }}
      class="workspace-button"
      valign={Gtk.Align.CENTER}
      halign={Gtk.Align.CENTER}
      onClicked={() => ws.focus()}
      {...props}
    />
  )
}

export default function Workspaces({ verticalState }: { verticalState: Opt<boolean> }) {
  return (
    <box
      orientation={
        verticalState.as(vertical => vertical ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL)
      }
      hexpand={verticalState.get()}
      class="workspace-container" spacing={4}>
      {range(8).map((i) => (
        <WorkspaceButton ws={AstalHyprland.Workspace.dummy(i + 1, null)} />
      ))}
    </box>
  )
}

import type { NodeId } from "./types"

export function QuickLaunchMenu({ nodeId }: { nodeId: NodeId }) {
  return (
    <box class={`test${Math.floor(Math.random() * 10) + 1}`}>
      QuickLaunch
    </box>
  )
}

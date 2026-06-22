import type { Accessor } from "gnim"

/**
 * Props every bar trigger receives.
 * `vertical` is a reactive accessor so triggers can derive orientation-aware
 * layout bindings without holding a reference to the full option tree.
 */
export type BarTriggerProps = {
  vertical: Accessor<boolean>
}

/**
 * Props for menu content rendered inside a shared popover (via BarPopoverNode).
 * `shared` suppresses internal headers when multiple menus share one container.
 */
export type BarMenuProps = {
  vertical: Accessor<boolean>
  /** True when this menu is one of several inside a shared popover container. */
  shared: boolean
}

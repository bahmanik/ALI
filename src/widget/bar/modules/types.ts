import type { Accessor } from "gnim"

/**
 * Props every bar module receives.
 * `vertical` is a reactive accessor so modules can derive orientation-aware
 * layout bindings without holding a reference to the full option tree.
 */
export type BarModuleProps = {
  vertical: Accessor<boolean>
}

// Props for content rendered inside a shared popover
export type BarContentProps = {
  vertical: Accessor<boolean>
  /** True when sharing a popover with other modules — suppress internal headers. */
  shared: boolean
}

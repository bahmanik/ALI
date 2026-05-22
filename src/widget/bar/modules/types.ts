import type { Accessor } from "gnim"

/**
 * Props every bar module receives.
 * `vertical` is a reactive accessor so modules can derive orientation-aware
 * layout bindings without holding a reference to the full option tree.
 */
export type BarModuleProps = {
  vertical: Accessor<boolean>
}

import options from "src/configuration"
import { menuDefaults } from "./menuDefaults"
import type { MenuConfigOf } from "./menuDefaults"
import type { MenuKey } from "./menuMap"
import type { NodeId } from "./types"
import { Opt } from "src/lib/options"

/**
 * Returns the per-instance Opt<T> for a given NodeId and config field.
 *
 * The returned Opt is fully registered in OptionRegistry — it participates
 * in reset(), handler(), and toArray(). Its id on disk is:
 *   "menuInstances.instances.<nodeId>.<field>"
 *
 * Two nodes with different NodeIds get independent Opts: changing one does
 * not fire the other.
 *
 * @param nodeId  - The NodeId of the MenuWidgetNode being rendered
 * @param menuKey - The MenuKey identifying which menu schema to use
 * @param field   - A field key from that menu's defaults (type-checked)
 *
 * @example
 *   const formatOpt = getMenuOpt(nodeId, "Clock", "format")
 *   // TypeScript infers Opt<string> — no cast needed
 *
 * Fallback: if the NodeId was not present in any layout when the app last
 * booted (i.e. it was added at runtime), the static tree has no Opt for it.
 * In that case we return the global default Opt and log a warning. The
 * per-instance config for that node will persist correctly after a restart.
 */
export function getMenuOpt<
  K extends MenuKey,
  F extends keyof MenuConfigOf<K>,
>(
  nodeId: NodeId,
  menuKey: K,
  field: F,
): Opt<MenuConfigOf<K>[F]> {
  const instanceNode = (options.menuInstances.instances as Record<string, Record<string, unknown>>)[nodeId]
  const instanceOpt  = instanceNode?.[field as string]

  if (instanceOpt instanceof Opt) {
    return instanceOpt as Opt<MenuConfigOf<K>[F]>
  }

  // NodeId not pre-seeded — was added at runtime after boot.
  // Changes here will write to disk correctly (the Opt already has the right
  // id from the menuDefaults subtree) but the value won't be per-instance
  // until the next restart seeds its own Opt in the static tree.
  console.warn(
    `[getMenuOpt] NodeId "${nodeId}" not found in static instance tree. ` +
    `Falling back to global default for "${menuKey}.${String(field)}". ` +
    `Per-instance config will work after restart.`
  )
  return (menuDefaults[menuKey] as Record<string, Opt<unknown>>)[field as string] as Opt<MenuConfigOf<K>[F]>
}

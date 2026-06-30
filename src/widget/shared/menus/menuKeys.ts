/**
 * Standalone MenuKey declarations with zero component imports.
 *
 * This file is intentionally kept import-free (beyond type imports from types.ts)
 * so that instanceTree.ts can import isMenuKey here rather than from menuMap.ts,
 * breaking the circular dependency:
 *
 *   menuMap → clockMenu → getMenuOpt → configuration → instanceTree → menuMap
 *                                                                   ↘ menuKeys ✓
 *
 * Everything here is re-exported from menuMap.ts so callers importing from
 * "src/widget/shared/menus" or "src/widget/shared/menus/menuMap" see no change.
 */

/**
 * All valid menu widget keys. Keep in sync with the menuMap object in menuMap.ts.
 * Derived automatically from typeof menuMap there; declared explicitly here so
 * this file has no component imports.
 */
export type MenuKey =
  | "AppLauncher"
  | "Avatar"
  | "Battery"
  | "Clipboard"
  | "Clock"
  | "FileLauncher"
  | "Hyprsunset"
  | "Media"
  | "Notification"
  | "Observer"
  | "QuickLaunch"
  | "Quotes"
  | "Uptime"
  | "Volume"
  | "Weather"
  | "Wireless"

export const ALL_MENU_KEYS: MenuKey[] = [
  "AppLauncher",
  "Avatar",
  "Battery",
  "Clipboard",
  "Clock",
  "FileLauncher",
  "Hyprsunset",
  "Media",
  "Notification",
  "Observer",
  "QuickLaunch",
  "Quotes",
  "Uptime",
  "Volume",
  "Weather",
  "Wireless",
]

const MENU_KEY_SET = new Set<string>(ALL_MENU_KEYS)

/** Type guard: narrows `string` → `MenuKey`. */
export function isMenuKey(value: string): value is MenuKey {
  return MENU_KEY_SET.has(value)
}

/** Generates a unique, stable node ID for a menu tree node. */
export function generateMenuNodeId(): string {
  return "n_" + Math.random().toString(36).slice(2, 8)
}

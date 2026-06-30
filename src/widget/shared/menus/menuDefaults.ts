import { opt } from "src/lib/options"
import type { Opt } from "src/lib/options"
import type { MenuKey } from "./menuKeys"

/**
 * Global defaults for every menu component.
 *
 * satisfies Record<MenuKey, object> — the minimal constraint needed to ensure
 * every MenuKey has an entry, without introducing Opt<unknown> which would
 * widen the inferred value types and cause MenuConfigOf<K>[F] to resolve to
 * unknown instead of the concrete field type.
 */
export const menuDefaults = {
  AppLauncher:  {},
  Avatar:       {},
  Battery:      {},
  Clipboard:    {},
  Clock: {
    format:      opt("%H:%M:%S"),
    showSeconds: opt(true),
  },
  FileLauncher: {},
  Hyprsunset: {
    defaultTemperature: opt(3000),
  },
  Media:        {},
  Notification: {},
  Observer:     {},
  QuickLaunch:  {},
  Quotes:       {},
  Uptime:       {},
  Volume: {
    showPercent: opt(true),
    showMic:     opt(true),
  },
  Weather: {
    unit:     opt<"celsius" | "fahrenheit">("celsius"),
    location: opt(""),
  },
  Wireless:     {},
} satisfies Record<MenuKey, object>

export type MenuDefaults = typeof menuDefaults

/**
 * Extracts the value type of each config field for a given MenuKey.
 *
 * @example
 *   MenuConfigOf<"Clock">   // → { format: string; showSeconds: boolean }
 *   MenuConfigOf<"Battery"> // → {}
 */
export type MenuConfigOf<K extends MenuKey> = {
  [F in keyof MenuDefaults[K]]:
    MenuDefaults[K][F] extends Opt<infer T> ? T : never
}

import { AppLauncherMenu } from "./appLauncherMenu"
import { AvatarMenu } from "./avatarMenu"
import { BatteryMenu } from "./batteryMenu"
import { ClipboardMenu } from "./clipboardMenu"
import { ClockMenu } from "./clockMenu"
import { FileLauncherMenu } from "./fileLauncherMenu"
import { HyprsunsetMenu } from "./hyprsunsetMenu"
import { MediaMenu } from "./mediaMenu"
import { NotificationMenu } from "./notificationMenu"
import { ObserverMenu } from "./observerMenu"
import { QuickLaunchMenu } from "./quickLaunchMenu"
import { QuotesMenu } from "./quotesMenu"
import { UptimeMenu } from "./uptimeMenu"
import { VolumeMenu } from "./volumeMenu"
import { WeatherMenu } from "./weatherMenu"
import { WirelessMenu } from "./wirelessMenu"

/**
 * Single source of truth for every menu component in the system.
 *
 * Used by both the bar (via MenuRenderer inside trigger popovers) and the
 * dashboard (via MenuRenderer per grid cell). Any future widget that wants to
 * embed menus imports from here.
 *
 * Key   = the string stored in config / layout data
 * Value = zero-argument () => JSX.Element (pure UI, no wrapper)
 *
 * Adding a menu here is the ONLY change required — MenuKey, ALL_MENU_KEYS,
 * and isMenuKey are all derived automatically.
 */
export const menuMap = {
  AppLauncher: AppLauncherMenu,
  Avatar: AvatarMenu,
  Battery: BatteryMenu,
  Clipboard: ClipboardMenu,
  Clock: ClockMenu,
  FileLauncher: FileLauncherMenu,
  Hyprsunset: HyprsunsetMenu,
  Media: MediaMenu,
  Notification: NotificationMenu,
  Observer: ObserverMenu,
  QuickLaunch: QuickLaunchMenu,
  Quotes: QuotesMenu,
  Uptime: UptimeMenu,
  Volume: VolumeMenu,
  Weather: WeatherMenu,
  Wireless: WirelessMenu,
} as const satisfies Record<string, () => JSX.Element>

/** Union of every valid menu key — derived, never manually updated. */
export type MenuKey = keyof typeof menuMap

/** Ordered list of all menu keys, for settings UI pickers. */
export const ALL_MENU_KEYS: MenuKey[] = Object.keys(menuMap) as MenuKey[]

/** Type guard: narrows `string` → `MenuKey`. */
export function isMenuKey(value: string): value is MenuKey {
  return value in menuMap
}

/** Generates a unique node ID for menu tree nodes. */
export function generateMenuNodeId(): string {
  return "n_" + Math.random().toString(36).slice(2, 8)
}

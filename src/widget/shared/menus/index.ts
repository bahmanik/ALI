// ─── Menu map (single source of truth) ───────────────────────────────────────
export { menuMap, ALL_MENU_KEYS, isMenuKey, generateMenuNodeId } from "./menuMap"
export type { MenuKey } from "./menuMap"

// ─── Menu node tree types ─────────────────────────────────────────────────────
export type {
  NodeId,
  MenuWidgetNode,
  MenuContainerNode,
  MenuDividerNode,
  MenuSpacerNode,
  MenuNode,
} from "./types"

// ─── Shared renderer ──────────────────────────────────────────────────────────
export { MenuRenderer, renderMenuNode } from "./MenuRenderer"

// ─── Individual menu components ───────────────────────────────────────────────
export { HyprsunsetMenu } from "./hyprsunsetMenu"
export { VolumeMenu } from "./volumeMenu"
export { WirelessMenu } from "./wirelessMenu"
export { BatteryMenu } from "./batteryMenu"
export { MediaMenu } from "./mediaMenu"
export { ClipboardMenu } from "./clipboardMenu"
export { AppLauncherMenu } from "./appLauncherMenu"
export { AvatarMenu } from "./avatarMenu"
export { ClockMenu } from "./clockMenu"
export { FileLauncherMenu } from "./fileLauncherMenu"
export { NotificationMenu } from "./notificationMenu"
export { ObserverMenu } from "./observerMenu"
export { QuickLaunchMenu } from "./quickLaunchMenu"
export { QuotesMenu } from "./quotesMenu"
export { UptimeMenu } from "./uptimeMenu"
export { WeatherMenu } from "./weatherMenu"

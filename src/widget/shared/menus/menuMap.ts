import { menuDefaults } from "./menuDefaults"
import type { Opt } from "src/lib/options"
import type { NodeId } from "./types"

export {
  MenuKey,
  ALL_MENU_KEYS,
  isMenuKey,
  generateMenuNodeId,
} from "./menuKeys"

import { AppLauncherMenu }  from "./appLauncherMenu"
import { AvatarMenu }       from "./avatarMenu"
import { BatteryMenu }      from "./batteryMenu"
import { ClipboardMenu }    from "./clipboardMenu"
import { ClockMenu }        from "./clockMenu"
import { FileLauncherMenu } from "./fileLauncherMenu"
import { HyprsunsetMenu }   from "./hyprsunsetMenu"
import { MediaMenu }        from "./mediaMenu"
import { NotificationMenu } from "./notificationMenu"
import { ObserverMenu }     from "./observerMenu"
import { QuickLaunchMenu }  from "./quickLaunchMenu"
import { QuotesMenu }       from "./quotesMenu"
import { UptimeMenu }       from "./uptimeMenu"
import { VolumeMenu }       from "./volumeMenu"
import { WeatherMenu }      from "./weatherMenu"
import { WirelessMenu }     from "./wirelessMenu"

/** Props every menu component receives from MenuRenderer. */
export type MenuComponentProps = { nodeId: NodeId }

export const menuMap = {
  AppLauncher:  { component: AppLauncherMenu,  defaults: menuDefaults.AppLauncher },
  Avatar:       { component: AvatarMenu,       defaults: menuDefaults.Avatar },
  Battery:      { component: BatteryMenu,      defaults: menuDefaults.Battery },
  Clipboard:    { component: ClipboardMenu,    defaults: menuDefaults.Clipboard },
  Clock:        { component: ClockMenu,        defaults: menuDefaults.Clock },
  FileLauncher: { component: FileLauncherMenu, defaults: menuDefaults.FileLauncher },
  Hyprsunset:   { component: HyprsunsetMenu,   defaults: menuDefaults.Hyprsunset },
  Media:        { component: MediaMenu,        defaults: menuDefaults.Media },
  Notification: { component: NotificationMenu, defaults: menuDefaults.Notification },
  Observer:     { component: ObserverMenu,     defaults: menuDefaults.Observer },
  QuickLaunch:  { component: QuickLaunchMenu,  defaults: menuDefaults.QuickLaunch },
  Quotes:       { component: QuotesMenu,       defaults: menuDefaults.Quotes },
  Uptime:       { component: UptimeMenu,       defaults: menuDefaults.Uptime },
  Volume:       { component: VolumeMenu,       defaults: menuDefaults.Volume },
  Weather:      { component: WeatherMenu,      defaults: menuDefaults.Weather },
  Wireless:     { component: WirelessMenu,     defaults: menuDefaults.Wireless },
} as const satisfies Record<string, {
  component: (props: MenuComponentProps) => JSX.Element
  defaults:  Record<string, Opt<unknown>>
}>

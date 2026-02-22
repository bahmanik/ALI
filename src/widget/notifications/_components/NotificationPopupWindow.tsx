import type AstalNotifd from "gi://AstalNotifd";
import { Astal, Gtk } from "ags/gtk4";
import { For, onCleanup } from "ags";
import type { Accessor } from "gnim";

import NotificationCard from "./NotificationCard";

export interface NotificationPopupWindowProps {
  monitor: any;
  notifications: Accessor<AstalNotifd.Notification[]>;
}

export default function NotificationPopupWindow({ monitor, notifications }: NotificationPopupWindowProps) {
  return (
    <window
      $={(self) => onCleanup(() => self.destroy())}
      class="NotificationPopups"
      gdkmonitor={monitor}
      visible={notifications((ns) => ns.length > 0)}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
    >
      <box orientation={Gtk.Orientation.VERTICAL}>
        <For each={notifications}>
          {(notification) => <NotificationCard notification={notification} />}
        </For>
      </box>
    </window>
  );
}

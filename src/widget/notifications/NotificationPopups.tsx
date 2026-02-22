import app from "ags/gtk4/app";
import { createBinding, createState, For, onCleanup } from "ags";
import AstalNotifd from "gi://AstalNotifd";

import { addOrReplaceNotification, removeNotificationById } from "./helpers";
import { NotificationPopupWindow } from "./_components";

export default function NotificationPopups() {
  const monitors = createBinding(app, "monitors");
  const notifd = AstalNotifd.get_default();

  const [notifications, setNotifications] = createState(
    new Array<AstalNotifd.Notification>(),
  );

  const notifiedHandler = notifd.connect("notified", (_self, id, replaced) => {
    const notification = notifd.get_notification(id);
    if (!notification) return;

    setNotifications((prev) => addOrReplaceNotification(prev, notification, Boolean(replaced)));
  });

  const resolvedHandler = notifd.connect("resolved", (_self, id) => {
    setNotifications((prev) => removeNotificationById(prev, id));
  });

  onCleanup(() => {
    notifd.disconnect(notifiedHandler);
    notifd.disconnect(resolvedHandler);
  });

  return (
    <For each={monitors}>
      {(monitor) => (
        <NotificationPopupWindow monitor={monitor} notifications={notifications} />
      )}
    </For>
  );
}

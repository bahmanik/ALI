import type AstalNotifd from "gi://AstalNotifd";

export function addOrReplaceNotification(
  list: AstalNotifd.Notification[],
  notification: AstalNotifd.Notification,
  replaced: boolean,
): AstalNotifd.Notification[] {
  const id = notification.id;
  const idx = list.findIndex((n) => n.id === id);

  if (replaced && idx !== -1) {
    // Replace in-place (preserve order).
    const next = list.slice();
    next[idx] = notification;
    return next;
  }

  // New notification goes to the front.
  return [notification, ...list];
}

export function removeNotificationById(
  list: AstalNotifd.Notification[],
  id: number,
): AstalNotifd.Notification[] {
  return list.filter((n) => n.id !== id);
}

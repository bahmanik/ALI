import AstalNotifd from "gi://AstalNotifd";

import NotificationCard from "./_components/NotificationCard";

export interface NotificationProps {
  notification: AstalNotifd.Notification;
}

export default function Notification({ notification }: NotificationProps) {
  return <NotificationCard notification={notification} />;
}

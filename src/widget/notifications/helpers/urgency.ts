import AstalNotifd from "gi://AstalNotifd";

export type UrgencyClass = "low" | "normal" | "critical";

export function urgencyClass(n: AstalNotifd.Notification): UrgencyClass {
  const { LOW, NORMAL, CRITICAL } = AstalNotifd.Urgency;

  switch (n.urgency) {
    case LOW:
      return "low";
    case CRITICAL:
      return "critical";
    case NORMAL:
    default:
      return "normal";
  }
}

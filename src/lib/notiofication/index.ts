import AstalNotifd from "gi://AstalNotifd?version=0.1";

export type NotificationUrgency = "low" | "normal" | "critical";

//NOTE: notification example
// notify({
//   summary: 'File Saved Successfully',
//   body: `At this file path.`,
// });

export type NotificationAction = {
  id: string;     // action identifier
  label: string;  // what the user sees
};

export interface NotificationArgs {
  summary: string;
  body?: string;

  appName?: string;
  iconName?: string;

  replaceId?: number;
  urgency?: NotificationUrgency;
  category?: string;
  timeoutMs?: number;
  transient?: boolean;

  // richer (optional)
  actions?: NotificationAction[];
  actionIcons?: boolean;

  imagePath?: string;
  desktopEntry?: string;
  resident?: boolean;

  soundName?: string;
  soundFile?: string;
  suppressSound?: boolean;

  x?: number;
  y?: number;
}

const URGENCY: Record<NotificationUrgency, number> = {
  low: AstalNotifd.Urgency.LOW,
  normal: AstalNotifd.Urgency.NORMAL,
  critical: AstalNotifd.Urgency.CRITICAL,
};

function setIf<T>(v: T | undefined, fn: (x: T) => void): void {
  if (v !== undefined) fn(v);
}

export function notify(p: NotificationArgs): void {
  const n = new AstalNotifd.Notification();

  n.set_summary(p.summary);

  setIf(p.body, (v) => n.set_body(v));
  setIf(p.appName, (v) => n.set_app_name(v));
  setIf(p.iconName, (v) => n.set_app_icon(v));

  setIf(p.timeoutMs, (v) => n.set_expire_timeout(v));
  setIf(p.category, (v) => n.set_category(v));
  setIf(p.transient, (v) => n.set_transient(v));
  setIf(p.replaceId, (v) => n.set_id(v));

  setIf(p.urgency, (v) => n.set_urgency(URGENCY[v]));

  // richer options
  setIf(p.imagePath, (v) => n.set_image(v));
  setIf(p.desktopEntry, (v) => n.set_desktop_entry(v));
  setIf(p.resident, (v) => n.set_resident(v));
  setIf(p.actionIcons, (v) => n.set_action_icons(v));

  setIf(p.soundName, (v) => n.set_sound_name(v));
  setIf(p.soundFile, (v) => n.set_sound_file(v));
  setIf(p.suppressSound, (v) => n.set_suppress_sound(v));

  setIf(p.x, (v) => n.set_x(v));
  setIf(p.y, (v) => n.set_y(v));

  if (p.actions?.length) {
    for (const a of p.actions) {
      const act = new AstalNotifd.Action();
      act.set_id(a.id);
      act.set_label(a.label);
      n.add_action(act);
    }
  }

  // fire-and-forget
  AstalNotifd.send_notification(n, (_src, res) => {
    try {
      AstalNotifd.send_notification_finish(res);
    } catch (e) {
      console.error("Notification send failed:", e);
    }
  });
}

import { execAsync } from "ags/process";
import { NotificationArgs } from "../system/types";
import AstalNotifd from "gi://AstalNotifd?version=0.1";
import icons from "../icons/icons";

const notifd = AstalNotifd.get_default()

notifd.connect("notified", (_, id) => {
  const n = notifd.get_notification(id)
  print(n.summary, n.body)
})

notify({
  summary: 'File Saved Successfully',
  body: `At this file path.`,
  iconName: icons.ui.info,
});


function notify(notifPayload: NotificationArgs): void {
  _notify(notifPayload);
}

function _notify(notifPayload: NotificationArgs): void {
  let command = 'notify-send';

  command += ` "${notifPayload.summary} "`;

  if (notifPayload.body !== undefined) command += ` "${notifPayload.body}" `;
  if (notifPayload.appName !== undefined) command += ` -a "${notifPayload.appName}"`;
  if (notifPayload.iconName !== undefined) command += ` -i "${notifPayload.iconName}"`;
  if (notifPayload.urgency !== undefined) command += ` -u "${notifPayload.urgency}"`;
  if (notifPayload.timeout !== undefined) command += ` -t ${notifPayload.timeout}`;
  if (notifPayload.category !== undefined) command += ` -c "${notifPayload.category}"`;
  if (notifPayload.transient !== undefined) command += ' -e';
  if (notifPayload.id !== undefined) command += ` -r ${notifPayload.id}`;

  execAsync(command).catch((err) => {
    console.error(`Failed to send notification: ${err.message}`);
  });
}

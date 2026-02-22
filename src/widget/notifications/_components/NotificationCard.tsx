import Adw from "gi://Adw";
import AstalNotifd from "gi://AstalNotifd";
import Pango from "gi://Pango";
import { Gtk } from "ags/gtk4";
import { formatTime, isIconName, urgencyClass } from "../helpers";
import { fileExists } from "src/lib/session";

export interface NotificationCardProps {
  notification: AstalNotifd.Notification;
}

export default function NotificationCard({ notification: n }: NotificationCardProps) {
  const appIcon = n.appIcon || n.desktopEntry;
  const showAppIcon = Boolean(n.appIcon || isIconName(n.desktopEntry));

  const showImageFile = Boolean(n.image && fileExists(n.image));
  const showImageIcon = Boolean(n.image && isIconName(n.image));

  return (
    <Adw.Clamp maximumSize={400}>
      <box
        widthRequest={400}
        class={`Notification ${urgencyClass(n)}`}
        orientation={Gtk.Orientation.VERTICAL}
      >
        <box class="header">
          {showAppIcon && (
            <image
              class="app-icon"
              visible={Boolean(appIcon)}
              iconName={appIcon}
            />
          )}
          <label
            class="app-name"
            halign={Gtk.Align.START}
            ellipsize={Pango.EllipsizeMode.END}
            label={n.appName || "Unknown"}
          />
          <label
            class="time"
            hexpand
            halign={Gtk.Align.END}
            label={formatTime(n.time)}
          />
          <button onClicked={() => n.dismiss()}>
            <image iconName="window-close-symbolic" />
          </button>
        </box>
        <Gtk.Separator visible />
        <box class="content">
          {showImageFile && (
            <image
              valign={Gtk.Align.START}
              class="image"
              file={n.image as string}
            />
          )}
          {showImageIcon && (
            <box valign={Gtk.Align.START} class="icon-image">
              <image
                iconName={n.image as string}
                halign={Gtk.Align.CENTER}
                valign={Gtk.Align.CENTER}
              />
            </box>
          )}
          <box orientation={Gtk.Orientation.VERTICAL}>
            <label
              class="summary"
              halign={Gtk.Align.START}
              xalign={0}
              label={n.summary}
              ellipsize={Pango.EllipsizeMode.END}
            />
            {n.body && (
              <label
                class="body"
                wrap
                useMarkup
                halign={Gtk.Align.START}
                xalign={0}
                justify={Gtk.Justification.FILL}
                label={n.body}
              />
            )}
          </box>
        </box>
        {n.actions.length > 0 && (
          <box class="actions">
            {n.actions.map(({ label, id }) => (
              <button hexpand onClicked={() => n.invoke(id)}>
                <label label={label} halign={Gtk.Align.CENTER} hexpand />
              </button>
            ))}
          </box>
        )}
      </box>
    </Adw.Clamp>
  );
}

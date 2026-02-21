import { Gtk } from 'ags/gtk4'

export default function CountdownEmpty(): JSX.Element {
  return (
    <box class="countdown-slide" hexpand vexpand>
      <label label="No countdowns" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} hexpand vexpand />
    </box>
  )
}

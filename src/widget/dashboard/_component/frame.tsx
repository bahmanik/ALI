import { Gtk } from "ags/gtk4"

function Frame() {
  return (
    <box>
      <box hexpand vexpand orientation={Gtk.Orientation.VERTICAL}>
        <box hexpand class='test2 scale-start' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test3' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test4' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test5' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test6' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
      </box>

      <box hexpand vexpand orientation={Gtk.Orientation.VERTICAL}>
        <box hexpand class='test4' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test5' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test6' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test7' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test8' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
      </box>

      <box hexpand vexpand orientation={Gtk.Orientation.VERTICAL}>
        <box hexpand class='test5' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test6' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test7' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test8' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test10' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
      </box>

      <box hexpand vexpand orientation={Gtk.Orientation.VERTICAL}>
        <box hexpand class='test2' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test3' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test4' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test5' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test6' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
      </box>

      <box hexpand vexpand orientation={Gtk.Orientation.VERTICAL}>
        <box hexpand class='test7' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test8' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test9' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test10' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
        <box hexpand class='test1' vexpand orientation={Gtk.Orientation.HORIZONTAL}>lorem</box>
      </box>

    </box>
  )
}

export default Frame

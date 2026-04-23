import { Gtk } from "ags/gtk4";

export const Header = ({ title }: HeaderProps): JSX.Element => {
  return (
    <box class="options-header">
      <label class="label-name" label={title} />
      <Gtk.Separator class="menu-separator" valign={Gtk.Align.CENTER} hexpand />
    </box>
  );
};

interface HeaderProps {
  title: string;
}

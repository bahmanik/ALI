import { Gtk } from "ags/gtk4";
import { execAsync } from "ags/process";
import { Accessor } from "gnim";

export const Label = ({
  title: name,
  subtitle: sub = '',
  subtitleLink = '',
}: LabelSettingProps): JSX.Element => {
  const Subtitle = (): JSX.Element => {
    if (subtitleLink.length) {
      return (
        <button
          class="options-sublabel-link"
          onClicked={() => execAsync(`bash -c 'xdg-open ${subtitleLink}'`)}
          halign={Gtk.Align.START}
          valign={Gtk.Align.CENTER}
        >
          <label label={sub} />
        </button>
      );
    }
    return (
      <label
        class="options-sublabel"
        label={sub}
        halign={Gtk.Align.START}
        valign={Gtk.Align.CENTER}
      />
    );
  };

  return (
    <box halign={Gtk.Align.START} orientation={Gtk.Orientation.VERTICAL}>
      <label
        class="options-label"
        label={name}
        halign={Gtk.Align.START}
        valign={Gtk.Align.CENTER}
      />
      <Subtitle />
    </box>
  );
};

export interface LabelSettingProps {
  title: string;
  subtitle?: string | Accessor<string>;
  subtitleLink?: string;
}
export const PropertyLabel = ({ title, subtitle, subtitleLink }: LabelSettingProps): JSX.Element => {
  return (
    <box halign={Gtk.Align.START} valign={Gtk.Align.START} hexpand>
      <Label title={title} subtitle={subtitle} subtitleLink={subtitleLink} />
    </box>
  );
};

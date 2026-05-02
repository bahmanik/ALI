import { Gtk } from 'ags/gtk4';
import icons from 'src/lib/icons/icons';
import { Opt } from 'src/lib/options';

export const ResetButton = ({
  opt
}: { opt: Opt<any> }): JSX.Element => {
  return (
    <button
      class={'reset-options'}
      onClicked={() => {
        opt.reset();
      }}
      sensitive={opt.as((v) => v !== opt.initial)}
      valign={Gtk.Align.START}
    >
      <image iconName={icons.ui.refresh} />
    </button>
  );
};

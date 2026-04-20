import { Gtk } from 'ags/gtk4';
import { Opt } from 'src/lib/options';


export const ImageInputter = <T extends string | number | boolean | object>({
  opt,
}: ImageInputterProps<T>): JSX.Element => {
  return (
    <Gtk.FileChooserWidget
      onNotify={(self) => {

      }}
    />
  );
};

interface ImageInputterProps<T> {
  opt: Opt<T>;
}

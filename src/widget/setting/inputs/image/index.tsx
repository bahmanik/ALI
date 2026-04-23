import { Gtk } from 'ags/gtk4';
import { Opt } from 'src/lib/options';
import { ImageInputterProps } from '../types';

function ImageInputter<T extends string | number | boolean | object>({
  opt,
}: ImageInputterProps<T>): JSX.Element {
  return (
    <Gtk.FileChooserWidget
      onNotify={(self) => {

      }}
    />
  );
};

export default ImageInputter

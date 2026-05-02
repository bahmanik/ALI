import { Gtk } from 'ags/gtk4';
import { ImageInputterProps } from '../types';

function ImageInputter({
  opt,
}: ImageInputterProps): JSX.Element {
  return (
    <Gtk.FileChooserWidget
      onNotify={(self) => {

      }}
    />
  );
};

export default ImageInputter

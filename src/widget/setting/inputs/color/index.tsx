import { Gdk, Gtk } from 'ags/gtk4';
import { ColorInputterProps } from '../types';

function ColorInputter({
  opt,
}: ColorInputterProps): JSX.Element {
  return (
    <Gtk.ColorButton
      useAlpha={false}
      $={(self) => {

        //WARNING: you should hook this
        const rgba = new Gdk.RGBA();
        rgba.parse(opt.get());
        self.set_rgba(rgba);

        self.connect('color-set', () => {
          const rgba = self.get_rgba();
          const hex = (n: number): string => {
            const c = Math.floor(255 * n).toString(16);
            return c.length === 1 ? `0${c}` : c;
          };

          opt.set(`#${hex(rgba.red)}${hex(rgba.green)}${hex(rgba.blue)}`);
        });
      }}
    />
  );
};

export default ColorInputter

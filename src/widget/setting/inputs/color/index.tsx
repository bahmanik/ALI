import { Gdk, Gtk } from 'ags/gtk4';
import { ColorInputterProps } from '../types';
import { gdkToHex, numberToHex } from 'src/lib/units/color';
//WARNING: you should patch this so it uses a color class 
function ColorInputter({ opt }: ColorInputterProps): JSX.Element {
  return (
    <Gtk.ColorButton
      useAlpha={true}
      $={(self) => {
        const current = opt.get() as unknown;

        const rgba = new Gdk.RGBA();

        if (Array.isArray(current)) {
          const [r, g, b, a = 1] = current;
          rgba.red = r;
          rgba.green = g;
          rgba.blue = b;
          rgba.alpha = a;
          self.set_rgba(rgba);
        } else if (typeof current === 'string') {
          rgba.parse(current);
          self.set_rgba(rgba);
        }

        self.connect('color-set', () => {
          const picked = self.get_rgba();
          const next = gdkToHex(picked)
          numberToHex
          opt.set(next);
        });
      }}
    />
  );
}

export default ColorInputter;

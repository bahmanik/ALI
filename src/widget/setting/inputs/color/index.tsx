import { Gdk, Gtk } from 'ags/gtk4';
import { ColorInputterProps } from '../types';
import type { RGBA } from 'src/widget/shared/circularProgress/type';

//WARNING: you should patch this so it uses a color class 
function ColorInputter({ opt }: ColorInputterProps): JSX.Element {
  return (
    <Gtk.ColorButton
      useAlpha={false}
      $={(self) => {
        const current = opt.get() as unknown;

        const rgba = new Gdk.RGBA();

        if (Array.isArray(current)) {
          const [r, g, b, a = 1] = current as RGBA;
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
          const next: RGBA = [picked.red, picked.green, picked.blue, picked.alpha];
          opt.set(next as any);
        });
      }}
    />
  );
}

export default ColorInputter;

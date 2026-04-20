import { Gdk, Gtk } from 'ags/gtk4';
import { Opt } from 'src/lib/options';

export const ColorInputter = <T extends string | number | boolean | object>({
  opt,
}: ColorInputterProps<T>): JSX.Element => {
  return (
    <Gtk.ColorButton
      useAlpha={false}
      $={(self) => {

        //WARNING: you should hook this
        const rgba = new Gdk.RGBA();
        rgba.parse(opt.get() as string);
        self.set_rgba(rgba);

        self.connect('color-set', () => {
          const rgba = self.get_rgba();
          const hex = (n: number): string => {
            const c = Math.floor(255 * n).toString(16);
            return c.length === 1 ? `0${c}` : c;
          };

          opt.set(`#${hex(rgba.red)}${hex(rgba.green)}${hex(rgba.blue)}` as T);
        });
      }}
    />
  );
};

interface ColorInputterProps<T> {
  opt: Opt<T>;
}

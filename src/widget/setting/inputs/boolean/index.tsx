import { BooleanInputterProps } from '../types';

function BooleanInputter<T extends string | number | boolean | object>({
  opt, //WARNING: this should be boolean and i better cleanup this and other inputs
}: BooleanInputterProps<T>): JSX.Element {
  return (
    <switch
      active={opt.as(o => Boolean(o))}
      $={(self) => {
        self.connect('notify::active', () => {
          console.log("activate")
          opt.set(self.active as T)
        });
      }}
    />
  );
}

export default BooleanInputter

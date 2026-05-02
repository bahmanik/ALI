import { BooleanInputterProps } from '../types';

function BooleanInputter({
  opt
}: BooleanInputterProps): JSX.Element {
  return (
    <switch
      active={opt.as(o => Boolean(o))}
      $={(self) => {
        self.connect('notify::active', () => {
          console.log("activate")
          opt.set(self.active)
        });
      }}
    />
  );
}

export default BooleanInputter

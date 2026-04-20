import { Opt } from 'src/lib/options';

export const BooleanInputter = <T extends string | number | boolean | object>({
  opt,
}: BooleanInputterProps): JSX.Element => {
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

interface BooleanInputterProps {
  opt: Opt<boolean>;
}

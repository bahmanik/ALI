import icons from 'src/lib/icons/icons';
import { EnumInputterProps } from '../types';

function EnumInputter<T extends string | number | boolean | object>({
  opt,
  values,
}: EnumInputterProps<T>): JSX.Element {
  const step = (dir: 1 | -1): void => {
    const indexOfCurrentValue = values.findIndex((index) => index === opt.get());

    opt.set(
      dir > 0
        ? indexOfCurrentValue + dir > values.length - 1
          ? values[0]
          : values[indexOfCurrentValue + dir]
        : indexOfCurrentValue + dir < 0
          ? values[values.length - 1]
          : values[indexOfCurrentValue + dir],
    );
  };
  return (
    <box class={'enum-setter'}>
      <label label={opt.as((option) => `${option}`)} />
      <button
        onClicked={() => {
          step(-1);
        }}
      >
        <image iconName={icons.ui.arrow.left} />
      </button>
      <button
        onClicked={() => {
          step(+1);
        }}
      >
        <image iconName={icons.ui.arrow.right} />
      </button>
    </box>
  );
};

export default EnumInputter

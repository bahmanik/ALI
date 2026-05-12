import icons from 'src/lib/icons/icons';
import { EnumInputterProps } from '../types';

function EnumInputter<T extends string>({
  opt,
  values,
}: Required<EnumInputterProps<T>>): JSX.Element {
  const hasValues = values.length > 0

  const step = (dir: 1 | -1): void => {
    if (!hasValues) return

    const currentValue = opt.get()
    const indexOfCurrentValue = values.findIndex((value) => value === currentValue)
    const resolvedIndex = indexOfCurrentValue >= 0 ? indexOfCurrentValue : 0
    const nextIndex = (resolvedIndex + dir + values.length) % values.length

    opt.set(values[nextIndex])
  }

  return (
    <box class={'enum-setter'}>
      <label label={hasValues ? opt.as((option) => `${option}`) : 'No options'} />
      <button
        sensitive={hasValues}
        onClicked={() => {
          step(-1)
        }}
      >
        <image iconName={icons.ui.arrow.left} />
      </button>
      <button
        sensitive={hasValues}
        onClicked={() => {
          step(+1)
        }}
      >
        <image iconName={icons.ui.arrow.right} />
      </button>
    </box>
  )
}

export default EnumInputter

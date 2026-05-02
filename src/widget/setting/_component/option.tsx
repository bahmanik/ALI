import { Accessor, createState } from 'gnim';
import { LabelSettingProps, PropertyLabel } from './propertyLabel';
import { ResetButton } from './resetButton';
import Inputter from '../inputs';
import { InputterProps } from '../inputs/types';

export type OptionProps = {
  title: string;
  className?: string;
} & LabelSettingProps & InputterProps

export const Option = ({
  className,
  ...props
}: OptionProps): JSX.Element => {
  return (
    <box
      class="option-item"
      hexpand
      onDestroy={() => {
      }}
    >
      <PropertyLabel {...props} />
      <Inputter {...props} />
      <ResetButton {...props} />
    </box>
  );
};

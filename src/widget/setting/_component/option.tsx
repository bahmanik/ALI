import { Accessor } from 'gnim';
import { Opt } from 'src/lib/options';
import { Inputter } from './settingInput';
import { PropertyLabel } from './propertyLabel';
import { ResetButton } from './resetButton';

export interface LabelSettingProps {
  title: string;
  subtitle?: string | Accessor<string>;
  subtitleLink?: string;
}

export interface RowProps<T> {
  opt: Opt<T>;
  note?: string;
  type?: InputType;
  enums?: T[];
  max?: number;
  min?: number;
  disabledBinding?: Accessor<boolean>;
  subtitle?: LabelSettingProps['subtitle'];
  subtitleLink?: string;
  dependencies?: string[];
  increment?: number;
  fontLabel?: Opt<string>;
}

type InputType =
  | 'number'
  | 'color'
  | 'float'
  | 'object'
  | 'string'
  | 'enum'
  | 'boolean'
  | 'img'
  | 'image'

export const Option = <T extends string | number | boolean | object>({
  className,
  ...props
}: OptionProps<T>): JSX.Element => {
  return (
    <box
      class="option-item"
      hexpand
      onDestroy={() => {
        isUnsaved.drop();
      }}
    >
      <PropertyLabel title={props.title} subtitle={props.subtitle} subtitleLink={props.subtitleLink} />
      <Inputter isUnsaved={isUnsaved} className={className} {...props} />
      <ResetButton {...props} />
    </box>
  );
};

interface OptionProps<T> extends RowProps<T> {
  title: string;
  className?: string;
}

import { Accessor, Setter } from "gnim";
import { Opt } from "src/lib/options";

export type BooleanInputterProps<T> = {
  opt: Opt<T>;
}

export type ColorInputterProps<T> = {
  opt: Opt<T>;
}

export type EnumInputterProps<T> = {
  opt: Opt<T>;
  values: T[];
}

export type FloatInputterProps<T> = {
  opt: Opt<T>;
  isUnsaved: Accessor<boolean>
  setIsUnsaved: Setter<boolean>
}

export type ImageInputterProps<T> = {
  opt: Opt<T>;
}

export type NumberInputterProps<T> = {
  opt: Opt<T>
  min: number
  max: number
  increment?: number
  isUnsaved: Accessor<boolean>
  setIsUnsaved: Setter<boolean>
}

export type StringInputterProps<T> = {
  opt: Opt<T>;
  isUnsaved: Accessor<boolean>
  setIsUnsaved: Setter<boolean>
}

export interface InputterProps<T> {
  opt: Opt<T>;
  type?: InputType;
  note?: string;
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

export interface LabelSettingProps {
  title: string;
  subtitle?: string | Accessor<string>;
  subtitleLink?: string;
}

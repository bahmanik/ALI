import type { Accessor } from "gnim";
import type { HexColor } from "src/configuration/types";
import type { Opt } from "src/lib/options";

export type BooleanInputterProps = {
  opt: Opt<boolean>;
}

export type ColorInputterProps = {
  opt: Opt<HexColor>;
}

export type EnumInputterProps<T extends string = string> = {
  opt: Opt<T>;
  values?: readonly T[] | T[]
}

export type FloatInputterProps = {
  opt: Opt<number>;
}

export type ImageInputterProps = {
  opt: Opt<string>;
}

export type NumberInputterProps = {
  opt: Opt<number>
  min?: number
  max?: number
  increment?: number
}

export type StringInputterProps = {
  opt: Opt<string>;
}

export type KeybindInputterProps = {
  opt: Opt<string>;
}

type InputterBaseProps = {
  disabledBinding?: Accessor<boolean>;
}

//NOTE: EnumInputterProps<any> is intentional — Opt<T> is invariant due to Setter<T>
// being contravariant (gnim). Opt<AnchorLayoutType> cannot structurally satisfy
// Opt<string>, so <any> is the boundary escape hatch. EnumInputter<T> itself
// remains fully type-safe; the any does not leak into implementation.
export type InputterProps = (
  | { type: "boolean" } & BooleanInputterProps
  | { type: 'color' } & ColorInputterProps
  | { type: 'enum' } & EnumInputterProps<any>
  | { type: 'float' } & FloatInputterProps
  | { type: 'image' } & ImageInputterProps
  | { type: 'keybind' } & KeybindInputterProps
  | { type: 'number' } & NumberInputterProps
  | { type: 'string' } & StringInputterProps
) & InputterBaseProps

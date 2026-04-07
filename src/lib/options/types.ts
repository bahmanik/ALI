import { OptionsRoot } from 'src/lib/options/root';
import { Opt } from './opt';

export interface OptProps<T> {
    runtime?: boolean;
    scss?: boolean;
    hyprland?: boolean;
    derive?: ({ root }: { root: OptionsRoot }) => T;
    deps?: Paths<OptionsRoot>[];
}

export interface OptExports {
    scss?: boolean;
    hyprland?: boolean;
}

export interface MkOptionsResult {
    toArray: () => Opt[];
    reset: () => Promise<string>;
    handler: (optionsToWatch: string[], callback: () => void) => void;
}

export type OptionsObject = Record<string, unknown>;

export type Paths<T> = {
    [K in keyof T & string]:
    T[K] extends Opt<any>
    ? K
    : T[K] extends object
    ? K | `${K}.${Paths<T[K]>}`
    : never
}[keyof T & string]

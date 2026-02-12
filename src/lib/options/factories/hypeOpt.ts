import type { Opt, OptFactory } from "..";
import type { OptExports } from "../types";

export type EnabledPair<Root, Self, K extends string, T> =
    { [P in K]: Opt<T, Root, Self> } &
    { [P in `${K}_enable`]: Opt<boolean, Root, Self> };

export function hyprOpt<Root, Self, K extends string, T>(
    opt: OptFactory<Root, Self>,
    key: K,
    defaultValue: T,
    params?: {
        defaultEnable?: boolean;
        exports?: OptExports; // e.g. { scss: true }
    }
): EnabledPair<Root, Self, K, T> {
    const { defaultEnable = false, exports = {} } = params ?? {};

    return {
        [key]: opt(defaultValue, {
            ...exports,
            hyprland: true,
        }),
        [`${key}_enable`]: opt(defaultEnable),
    } as EnabledPair<Root, Self, K, T>;
}

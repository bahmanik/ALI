import { Opt, opt } from "..";
import type { OptExports } from "../types";

// Strongly-typed return: { gaps_in: Opt<number>, gaps_in_enable: Opt<boolean> }
export type EnabledPair<K extends string, T> =
    { [P in K]: Opt<T> } & { [P in `${K}_enable`]: Opt<boolean> };

export function hyprOpt<K extends string, T>(
    key: K,
    defaultValue: T,
    params?: {
        defaultEnable?: boolean;
        exports?: OptExports; // e.g. { scss: true } etc.
    },
): EnabledPair<K, T> {
    const { defaultEnable = false, exports = {} } = params ?? {};

    return {
        [key]: opt(defaultValue, {
            ...exports,
            hyprland: true, // <- makes HyprlandManager pick it up
        }),
        [`${key}_enable`]: opt(defaultEnable),
    } as EnabledPair<K, T>;
}

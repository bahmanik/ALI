import { dep } from "..";
import type { Opt, OptFactory } from "..";

export interface OverrideScale<Root, Self> {
    useLocalScale: Opt<boolean, Root, Self>;
    localScale: Opt<number, Root, Self>;
    scale: Opt<number, Root, Self>;
}

type HasGlobalScale<Root> = Root extends {
    global: { scale: Opt<number, Root, unknown> };
} ? Root : never;

export function overrideScale<Root, Self>(
    opt: OptFactory<HasGlobalScale<Root>, Self>,
    params: {
        defaultUseLocal?: boolean;
        defaultLocal: number;
        exports?: { scss?: boolean; hyprland?: boolean };
    }
): OverrideScale<HasGlobalScale<Root>, Self> {
    const { defaultUseLocal = false, defaultLocal, exports = {} } = params;

    const useLocalScale = opt(defaultUseLocal);
    const localScale = opt(defaultLocal);

    const scale = opt(defaultLocal, {
        ...exports,
        runtime: true,
        deps: [
            dep.root((r) => r.global.scale),
            dep.opt(useLocalScale),
            dep.opt(localScale),
        ],
        derive: ({ root }) =>
            useLocalScale.get() ? localScale.get() : root.global.scale.get(),
    });

    return { useLocalScale, localScale, scale };
}

import { dep } from "..";
import type { Opt, OptFactory } from "..";

export interface OverrideScale<_Root, _Self> {
    useLocalScale: Opt<boolean>;
    localScale: Opt<number>;
    scale: Opt<number>;
}

export function overrideScale<Root, Self>(
    opt: OptFactory<Root, Self>,
    params: {
        defaultUseLocal?: boolean;
        defaultLocal: number;
        exports?: { scss?: boolean; hyprland?: boolean };
    }
): OverrideScale<Root, Self> {
    const { defaultUseLocal = false, defaultLocal, exports = {} } = params;

    const useLocalScale = opt(defaultUseLocal);
    const localScale = opt(defaultLocal);

    const scale = opt(defaultLocal, {
        ...exports,
        runtime: true,
        deps: [
            // Root typing is provided by the injected module factory.
            // These factories are shared helpers, so we keep them permissive and
            // rely on the caller's Root type for correctness.
            dep.root((r: any) => r.global.scale),
            dep.opt(useLocalScale),
            dep.opt(localScale),
        ],
        derive: ({ root }) => {
            const g = (root as any).global;
            return useLocalScale.get() ? localScale.get() : g.scale.get();
        },
    });

    return { useLocalScale, localScale, scale };
}

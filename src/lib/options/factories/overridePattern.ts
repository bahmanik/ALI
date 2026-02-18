import { dep } from "..";
import type { Opt, OptFactory } from "..";
import type { OptExports, Pattern } from "../types";

export interface OverridePattern<_Root, _Self> {
    patternEnable: Opt<boolean>;
    useLocalPattern: Opt<boolean>;
    localPattern: Opt<Pattern>;

    patternPath: Opt<string>;
    patternSize: Opt<number>;
}

export function overridePattern<Root, Self>(
    opt: OptFactory<Root, Self>,
    params: {
        defaultUseLocal?: boolean;
        defaultEnable?: boolean;
        defaultLocal?: Pattern;
        exports?: { path?: OptExports; size?: OptExports };
    }
): OverridePattern<Root, Self> {
    const {
        defaultEnable = false,
        defaultUseLocal = false,
        defaultLocal = { path: "", size: 1 },
        exports = { path: { scss: true }, size: { scss: true } },
    } = params;

    const patternEnable = opt(defaultEnable);
    const useLocalPattern = opt(defaultUseLocal);
    const localPattern = opt<Pattern>(defaultLocal);

    const patternPath = opt<string>("", {
        ...(exports.path ?? {}),
        deps: [
            dep.root((r: any) => r.global.pattern),
            dep.opt(patternEnable),
            dep.opt(useLocalPattern),
            dep.opt(localPattern),
        ],
        derive: ({ root }) => {
            if (!patternEnable.get()) return "none";
            const g = (root as any).global;
            const p = useLocalPattern.get() ? localPattern.get() : g.pattern.get();
            return p.path;
        },
    });

    const patternSize = opt<number>(defaultLocal.size, {
        ...(exports.size ?? {}),
        deps: [
            dep.root((r: any) => r.global.pattern),
            dep.opt(useLocalPattern),
            dep.opt(localPattern),
        ],
        derive: ({ root }) => {
            const g = (root as any).global;
            const p = useLocalPattern.get() ? localPattern.get() : g.pattern.get();
            return p.size;
        },
    });

    return { patternEnable, useLocalPattern, localPattern, patternPath, patternSize };
}

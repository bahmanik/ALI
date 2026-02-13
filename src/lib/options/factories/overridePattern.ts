import type { Opt, OptFactory } from "..";
import { dep } from "..";
import type { OptExports, Pattern } from "../types";

export interface OverridePattern<Root, Self> {
    patternEnable: Opt<boolean, Root, Self>;
    useLocalPattern: Opt<boolean, Root, Self>;
    localPattern: Opt<Pattern, Root, Self>;

    patternPath: Opt<string, Root, Self>;
    patternSize: Opt<number, Root, Self>;
}

type HasGlobalPattern<Root> = Root extends {
    global: { pattern: Opt<Pattern, Root, unknown> };
} ? Root : never;

export function overridePattern<Root, Self>(
    opt: OptFactory<HasGlobalPattern<Root>, Self>,
    params: {
        widgetId: string;
        defaultUseLocal?: boolean;
        defaultEnable?: boolean;
        defaultLocal?: Pattern;
        exports?: { path?: OptExports; size?: OptExports };
    }
): OverridePattern<HasGlobalPattern<Root>, Self> {
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
            dep.root((r) => r.global.pattern),
            dep.opt(patternEnable),
            dep.opt(useLocalPattern),
            dep.opt(localPattern),
        ],
        derive: ({ root }) => {
            if (!patternEnable.get()) return "none";
            const p = useLocalPattern.get() ? localPattern.get() : root.global.pattern.get();
            return p.path;
        },
    });

    const patternSize = opt<number>(defaultLocal.size, {
        ...(exports.size ?? {}),
        deps: [
            dep.root((r) => r.global.pattern),
            dep.opt(useLocalPattern),
            dep.opt(localPattern),
        ],
        derive: ({ root }) => {
            const p = useLocalPattern.get() ? localPattern.get() : root.global.pattern.get();
            return p.size;
        },
    });

    return { patternEnable, useLocalPattern, localPattern, patternPath, patternSize };
}

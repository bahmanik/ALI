import { opt } from "..";
import type { OptExports, Pattern } from "../types";

const at = (o: any, path: string) =>
    path.split('.').reduce((acc: any, key: string) => acc?.[key], o);

export function overridePattern(params: {
    widgetId: string;                  // "bar", "launcher", ...
    defaultUseLocal?: boolean;         // default: false (inherit global)
    defaultenable?: boolean;           // default: no pattern
    defaultLocal?: Pattern;            // used only if local is enabled
    exports?: { path?: OptExports; size?: OptExports }; // scss flags for primitives
}) {
    const {
        widgetId,
        defaultenable = false,
        defaultUseLocal = false,
        defaultLocal = { path: "", size: 1 },
        exports = { path: { scss: true }, size: { scss: true } },
    } = params;

    return {
        patternEnable: opt(defaultenable),
        useLocalPattern: opt(defaultUseLocal),
        localPattern: opt<Pattern>(defaultLocal),

        // Effective primitives for SCSS
        patternPath: opt<string>("", {
            ...(exports.path ?? {}),
            deps: ["global.pattern", `${widgetId}.patternEnable`, `${widgetId}.useLocalPattern`, `${widgetId}.localPattern`],
            derive: (o: any) => {
                const w = at(o, widgetId);
                if (w.patternEnable.value) {
                    if (w.useLocalPattern.value) {
                        return w.localPattern.value.path;
                    } else {
                        return o.global.pattern.value.path;
                    }
                } else {
                    return "none"; // Return 'none' if pattern is not enabled
                }
            },
        }),

        patternSize: opt<number>(defaultLocal.size, {
            ...(exports.size ?? {}),
            deps: ["global.pattern", `${widgetId}.useLocalPattern`, `${widgetId}.localPattern`],
            derive: (o: any) => {
                const w = at(o, widgetId);
                return w.useLocalPattern.value
                    ? w.localPattern.value.size
                    : o.global.pattern.value.size;
            },
        }),
    };
}

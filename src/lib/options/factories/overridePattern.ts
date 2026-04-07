import { Pattern } from "src/configuration/types";
import { opt } from "..";
import type { OptExports } from "../types";
import { OptionsRoot } from "src/lib/options/root";

const at = (o: any, path: string) =>
    path.split('.').reduce((acc: any, key: string) => acc?.[key], o);

export function overridePattern(params: {
    widgetId: string;                  // "bar", "launcher", ...
    defaultUseLocal?: boolean;         // default: false (inherit global)
    defaultEnable?: boolean;           // default: no pattern
    defaultLocal?: Pattern;            // used only if local is enabled
    exports?: { path?: OptExports; size?: OptExports }; // scss flags for primitives
}) {
    const {
        widgetId,
        defaultEnable = false,
        defaultUseLocal = false,
        defaultLocal = { path: "", size: 1 },
        exports = { path: { scss: true }, size: { scss: true } },
    } = params;

    return {
        patternEnable: opt(defaultEnable),
        useLocalPattern: opt(defaultUseLocal),
        localPattern: opt<Pattern>(defaultLocal),

        // Effective primitives for SCSS
        patternPath: opt<string>("", {
            ...(exports.path ?? {}),
            deps: ["global.pattern", `${widgetId}.patternEnable`, `${widgetId}.useLocalPattern`, `${widgetId}.localPattern`],
            derive: ({ root }) => {
                const w = at(root, widgetId);
                if (w.patternEnable.value) {
                    if (w.useLocalPattern.value) {
                        return w.localPattern.value.path;
                    } else {
                        return root.global.pattern.value.path;
                    }
                } else {
                    return "none"; // Return 'none' if pattern is not enabled
                }
            },
        }),

        patternSize: opt<number>(defaultLocal.size, {
            ...(exports.size ?? {}),
            deps: ["global.pattern", `${widgetId}.useLocalPattern`, `${widgetId}.localPattern`],
            derive: ({ root }: { root: OptionsRoot }) => {
                const w = at(root, widgetId);
                return w.useLocalPattern.value
                    ? w.localPattern.value.size
                    : root.global.pattern.value.size;
            },
        }),
    };
}

import { opt } from "..";
import type { OptExports } from "../types";

const at = (o: any, path: string) =>
    path.split('.').reduce((acc: any, key: string) => acc?.[key], o);

export function overrideScale(params: {
    widgetId: string;              // "bar", "launcher", ...
    defaultUseLocal?: boolean;
    defaultLocal?: number;
    exports?: OptExports;          // typically { scss: true }
}) {
    const {
        widgetId,
        defaultUseLocal = false,
        defaultLocal,
        exports = {},
    } = params;

    return {
        useLocalScale: opt(defaultUseLocal),
        localScale: opt(defaultLocal),

        // Effective (derived) scale used by the widget
        scale: opt(defaultLocal, {
            ...exports,
            runtime: true, // derived/runtime-only in your engine semantics
            deps: [
                "global.scale",
                `${widgetId}.useLocalScale`,
                `${widgetId}.localScale`,
            ],
            derive: (o: any) => {
                const w = at(o, widgetId);
                return w.useLocalScale.value
                    ? w.localScale.value
                    : o.global.scale.value;
            },
        }),
    };
}

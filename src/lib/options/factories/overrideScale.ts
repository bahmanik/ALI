import { Opt, opt } from "..";
import type { OptExports } from "../types";

const at = (o: any, path: string) =>
    path.split('.').reduce((acc: any, key: string) => acc?.[key], o);

export function overrideScale(params: {
    widgetId: string;
    defaultLocal: number;          // required — callers always supply a concrete value
    defaultUseLocal?: boolean;
    exports?: OptExports;
}) {
    const {
        widgetId,
        defaultLocal,
        defaultUseLocal = false,
        exports = {},
    } = params;

    return {
        useLocalScale: opt(defaultUseLocal),
        localScale: opt(defaultLocal),

        scale: opt(defaultLocal, {
            ...exports,
            runtime: true,
            deps: [
                "global.scale",
                `${widgetId}.useLocalScale`,
                `${widgetId}.localScale`,
            ],
            derive: ({ root }) => {
                const w = at(root, widgetId);
                return w.useLocalScale.value
                    ? w.localScale.value
                    : root.global.scale.value;
            },
        }),
    };
}

/** The shape produced by overrideScale — use this in widget Option interfaces. */
export type OverrideScaleResult = {
    useLocalScale: Opt<boolean>,
    localScale: Opt<number>,
    scale: Opt<number>
}

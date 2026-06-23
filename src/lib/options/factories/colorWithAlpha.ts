import { ColorWithAlpha, HexColor } from "src/configuration/types";
import { opt } from "..";
import type { OptExports } from "../types";

export function colorWithAlpha(params?: {
    color?: HexColor;
    alpha?: number;
    exports?: OptExports;
}): ColorWithAlpha {

    const c = params!.color ?? "#000000"
    const a = params!.alpha ?? 1
    const e = params!.exports ?? { scss: true }

    return {
        color: opt<HexColor>(c, e),
        alpha: opt(a, e)
    };
}

/** The shape produced by overrideScale — use this in widget Option interfaces. */
export type OverrideScaleResult = ReturnType<typeof colorWithAlpha>;

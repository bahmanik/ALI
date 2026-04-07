import { opt } from "..";
import type { ImageTechnique, OptExports } from "../types";

const at = (o: any, path: string) =>
    path.split('.').reduce((acc: any, key: string) => acc?.[key], o);

/**
 * "Override" factory for a single image path that normally inherits from the global wallpaper.
 *
 * - If useLocalOuterImage=false => outerImage derives from display.wallpaper.file
 * - If useLocalOuterImage=true  => outerImage derives from localOuterImage
 *
 * Additionally exposes an ImageMagick-style technique selector.
 * (Actual processing is done by widgets/services; this factory only provides configuration.)
 */
export function overrideImage(params: {
    widgetId: string; // e.g. "corner"
    defaultUseLocal?: boolean;
    defaultLocal?: string;
    defaultEnableTechnique?: boolean;
    defaultTechnique?: ImageTechnique;
    exports?: { outerImage?: OptExports };
}) {
    const {
        widgetId,
        defaultUseLocal = false,
        defaultLocal = "",
        defaultEnableTechnique = false,
        defaultTechnique = "none",
        exports = { outerImage: { scss: true } },
    } = params;

    return {
        useLocalOuterImage: opt(defaultUseLocal),
        localOuterImage: opt<string>(defaultLocal),

        enableTechnique: opt(defaultEnableTechnique),
        technique: opt<ImageTechnique>(defaultTechnique),

        // Effective image path
        outerImage: opt<string>("", {
            ...(exports.outerImage ?? {}),
            deps: ["display.wallpaper.file", `${widgetId}.useLocalOuterImage`, `${widgetId}.localOuterImage`],
            derive: ({ root }) => {
                const w = at(root, widgetId);
                return w.useLocalOuterImage.value
                    ? w.localOuterImage.value
                    : root.display.wallpaper.file.value;
            },
        }),
    };
}

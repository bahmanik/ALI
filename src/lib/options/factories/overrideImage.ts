import type { Opt, OptFactory } from "..";
import type { ImageTechnique, OptExports } from "../types";

export interface OverrideImage<Root, Self> {
    useLocalOuterImage: Opt<boolean, Root, Self>;
    localOuterImage: Opt<string, Root, Self>;

    enableTechnique: Opt<boolean, Root, Self>;
    technique: Opt<ImageTechnique, Root, Self>;

    outerImage: Opt<string, Root, Self>;
}

type HasDisplayWallpaperFile<Root> = Root extends {
    display: { wallpaper: { file: Opt<string, Root, unknown> } };
} ? Root : never;

export function overrideImage<Root, Self>(
    opt: OptFactory<HasDisplayWallpaperFile<Root>, Self>,
    params: {
        widgetId: string;
        defaultUseLocal?: boolean;
        defaultLocal?: string;
        defaultEnableTechnique?: boolean;
        defaultTechnique?: ImageTechnique;
        exports?: { outerImage?: OptExports };
    }
): OverrideImage<HasDisplayWallpaperFile<Root>, Self> {
    const {
        widgetId,
        defaultUseLocal = false,
        defaultLocal = "",
        defaultEnableTechnique = false,
        defaultTechnique = "none",
        exports = { outerImage: { scss: true } },
    } = params;

    const useLocalOuterImage = opt(defaultUseLocal);
    const localOuterImage = opt<string>(defaultLocal);

    const enableTechnique = opt(defaultEnableTechnique);
    const technique = opt<ImageTechnique>(defaultTechnique);

    const outerImage = opt<string>("", {
        ...(exports.outerImage ?? {}),
        deps: [
            "display.wallpaper.file",
            `${widgetId}.useLocalOuterImage`,
            `${widgetId}.localOuterImage`,
        ],
        derive: ({ root }) =>
            useLocalOuterImage.get()
                ? localOuterImage.get()
                : root.display.wallpaper.file.get(),
    });

    return { useLocalOuterImage, localOuterImage, enableTechnique, technique, outerImage };
}

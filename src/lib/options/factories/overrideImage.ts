import { dep } from "..";
import type { Opt, OptFactory } from "..";
import type { ImageTechnique, OptExports } from "../types";

export interface OverrideImage<_Root, _Self> {
    useLocalOuterImage: Opt<boolean>;
    localOuterImage: Opt<string>;

    enableTechnique: Opt<boolean>;
    technique: Opt<ImageTechnique>;

    outerImage: Opt<string>;
}

export function overrideImage<Root, Self>(
    opt: OptFactory<Root, Self>,
    params: {
        defaultUseLocal?: boolean;
        defaultLocal?: string;
        defaultEnableTechnique?: boolean;
        defaultTechnique?: ImageTechnique;
        exports?: { outerImage?: OptExports };
    }
): OverrideImage<Root, Self> {
    const {
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
            dep.root((r: any) => r.display.wallpaper.file),
            dep.opt(useLocalOuterImage),
            dep.opt(localOuterImage),
        ],
        derive: ({ root }) => {
            const d = (root as any).display;
            return useLocalOuterImage.get()
                ? localOuterImage.get()
                : d.wallpaper.file.get();
        },
    });

    return { useLocalOuterImage, localOuterImage, enableTechnique, technique, outerImage };
}

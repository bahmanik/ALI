export const TransitionPosValues = [
    "cursor",
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
]

export const TransitionTypeValues = [
    "none",
    "simple",
    "fade",
    "left",
    "right",
    "top",
    "bottom",
    "wipe",
    "wave",
    "grow",
    "center",
    "any",
    "outer",
    "random"
];

export const WallpaperLayoutValues = [
    "background", "bottom"
]

export type WallpaperLayoutType = (typeof WallpaperLayoutValues)[number]
export type TransitionPosType = (typeof TransitionPosValues)[number]
export type TransitionType = (typeof TransitionTypeValues)[number]

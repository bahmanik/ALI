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

export const WallpaperLayoutValues = [
    "background", "bottom"
]

export type WallpaperLayoutType = (typeof WallpaperLayoutValues)[number]
export type TransitionPosType = (typeof TransitionPosValues)[number]

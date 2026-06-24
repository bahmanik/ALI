export const ThemeModeValues = ["dark", "light"];

export const MatugenResizeFilterValues = [
    "nearest",
    "triangle",
    "catmull-rom",
    "gaussian",
    "lanczos3",
    "none"
];

export const MatugenValues = [
    "scheme-tonal-spot",
    "scheme-neutral",
    "scheme-vibrant",
    "scheme-expressive",
    "scheme-content",
    "scheme-fidelity"
];

export type MatugenResizeFilterType = (typeof MatugenResizeFilterValues)[number]
export type ThemeModeType = (typeof ThemeModeValues)[number]
export type MatugenType = (typeof MatugenValues)[number]

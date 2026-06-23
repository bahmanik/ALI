export const BarLocationValues = ["top", "bottom", "left", "right"];
export const BorderLocationValue = [
    "none",
    "full",
    "top",
    "bottom",
    "left",
    "right",
    "horizontal",
    "vertical"
];

export type BorderLocationType = (typeof BorderLocationValue)[number]
export type BarLocationType = (typeof BarLocationValues)[number]

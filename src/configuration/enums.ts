export const BarLocationValues = ["top", "bottom", "left", "right"];
/** Names mapped to Gtk.RevealerTransitionType (GTK4). */
export const GtkRevealerTransitionValues = [
    "NONE",
    "CROSSFADE",
    "SLIDE_RIGHT",
    "SLIDE_LEFT",
    "SLIDE_UP",
    "SLIDE_DOWN",
    "SWING_RIGHT",
    "SWING_LEFT",
    "SWING_UP",
    "SWING_DOWN"
]

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

export const StackTransitionValues = [
    "NONE",
    "CROSSFADE",
    "SLIDE_RIGHT",
    "SLIDE_LEFT",
    "SLIDE_UP",
    "SLIDE_DOWN",
    "SLIDE_LEFT_RIGHT",
    "SLIDE_UP_DOWN",
    "OVER_UP",
    "OVER_DOWN",
    "OVER_LEFT",
    "OVER_RIGHT",
    "UNDER_UP",
    "UNDER_DOWN",
    "UNDER_LEFT",
    "UNDER_RIGHT",
    "OVER_UP_DOWN",
    "OVER_DOWN_UP",
    "OVER_LEFT_RIGHT",
    "OVER_RIGHT_LEFT",
    "ROTATE_LEFT",
    "ROTATE_RIGHT",
    "ROTATE_LEFT_RIGH",
];

export type BorderLocationType = (typeof BorderLocationValue)[number]
export type StackTransitionType = (typeof StackTransitionValues)[number]
export type GtkRevealerTransitionType = (typeof GtkRevealerTransitionValues)[number]
export type RevealTransitionWithAuto = "AUTO" | GtkRevealerTransitionType;
export type BarLocationType = (typeof BarLocationValues)[number]

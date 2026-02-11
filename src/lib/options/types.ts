import { Opt } from './opt';

export interface OptProps {
    runtime?: boolean;
    scss?: boolean;
    hyprland?: boolean;
    derive?: (opts: any) => any;
    deps?: string[];
}

export interface OptProps {
    runtime?: boolean;
    scss?: boolean;
    hyprland?: boolean;
    derive?: (opts: any) => any;
    deps?: string[];
}

export interface OptExports {
    scss?: boolean;
    hyprland?: boolean;
}

export type Pattern = {
    path: string;
    size: number;
}

export interface MkOptionsResult {
    toArray: () => Opt[];
    reset: () => Promise<string>;
    handler: (optionsToWatch: string[], callback: () => void) => void;
}

export type OptionsObject = Record<string, unknown>;

export type TransitionType =
    | "none"
    | "simple"
    | "fade"
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "wipe"
    | "wave"
    | "grow"
    | "center"
    | "any"
    | "outer"
    | "random"

export type TransitionPos =
    | "cursor"
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"

export type BarLocation = 'top' | 'bottom' | 'left' | 'right';
export type OverrideMode = "local" | "global";

// ImageMagick-style techniques we might apply to an image before using it in widgets.
// Keep these as simple strings so they serialize cleanly in config.json.
export type ImageTechnique =
    | "none"
    | "negative"
    | "grayscale"
    | "sepia";

export type HexColor = `#${string}`;

export type weekDays = "Sun" | "Mon" | "Tues" | "Wed" | "thurs" | "Fri" | "Sat"
export type calendar = "Gregorian" | "Jalali" | "Hijri"

export type LauncherRevealTransition =
    | "SWING_DOWN"
    | "SLIDE_DOWN"
    | "SLIDE_UP"
    | "CROSSFADE"
    | "NONE"

export type ThemeMode = "dark" | "light";

export type MatugenType =
    | "scheme-tonal-spot"
    | "scheme-neutral"
    | "scheme-vibrant"
    | "scheme-expressive"
    | "scheme-content"
    | "scheme-fidelity"

export type MatugenResizeFilter =
    | "nearest"
    | "triangle"
    | "catmull-rom"
    | "gaussian"
    | "lanczos3"
    | "none"

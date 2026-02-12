import type { Opt } from "./opt";

export type DeriveCtx<Root, Self> = {
    root: Root;
    self: Self;
};

/**
 * IMPORTANT: Bivariant callback type.
 *
 * Why: OptionRegistry stores Opts in arrays typed with generic defaults like
 * Opt<unknown, unknown, unknown>. Without bivariant derive, TS refuses assigning
 * Opt<unknown, T, unknown> to Opt<unknown, unknown, unknown> because function
 * parameter types are contravariant (root: T vs root: unknown).
 *
 * This keeps runtime identical, and stays fully type-safe at call sites.
 */
export type Derive<Root, Self, T> = {
    bivarianceHack(ctx: DeriveCtx<Root, Self>): T;
}["bivarianceHack"];

export interface OptProps<Root = unknown, Self = unknown, T = unknown> {
    runtime?: boolean;
    scss?: boolean;
    hyprland?: boolean;

    derive?: Derive<Root, Self, T>;
    deps?: string[];
}

export interface OptExports {
    scss?: boolean;
    hyprland?: boolean;
}

export type OptionsObject = object

/**
 * The opt() factory injected into modules.
 */
export type OptFactory<Root, Self> = <T>(
    initial: T,
    props?: OptProps<Root, Self, T>
) => Opt<T, Root, Self>;

export type ModuleFactory<Root, Self> = (opt: OptFactory<Root, Self>) => Self;

export interface MkOptionsResult {
    toArray: () => Opt[];
    reset: () => Promise<string>;
    handler: (optionsToWatch: string[], callback: () => void) => void;
}

export type Pattern = { path: string; size: number };

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
    | "random";

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
    | "bottom-right";

export type BarLocation = "top" | "bottom" | "left" | "right";
export type OverrideMode = "local" | "global";

export type ImageTechnique = "none" | "negative" | "grayscale" | "sepia";
export type HexColor = `#${string}`;

export type weekDays = "Sun" | "Mon" | "Tues" | "Wed" | "thurs" | "Fri" | "Sat";
export type calendar = "Gregorian" | "Jalali" | "Hijri";

export type LauncherRevealTransition =
    | "SWING_DOWN"
    | "SLIDE_DOWN"
    | "SLIDE_UP"
    | "CROSSFADE"
    | "NONE";

export type ThemeMode = "dark" | "light";

export type MatugenType =
    | "scheme-tonal-spot"
    | "scheme-neutral"
    | "scheme-vibrant"
    | "scheme-expressive"
    | "scheme-content"
    | "scheme-fidelity";

export type MatugenResizeFilter =
    | "nearest"
    | "triangle"
    | "catmull-rom"
    | "gaussian"
    | "lanczos3"
    | "none";

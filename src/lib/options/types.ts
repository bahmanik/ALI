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

/**
 * A lightweight, assignment-safe reference shape for Opt instances.
 *
 * Why: Opt<T> is invariant in T (because it contains a private setter that
 * consumes T). That makes Opt<boolean> not assignable to Opt<unknown>.
 *
 * For deps we only need to carry around an Opt *reference* at runtime. So we
 * type deps in terms of this minimal shape, while still requiring callers to
 * select real Opts (they have id + get()).
 */
export type OptRef<T = unknown> = {
    readonly id: string;
    get(): T;
};

export type DepCtx<Root, Self> = DeriveCtx<Root, Self>;

export type DepPrefix = {
    kind: "prefix";
    prefix: string;
};

export type DepSubtree = {
    kind: "subtree";
    node: Record<string, unknown>;
};

export type DepInput = OptRef | DepPrefix | DepSubtree;

/**
 * IMPORTANT: Bivariant callback type (same reason as Derive).
 */
export type DepResolver<Root, Self> = {
    bivarianceHack(ctx: DepCtx<Root, Self>): DepInput;
}["bivarianceHack"];

export type DepRef<Root, Self> = {
    resolve: DepResolver<Root, Self>;
};

export interface OptProps<Root = unknown, Self = unknown, T = unknown> {
    runtime?: boolean;
    scss?: boolean;
    hyprland?: boolean;

    derive?: Derive<Root, Self, T>;
    deps?: DepRef<Root, Self>[];
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
export type BarBorderLocation =
    | "none"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "horizontal"
    | "vertical"
    | "full";
export type OverrideMode = "local" | "global";

export type ImageTechnique = "none" | "negative" | "grayscale" | "sepia";
export type HexColor = `#${string}`;
export type CornerFill = "image" | "solid" | "pattern";

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

// -----------------------------------------------------------------------------
// Shared layout + transitions (GTK4 widgets)
// -----------------------------------------------------------------------------

/**
 * Shared layout names used by popup-like widgets (Launcher/OSD).
 *
 * We accept both HyprPanel-style "top-left" and internal underscore variants
 * ("top_left") to avoid duplicating enums across subsystems.
 */
export type AnchorLayout =
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "center"
    | "full"
    | "top_left"
    | "top_center"
    | "top_right"
    | "bottom_left"
    | "bottom_center"
    | "bottom_right";

/** Names mapped to Gtk.RevealerTransitionType (GTK4). */
export type GtkRevealerTransitionName =
    | "NONE"
    | "CROSSFADE"
    | "SLIDE_RIGHT"
    | "SLIDE_LEFT"
    | "SLIDE_UP"
    | "SLIDE_DOWN"
    | "SWING_RIGHT"
    | "SWING_LEFT"
    | "SWING_UP"
    | "SWING_DOWN";

export type OsdOrientation = "vertical" | "horizontal";

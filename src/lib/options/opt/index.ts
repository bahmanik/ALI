import { ConfigManager } from "../configManager";
import type { DepRef, Derive, OptExports, OptRef } from "../types";
import { createState } from "gnim";
import type { Accessor } from "gnim";

// -----------------------------------------------------------------------------
// Public runtime Opt type
// -----------------------------------------------------------------------------

export interface Opt<T = unknown> extends OptRef<T> {
    get(): T;
    set(v: T): void;

    /** Map this option's value into a reactive Accessor (usable in JSX bindings). */
    as<R>(transform: (value: T) => R): Accessor<R>;

    /** Subscribe to runtime value changes. */
    subscribe(cb: () => void): () => void;

    /** Reset to initial value (no-op for derived/runtime opts). */
    reset(writeOptions?: { writeDisk?: boolean }): string | undefined;

    /** Initialize from disk config (no-op for derived opts). */
    init(config: Record<string, unknown>): void;

    /** Optional exports used by theming / integrations. */
    readonly exports: OptExports;

    /** Whether this option is runtime-only (not persisted). */
    readonly runtime: boolean;
}

// -----------------------------------------------------------------------------
// Internal implementation
// -----------------------------------------------------------------------------

type WriteOptions = { writeDisk?: boolean };

export class OptImpl<T = unknown> implements Opt<T> {
    public readonly initial: T;
    public readonly runtime: boolean;
    public readonly exports: OptExports;

    /** Internal: stored as bivariant unknown-ctx for registry assignment safety. */
    public readonly derive?: Derive<unknown, unknown, T>;

    /** Internal: dependency resolvers (ctx is unknown-typed inside registry). */
    public readonly deps: readonly DepRef<unknown, unknown>[];

    private _id = "";
    private _selfRef: unknown | undefined;

    private _configManager: ConfigManager;
    private _accessor: Accessor<T>;
    private _setter: (v: T) => void;

    constructor(
        initial: T,
        configManager: ConfigManager,
        cfg?: unknown
    ) {
        const c = (typeof cfg === "object" && cfg !== null ? (cfg as Record<string, unknown>) : {}) as {
            runtime?: boolean;
            scss?: boolean;
            hyprland?: boolean;
            derive?: unknown;
            deps?: unknown;
        };

        const runtime = (c.runtime as boolean | undefined) ?? false;
        const scss = (c.scss as boolean | undefined) ?? false;
        const hyprland = (c.hyprland as boolean | undefined) ?? false;
        const derive = typeof c.derive === "function" ? (c.derive as (ctx: { root: unknown; self: unknown }) => T) : undefined;
        const deps = (Array.isArray(c.deps) ? (c.deps as readonly DepRef<unknown, unknown>[]) : []) as readonly DepRef<unknown, unknown>[];

        this.initial = initial;

        const isDerived = typeof derive === "function";
        this.runtime = isDerived ? true : runtime;

        this.derive = (derive as unknown as Derive<unknown, unknown, T>) ?? undefined;
        this.deps = isDerived ? deps : [];

        this._configManager = configManager;
        const [accessor, setter] = createState(initial);
        this._accessor = accessor;
        this._setter = setter;

        this.exports = {
            scss: scss ?? false,
            hyprland: hyprland ?? false,
        };
    }

    public get(): T {
        return this._accessor();
    }

    public as<R>(transform: (value: T) => R): Accessor<R> {
        return this._accessor(transform);
    }

    public set(value: T, writeOptions: WriteOptions = {}): void {
        const requestedWriteDisk = writeOptions.writeDisk ?? true;
        const writeDisk = this.derive ? false : requestedWriteDisk;

        if (Object.is(value, this._accessor())) return;
        this._setter(value);

        if (writeDisk && !this.runtime) {
            this._configManager.updateOption(this._id, value);
        }
    }

    public subscribe(cb: () => void): () => void {
        return this._accessor.subscribe(cb);
    }

    public get value(): T {
        return this.get();
    }

    public set value(val: T) {
        this.set(val);
    }

    public get id(): string {
        return this._id;
    }

    public set id(newId: string) {
        this._id = newId;
    }

    /** Internal: set by OptionRegistry during collection (used for derive({ self })). */
    public set selfRef(ref: unknown | undefined) {
        this._selfRef = ref;
    }

    /** Internal: read by OptionRegistry. */
    public get selfRef(): unknown | undefined {
        return this._selfRef;
    }

    public init(config: Record<string, unknown>): void {
        // Derived options never read from disk.
        if (this.derive) return;

        const value = this._configManager.getNestedValue(config, this._id);
        if (value !== undefined) this._setter(value as unknown as T);
    }

    public reset(writeOptions: WriteOptions = {}): string | undefined {
        if (this.runtime || this.derive) return;

        const current = JSON.stringify(this._accessor());
        const initial = JSON.stringify(this.initial);
        if (current !== initial) {
            this.set(this.initial, writeOptions);
            return this._id;
        }

        return;
    }
}

export function isOpt(value: unknown): value is OptImpl<unknown> {
    return value instanceof OptImpl;
}

import { createState } from 'gnim';
import { ConfigManager } from '../configManager';
import { OptExports, OptProps } from '../types';

type WriteOptions = {
    writeDisk?: boolean;
}

export class Opt<T = unknown> {
    public readonly initial: T;
    public readonly runtime: boolean;
    public readonly exports: OptExports;
    public readonly derive?: (opts: any) => T;

    private _id = '';
    private _configManager: ConfigManager;
    private _accessor: ReturnType<typeof createState<T>>[0];
    private _setter: ReturnType<typeof createState<T>>[1];

    /**
     * Dependency prefixes for derived options.
     * When any option whose id starts with one of these prefixes changes,
     * the registry recomputes this option.
     */
    public readonly deps: string[];
    constructor(
        initial: T,
        configManager: ConfigManager,
        {
            runtime = false,
            scss = false,
            hyprland = false,
            derive,
            deps = [],
        }: OptProps<T> = {},
    ) {
        this.initial = initial;

        const isDerived = typeof derive === 'function';

        // Derived options are runtime-computed; never persist to disk.
        this.runtime = isDerived ? true : runtime;

        this.derive = derive;
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

    // Make Opt work like Accessor in JSX
    public as<R>(transform: (value: T) => R): any {
        return this._accessor(transform);
    }

    // Standard methods
    public get(): T {
        return this._accessor.peek();
    }

    public set(value: T, writeOptions: WriteOptions = {}): void {
        const requestedWriteDisk = writeOptions.writeDisk ?? true;
        const writeDisk = this.derive ? false : requestedWriteDisk;

        if (value === this._accessor.peek()) return;
        this._setter(value);

        if (writeDisk && !this.runtime) {
            this._configManager.updateOption(this._id, value);
        }
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


    public init(config: Record<string, unknown>): void {
        // Derived options never read from disk.
        if (this.derive) return;

        const value = this._configManager.getNestedValue(config, this._id);
        if (value !== undefined) this._setter(value as T);
    }


    public reset(writeOptions: WriteOptions = {}): string | undefined {
        if (this.runtime || this.derive) return;

        const current = JSON.stringify(this._accessor.peek());
        const initial = JSON.stringify(this.initial);
        if (current !== initial) {
            this.set(this.initial, writeOptions);
            return this._id;
        }
        return;
    }

    // Delegate to real accessor for full compatibility
    public subscribe(callback: () => void) {
        return this._accessor.subscribe(callback);
    }
}

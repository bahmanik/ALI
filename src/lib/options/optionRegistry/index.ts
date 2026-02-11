import { Opt } from '../opt';
import { ConfigManager } from '../configManager';
import { MkOptionsResult, OptionsObject } from '../types';
import { errorHandler } from 'src/lib/errors/handler';

/**
 * Creates and manages a registry of application options
 *
 * Provides functionality to collect, initialize, reset, and track options throughout
 * the application. Handles configuration synchronization and dependency-based subscriptions.
 */
export class OptionRegistry<T extends OptionsObject> {
    private _options: Opt[] = [];
    private _optionsObj: T;
    private _configManager: ConfigManager;

    // Derived (computed) options
    private _derived: Opt[] = [];
    private _derivedOrder: Opt[] = [];
    private _derivedRecomputeScheduled = false;

    /**
     * Creates a new option registry
     *
     * @param optionsObj - The object containing option definitions
     * @param configManager - The configuration manager to handle persistence
     */
    constructor(optionsObj: T, configManager: ConfigManager) {
        this._optionsObj = optionsObj;
        this._configManager = configManager;
        this._initializeOptions();
    }

    /**
     * Returns all registered options as an array
     */
    public toArray(): Opt[] {
        return this._options;
    }

    /**
     * Resets all options to their initial values
     *
     * @returns Newline-separated list of IDs for options that were reset
     */
    public async reset(): Promise<string> {
        const results = await this._resetAllOptions(this._options);
        return results.join('\n');
    }

    /**
     * Registers a callback for options matching the provided dependency prefixes
     *
     * @param optionsToWatch - Array of option ID prefixes to watch
     * @param callback - Function to call when matching options change
     */
    public handler(optionsToWatch: string[], callback: () => void): void {
        optionsToWatch.forEach((prefix) => {
            const matchingOptions = this._options.filter((opt) => opt.id.startsWith(prefix));

            matchingOptions.forEach((opt) => opt.subscribe(callback));
        });
    }

    /**
     * Updates options based on changes to the config file
     *
     * Synchronizes in-memory option values with the current state of the config file
     */
    public handleConfigFileChange(): void {
        const newConfig = this._configManager.readConfig();

        for (const opt of this._options) {
            // Derived options are runtime-computed; config changes only affect their inputs.
            if (opt.derive) continue;

            const newVal = this._configManager.getNestedValue(newConfig, opt.id);

            if (newVal === undefined) {
                opt.reset({ writeDisk: false });
                continue;
            }

            const oldVal = opt.get();
            if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
                opt.set(newVal as any, { writeDisk: false });
            }
        }

        this._scheduleDerivedRecompute();
    }

    /**
     * Creates the enhanced options object with additional methods
     *
     * @returns The original options object enhanced with registry methods
     */
    public createEnhancedOptions(): T & MkOptionsResult {
        return Object.assign(this._optionsObj, {
            toArray: this.toArray.bind(this),
            reset: this.reset.bind(this),
            handler: this.handler.bind(this),
        });
    }

    private _setupDerivedOptions(): void {
        this._derived = this._options.filter((o) => typeof o.derive === 'function');
        if (this._derived.length === 0) return;

        for (const opt of this._derived) {
            if (!opt.deps || opt.deps.length === 0) {
                console.error(
                    `[options] Derived option '${opt.id}' is missing 'deps'. ` +
                    `It will not update reactively until you add deps: [...]`,
                );
            }
        }

        this._derivedOrder = this._topoSortDerivedOptions(this._derived);

        // Subscribe to all dependency options (excluding derived options themselves).
        const depOptIds = new Set<string>();

        for (const derivedOpt of this._derived) {
            for (const prefix of derivedOpt.deps ?? []) {
                for (const opt of this._options) {
                    if (opt.derive) continue;
                    if (opt.id.startsWith(prefix)) depOptIds.add(opt.id);
                }
            }
        }

        const schedule = this._scheduleDerivedRecompute.bind(this);
        for (const id of depOptIds) {
            const opt = this._options.find((o) => o.id === id);
            opt?.subscribe(schedule);
        }

        // Initial compute
        this._recomputeDerivedOptions();
    }

    private _scheduleDerivedRecompute(): void {
        if (this._derived.length === 0) return;
        if (this._derivedRecomputeScheduled) return;

        this._derivedRecomputeScheduled = true;

        // Microtask batching: multiple option updates in the same tick only recompute once.
        Promise.resolve().then(() => {
            this._derivedRecomputeScheduled = false;
            this._recomputeDerivedOptions();
        });
    }

    private _recomputeDerivedOptions(): void {
        if (this._derivedOrder.length === 0) return;

        for (const opt of this._derivedOrder) {
            try {
                const next = opt.derive!(this._optionsObj);
                opt.set(next as any, { writeDisk: false });
            } catch (error) {
                errorHandler(error);
            }
        }
    }

    private _topoSortDerivedOptions(derived: Opt[]): Opt[] {
        const byId = new Map<string, Opt>(derived.map((o) => [o.id, o]));

        const indegree = new Map<string, number>();
        const edges = new Map<string, Set<string>>();

        for (const opt of derived) {
            indegree.set(opt.id, 0);
            edges.set(opt.id, new Set());
        }

        const addEdge = (fromId: string, toId: string) => {
            if (fromId === toId) return;
            const out = edges.get(fromId);
            if (!out || out.has(toId)) return;
            out.add(toId);
            indegree.set(toId, (indegree.get(toId) ?? 0) + 1);
        };

        // Build edges: depDerived -> derived
        for (const target of derived) {
            for (const prefix of target.deps ?? []) {
                for (const candidate of derived) {
                    if (candidate.id === target.id) continue;
                    if (!candidate.id.startsWith(prefix)) continue;
                    addEdge(candidate.id, target.id);
                }
            }
        }

        // Kahn
        const queue: string[] = [];
        for (const [id, deg] of indegree.entries()) {
            if (deg === 0) queue.push(id);
        }

        const ordered: Opt[] = [];
        while (queue.length > 0) {
            const id = queue.shift()!;
            const opt = byId.get(id);
            if (opt) ordered.push(opt);

            for (const nextId of edges.get(id) ?? []) {
                indegree.set(nextId, (indegree.get(nextId) ?? 0) - 1);
                if ((indegree.get(nextId) ?? 0) === 0) queue.push(nextId);
            }
        }

        if (ordered.length !== derived.length) {
            console.error(
                `[options] Derived option dependency cycle detected. Falling back to declaration order.`,
            );
            return derived;
        }

        return ordered;
    }

    /**
     * Initializes the option registry by collecting options and setting up monitoring
     */
    private _initializeOptions(): void {
        this._options = this._collectOptions(this._optionsObj);
        this._initializeFromConfig();

        // After base options load from disk, wire up derived options and compute them once.
        this._setupDerivedOptions();

        this._configManager.onConfigChanged(() => {
            this.handleConfigFileChange();
        });
    }

    /**
     * Initializes option values from the saved configuration
     */
    private _initializeFromConfig(): void {
        const config = this._configManager.readConfig();

        for (const opt of this._options) {
            opt.init(config);
        }
    }

    /**
     * Recursively collects all option instances from an object structure
     *
     * @param sourceObject - The object to search for options
     * @param path - Current path in the object hierarchy
     * @returns Array of found option instances
     */
    private _collectOptions(sourceObject: Record<string, unknown>, path = ''): Opt[] {
        const result: Opt[] = [];

        try {
            for (const key in sourceObject) {
                const value = sourceObject[key];
                const id = path ? `${path}.${key}` : key;

                if (value instanceof Opt) {
                    value.id = id;
                    result.push(value);
                } else if (this._isNestedObject(value)) {
                    result.push(...this._collectOptions(value, id));
                }
            }
        } catch (error) {
            errorHandler(error);
        }

        return result;
    }

    /**
     * Resets all options to their initial values with a delay between operations
     *
     * @param opts - Array of options to reset
     * @returns Array of IDs for options that were reset
     */
    private async _resetAllOptions(opts: Opt[]): Promise<string[]> {
        const results: string[] = [];

        for (const opt of opts) {
            const id = opt.reset();

            if (id !== undefined) {
                results.push(id);
                await this._sleep(50);
            }
        }

        return results;
    }

    /**
     * Simple promise-based sleep function
     *
     * @param ms - Milliseconds to sleep
     */
    private _sleep(ms = 0): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Type guard to check if a value is a non-null object that can be traversed
     *
     * @param value - The value to check
     */
    private _isNestedObject(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null;
    }
}

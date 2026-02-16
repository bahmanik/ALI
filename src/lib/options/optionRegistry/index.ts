import { Opt } from "../opt";
import { errorHandler } from "src/lib/errors/handler";
import type { ConfigManager } from "../configManager";
import type { MkOptionsResult, OptionsObject } from "../types";

export class OptionRegistry<T extends OptionsObject> {
    private _options: Opt<unknown, T, unknown>[] = [];
    private _optionsObj: T;
    private _configManager: ConfigManager;

    private _derived: Opt<unknown, T, unknown>[] = [];
    private _derivedOrder: Opt<unknown, T, unknown>[] = [];
    private _derivedRecomputeScheduled = false;

    constructor(optionsObj: T, configManager: ConfigManager) {
        this._optionsObj = optionsObj;
        this._configManager = configManager;
        this._initializeOptions();
    }

    public toArray(): Opt[] {
        return this._options;
    }

    public async reset(): Promise<string> {
        const results = await this._resetAllOptions(this._options);
        return results.join("\n");
    }

    public handler(optionsToWatch: string[], callback: () => void): void {
        optionsToWatch.forEach((prefix) => {
            const matchingOptions = this._options.filter((opt) =>
                opt.id.startsWith(prefix)
            );
            matchingOptions.forEach((opt) => opt.subscribe(callback));
        });
    }

    public handleConfigFileChange(): void {
        const newConfig = this._configManager.readConfig();

        for (const opt of this._options) {
            if (opt.derive) continue;

            const newVal = this._configManager.getNestedValue(newConfig, opt.id);

            if (newVal === undefined) {
                opt.reset({ writeDisk: false });
                continue;
            }

            const oldVal = opt.get();
            if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
                // config JSON is untyped — keep runtime the same, no `any`.
                opt.set(newVal as unknown, { writeDisk: false });
            }
        }

        this._scheduleDerivedRecompute();
    }

    public createEnhancedOptions(): T & MkOptionsResult {
        return Object.assign(this._optionsObj, {
            toArray: this.toArray.bind(this),
            reset: this.reset.bind(this),
            handler: this.handler.bind(this),
        });
    }


    private _expandDepsToOpts(target: Opt<unknown, T, unknown>): Opt<unknown, T, unknown>[] {
        if (!target.deps || target.deps.length === 0) return [];

        const ctx = {
            root: this._optionsObj,
            self: target.selfRef,
        } as unknown as { root: T; self: unknown };

        const expanded: Opt<unknown, T, unknown>[] = [];

        for (const d of target.deps) {
            try {
                const input = (d as unknown as { resolve: (c: unknown) => unknown }).resolve(ctx as unknown);
                expanded.push(...this._expandDepInput(input));
            } catch (error) {
                errorHandler(error);
            }
        }

        // de-dupe by id
        const uniq = new Map<string, Opt<unknown, T, unknown>>();
        for (const opt of expanded) uniq.set(opt.id, opt);
        return [...uniq.values()];
    }

    private _expandDepInput(input: unknown): Opt<unknown, T, unknown>[] {
        if (input instanceof Opt) return [input as Opt<unknown, T, unknown>];

        if (typeof input === "object" && input !== null) {
            const kind = (input as { kind?: unknown }).kind;

            if (kind === "prefix") {
                const prefix = (input as { prefix?: unknown }).prefix;
                if (typeof prefix !== "string") return [];
                return this._options.filter((o) => o.id.startsWith(prefix));
            }

            if (kind === "subtree") {
                const node = (input as { node?: unknown }).node;
                return this._collectOptRefsFromObject(node);
            }
        }

        return [];
    }

    private _collectOptRefsFromObject(node: unknown): Opt<unknown, T, unknown>[] {
        const out: Opt<unknown, T, unknown>[] = [];
        const seen = new WeakSet<object>();

        const walk = (val: unknown) => {
            if (val instanceof Opt) {
                out.push(val as Opt<unknown, T, unknown>);
                return;
            }

            if (typeof val !== "object" || val === null) return;
            if (seen.has(val)) return;
            seen.add(val);

            for (const key of Object.keys(val as Record<string, unknown>)) {
                walk((val as Record<string, unknown>)[key]);
            }
        };

        walk(node);

        // de-dupe
        const uniq = new Map<string, Opt<unknown, T, unknown>>();
        for (const opt of out) uniq.set(opt.id, opt);
        return [...uniq.values()];
    }

    private _setupDerivedOptions(): void {
        this._derived = this._options.filter((o) => typeof o.derive === "function");
        if (this._derived.length === 0) return;

        for (const opt of this._derived) {
            if (!opt.deps || opt.deps.length === 0) {
                console.error(
                    `[options] Derived option '${opt.id}' is missing 'deps'. It will not update reactively until you add deps: [...]`
                );
            }
        }

        this._derivedOrder = this._topoSortDerivedOptions(this._derived);

        const depOptIds = new Set<string>();
        for (const derivedOpt of this._derived) {
            for (const depOpt of this._expandDepsToOpts(derivedOpt)) {
                if (depOpt.derive) continue;
                depOptIds.add(depOpt.id);
            }
        }

        const schedule = this._scheduleDerivedRecompute.bind(this);
        for (const id of depOptIds) {
            const opt = this._options.find((o) => o.id === id);
            opt?.subscribe(schedule);
        }

        this._recomputeDerivedOptions();
    }

    private _scheduleDerivedRecompute(): void {
        if (this._derived.length === 0) return;
        if (this._derivedRecomputeScheduled) return;

        this._derivedRecomputeScheduled = true;

        Promise.resolve().then(() => {
            this._derivedRecomputeScheduled = false;
            this._recomputeDerivedOptions();
        });
    }

    private _recomputeDerivedOptions(): void {
        if (this._derivedOrder.length === 0) return;

        for (const opt of this._derivedOrder) {
            try {
                const next = opt.derive!({
                    root: this._optionsObj,
                    self: opt.selfRef,
                });

                opt.set(next as unknown, { writeDisk: false });
            } catch (error) {
                errorHandler(error);
            }
        }
    }

    private _topoSortDerivedOptions(
        derived: Opt<unknown, T, unknown>[]
    ): Opt<unknown, T, unknown>[] {
        const byId = new Map<string, Opt<unknown, T, unknown>>(
            derived.map((o) => [o.id, o])
        );

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

        for (const target of derived) {
            const derivedDeps = this._expandDepsToOpts(target)
                .filter((o) => typeof o.derive === "function")
                .map((o) => o.id);

            for (const depId of derivedDeps) {
                if (!byId.has(depId)) continue;
                addEdge(depId, target.id);
            }
        }

        const queue: string[] = [];
        for (const [id, deg] of indegree.entries()) {
            if (deg === 0) queue.push(id);
        }

        const ordered: Opt<unknown, T, unknown>[] = [];
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
                `[options] Derived option dependency cycle detected. Falling back to declaration order.`
            );
            return derived;
        }

        return ordered;
    }

    private _initializeOptions(): void {
        // IMPORTANT:
        // We collect options *per top-level module* so `self` can be the module subtree,
        // not the immediate nested object that contains the option.
        this._options = this._collectTopLevelModules(this._optionsObj as unknown as Record<string, unknown>);
        this._initializeFromConfig();
        this._setupDerivedOptions();

        this._configManager.onConfigChanged(() => {
            this.handleConfigFileChange();
        });
    }

    private _collectTopLevelModules(root: Record<string, unknown>): Opt<unknown, T, unknown>[] {
        const result: Opt<unknown, T, unknown>[] = [];

        for (const key of Object.keys(root)) {
            const subtree = root[key];
            if (this._isNestedObject(subtree)) {
                result.push(
                    ...this._collectOptions(subtree, key, subtree)
                );
            }
        }

        return result;
    }

    private _initializeFromConfig(): void {
        const config = this._configManager.readConfig();
        for (const opt of this._options) opt.init(config);
    }

    private _collectOptions(
        sourceObject: Record<string, unknown>,
        path = "",
        moduleRoot: unknown
    ): Opt<unknown, T, unknown>[] {
        const result: Opt<unknown, T, unknown>[] = [];

        try {
            for (const key in sourceObject) {
                const value = sourceObject[key];
                const id = path ? `${path}.${key}` : key;

                if (value instanceof Opt) {
                    const opt = value as Opt<unknown, T, unknown>;
                    opt.id = id;

                    // IMPORTANT:
                    // self must be the *host object that owns this opt property*,
                    // so derive can safely do self.<prop>.get().
                    opt.selfRef = sourceObject as unknown;

                    result.push(opt);
                } else if (this._isNestedObject(value)) {
                    result.push(...this._collectOptions(value, id, moduleRoot));
                }
            }
        } catch (error) {
            errorHandler(error);
        }

        return result;
    }

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

    private _sleep(ms = 0): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private _isNestedObject(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }
}

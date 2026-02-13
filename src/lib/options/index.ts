import { ConfigManager } from "./configManager";
import { Opt } from "./opt";
import { OptionRegistry } from "./optionRegistry";
import { dep } from "./dep";
import type { OptionsRoot } from "src/lib/options/root";
import type {
    MkOptionsResult,
    ModuleFactory,
    OptFactory,
    OptProps,
    Derive,
    DeriveCtx,
    DepCtx,
    DepRef,
    DepInput,
} from "./types";

const configManager = new ConfigManager(CONFIG_FILE);

/**
 * Legacy/global opt() (still works), but modules should prefer injected opt().
 */
export function opt<T>(
    initial: T,
    props?: OptProps<OptionsRoot, unknown, T>
): Opt<T, OptionsRoot, unknown> {
    return new Opt<T, OptionsRoot, unknown>(initial, configManager, props);
}

/**
 * Create a typed opt() factory bound to Root and Self.
 * Runtime behavior is identical to calling `new Opt(...)`; this is purely typing.
 */
export function createOptFactory<Root, Self>(): OptFactory<Root, Self> {
    return <T>(initial: T, props?: OptProps<Root, Self, T>) =>
        new Opt<T, Root, Self>(initial, configManager, props);
}

/**
 * DI-based root builder.
 */
export function mkOptions<Root extends OptionsRoot>(
    modules: { [K in keyof Root]: ModuleFactory<Root, Root[K]> }
): Root & MkOptionsResult {
    const built = {} as Root;

    const buildModule = <K extends keyof Root>(key: K): Root[K] => {
        const factory = modules[key];
        const injectedOpt = createOptFactory<Root, Root[K]>();
        return factory(injectedOpt);
    };

    for (const key of Object.keys(modules) as (keyof Root)[]) {
        built[key] = buildModule(key);
    }

    const registry = new OptionRegistry(built, configManager);
    return registry.createEnhancedOptions();
}

export { Opt };
export { dep };
export type { OptionsRoot };
export type { OptFactory, ModuleFactory, OptProps, DeriveCtx, Derive, DepCtx, DepRef, DepInput };

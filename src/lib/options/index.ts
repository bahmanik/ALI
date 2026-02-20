import { ConfigManager } from "./configManager";
import { OptImpl } from "./opt";
import { OptionRegistry } from "./optionRegistry";
import { dep } from "./dep";
import { CONFIG_FILE } from "src/lib/session/api";
// IMPORTANT: use the same module specifier as app boot (`src/lib/options/runtime`)
// so runtime state is shared even under path-alias resolvers.
import { registerOptionsRuntime } from "src/lib/options/runtime";
import type { OptionsRoot } from "src/lib/options/root";
import type {
    MkOptionsResult,
    ModuleFactory,
    OptFactory,
    OptConfig,
} from "./types";

const configManager = new ConfigManager(CONFIG_FILE);
console.log("starting config manager")

/**
 * Create a typed opt() factory bound to Root and Self.
 * Runtime behavior is identical to calling `new Opt(...)`; this is purely typing.
 */
export function createOptFactory<Root, Self>(): OptFactory<Root, Self> {
    return <T>(initial: T, cfg?: OptConfig<Root, Self, T>) =>
        new OptImpl<T>(initial, configManager, cfg as unknown);
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
    registerOptionsRuntime(registry, configManager);
    return registry.createEnhancedOptions();
}

export type { Opt } from "./opt";
export { dep };
export type { OptionsRoot };
export type { OptFactory, ModuleFactory, OptConfig };

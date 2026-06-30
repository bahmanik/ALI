import { CONFIG_FILE } from '../session';
import { ConfigManager } from './configManager';
import { Opt } from './opt';
import { OptionRegistry } from './optionRegistry';
import { registerOptionsRuntime } from './runtime';
import { MkOptionsResult, OptionsObject, OptProps } from './types';

const CONFIG_PATH = CONFIG_FILE;

export const configManager = new ConfigManager(CONFIG_PATH);

/**
 * Creates an option with the specified initial value
 */
export function opt<T>(initial: T, props?: OptProps<T>): Opt<T> {
    return new Opt(initial, configManager, props);
}

/**
 * Creates and initializes an options management system
 */
export function mkOptions<T extends OptionsObject>(optionsObj: T): T & MkOptionsResult {
    const registry = new OptionRegistry(optionsObj, configManager);

    registerOptionsRuntime(registry, configManager);
    return registry.createEnhancedOptions();
}

export { Opt };
